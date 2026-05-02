import os
import re
import time
import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .models import AIProviderConfig
    from .providers.base import BaseAIProvider
    from django.contrib.auth.base_user import AbstractBaseUser

logger = logging.getLogger(__name__)

# Maps provider_key → environment variable name for the API key
_ENV_KEY_MAP = {
    'groq':   'GROQ_API_KEY',
    'claude': 'ANTHROPIC_API_KEY',
    'openai': 'OPENAI_API_KEY',
    'gemini': 'GEMINI_API_KEY',
    'ollama': '',       # Ollama is a local provider — no API key needed
    'custom': 'CUSTOM_API_KEY',
}

_MAX_PROMPT_CHARS = 2000  # ~500 tokens; keeps inputs within all provider context limits


def _safe_error(exc: Exception) -> str:
    """Return a sanitised error string safe for storage — strips bearer/auth fragments."""
    msg = str(exc)[:500]
    # Remove anything that looks like a Bearer token or API key
    msg = re.sub(r'Bearer\s+\S+', 'Bearer [REDACTED]', msg, flags=re.IGNORECASE)
    msg = re.sub(r'(api[_-]?key[=:\s]+)\S+', r'\1[REDACTED]', msg, flags=re.IGNORECASE)
    return msg


def _build_provider(provider_config: 'AIProviderConfig') -> 'BaseAIProvider':
    """Instantiate the correct provider class from an AIProviderConfig instance."""
    from .providers.groq import GroqProvider
    from .providers.claude import ClaudeProvider
    from .providers.openai_provider import OpenAIProvider
    from .providers.gemini import GeminiProvider
    from .providers.ollama import OllamaProvider
    from .providers.custom import CustomProvider
    from .encryption import fernet_decrypt

    classes = {
        'groq':   GroqProvider,
        'claude': ClaudeProvider,
        'openai': OpenAIProvider,
        'gemini': GeminiProvider,
        'ollama': OllamaProvider,
        'custom': CustomProvider,
    }

    pkey = provider_config.provider_key
    cls = classes.get(pkey)
    if cls is None:
        raise ValueError(f"Unknown provider key: '{pkey}'")

    # Env var overrides DB key
    env_var = _ENV_KEY_MAP.get(pkey, '')
    api_key = (os.environ.get(env_var, '') if env_var else '') or ''
    if not api_key and provider_config.encrypted_api_key:
        try:
            api_key = fernet_decrypt(provider_config.encrypted_api_key)
        except Exception as dec_err:
            logger.error(
                "Failed to decrypt API key for provider '%s' (id=%s): %s",
                pkey, provider_config.pk, dec_err
            )
            api_key = ''

    # Last resort: check legacy SystemSettings for a plain-text key
    if not api_key:
        _LEGACY_KEY_MAP = {
            'gemini': 'gemini_api_key',
            'groq': 'groq_api_key',
            'claude': 'anthropic_api_key',
            'openai': 'openai_api_key',
        }
        legacy_field = _LEGACY_KEY_MAP.get(pkey)
        if legacy_field:
            try:
                from settings_app.models import SystemSettings
                ss = SystemSettings.load()
                api_key = getattr(ss, legacy_field, '') or ''
                if api_key:
                    logger.info(
                        "Using legacy SystemSettings.%s for provider '%s'.",
                        legacy_field, pkey,
                    )
            except Exception as legacy_err:
                logger.debug("Could not read legacy SystemSettings key: %s", legacy_err)

    # Providers that require a key (ollama and custom endpoints may not need one)
    _KEY_REQUIRED = {'groq', 'claude', 'openai', 'gemini'}
    if pkey in _KEY_REQUIRED and not api_key:
        raise ValueError(
            f"No API key configured for provider '{provider_config.display_name}'. "
            f"Add {_ENV_KEY_MAP.get(pkey, 'the key')} to your .env file or set it in "
            f"System Settings → AI Integration."
        )

    kwargs: dict = dict(api_key=api_key, model_name=provider_config.model_name)
    if provider_config.base_url:
        kwargs['base_url'] = provider_config.base_url
    return cls(**kwargs)


def call_feature(feature_key: str, prompt: str, user: 'AbstractBaseUser | None', task_id: int | None = None) -> str:
    """
    Resolve provider for feature_key, call it, log usage, mark task ai_assisted.

    Raises:
        ValueError  — feature disabled / no provider configured
        RuntimeError — provider call(s) failed
    """
    from .models import AIFeatureConfig, AIUsageLog

    try:
        config = AIFeatureConfig.objects.select_related(
            'primary_provider', 'fallback_provider'
        ).get(feature_key=feature_key, is_enabled=True)
    except AIFeatureConfig.DoesNotExist:
        logger.warning("AI feature '%s' is disabled or not configured.", feature_key)
        raise ValueError(f"AI feature '{feature_key}' is disabled or not configured.")

    if not config.primary_provider:
        logger.warning("No provider assigned to AI feature '%s'.", feature_key)
        raise ValueError(f"No provider assigned to feature '{feature_key}'. Configure it in System Settings.")

    # Sanitise + apply optional prompt template
    safe_prompt = prompt[:_MAX_PROMPT_CHARS]
    if config.custom_prompt_template and '{input}' in config.custom_prompt_template:
        final_prompt = config.custom_prompt_template.replace('{input}', safe_prompt)
    else:
        final_prompt = safe_prompt

    def _attempt(provider_config) -> str:
        provider = _build_provider(provider_config)
        start = time.monotonic()
        try:
            result = provider.complete(final_prompt, max_tokens=config.max_tokens)
            latency = int((time.monotonic() - start) * 1000)
            AIUsageLog.objects.create(
                feature_key=feature_key,
                provider_key=provider_config.provider_key,
                user=user,
                task_id=task_id,
                latency_ms=latency,
                success=True,
            )
            return result
        except Exception as exc:
            latency = int((time.monotonic() - start) * 1000)
            AIUsageLog.objects.create(
                feature_key=feature_key,
                provider_key=provider_config.provider_key,
                user=user,
                task_id=task_id,
                latency_ms=latency,
                success=False,
                error_message=_safe_error(exc),
            )
            raise

    try:
        result = _attempt(config.primary_provider)
    except Exception as primary_err:
        if config.fallback_provider:
            try:
                result = _attempt(config.fallback_provider)
            except Exception as fallback_err:
                raise RuntimeError(
                    f"Both primary and fallback providers failed for '{feature_key}'. "
                    f"Primary: {_safe_error(primary_err)}. Fallback: {_safe_error(fallback_err)}."
                ) from primary_err
        else:
            raise RuntimeError(
                f"AI provider failed for '{feature_key}': {_safe_error(primary_err)}"
            ) from primary_err

    # Mark task as AI-assisted when a specific task was targeted
    if task_id is not None:
        from reports.models import TaskEntry
        TaskEntry.objects.filter(pk=task_id, report__user=user).update(ai_assisted=True)

    return result
