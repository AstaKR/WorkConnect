"""
Management command to quickly configure an AI provider and assign it to all features.

Usage:
    python manage.py setup_ai_provider --provider groq --key sk-xxx --model llama-3.1-8b-instant
    python manage.py setup_ai_provider --provider gemini --key AIza... --model gemini-1.5-flash
    python manage.py setup_ai_provider --provider groq --key sk-xxx  # uses default model
"""
from django.core.management.base import BaseCommand, CommandError
from ai_features.models import AIProviderConfig, AIFeatureConfig
from ai_features.encryption import fernet_encrypt

DEFAULTS = {
    'groq':   'llama-3.1-8b-instant',   # fast, cheap, free tier
    'gemini': 'gemini-1.5-flash',
    'claude': 'claude-3-haiku-20240307',
    'openai': 'gpt-4o-mini',
}

DISPLAY_NAMES = {
    'groq':   'Groq Llama',
    'gemini': 'Google Gemini Flash',
    'claude': 'Anthropic Claude Haiku',
    'openai': 'OpenAI GPT-4o Mini',
    'ollama': 'Ollama Local',
    'custom': 'Custom Endpoint',
}


class Command(BaseCommand):
    help = 'Configure an AI provider and assign it to all AI features'

    def add_arguments(self, parser):
        parser.add_argument('--provider', required=True,
                            choices=['groq', 'gemini', 'claude', 'openai', 'ollama', 'custom'],
                            help='Provider type')
        parser.add_argument('--key', required=False, default='',
                            help='API key (plain text — will be encrypted in DB)')
        parser.add_argument('--model', required=False, default='',
                            help='Model name (uses sensible default if omitted)')
        parser.add_argument('--test', action='store_true',
                            help='Test the provider after saving')

    def handle(self, *args, **options):
        provider_key = options['provider']
        api_key = options['key']
        model = options['model'] or DEFAULTS.get(provider_key, '')

        if not model:
            raise CommandError(f"No default model for '{provider_key}' — pass --model explicitly.")

        # Upsert provider
        provider, created = AIProviderConfig.objects.update_or_create(
            provider_key=provider_key,
            defaults={
                'display_name': DISPLAY_NAMES.get(provider_key, provider_key.title()),
                'model_name': model,
                'is_active': True,
            },
        )
        if api_key:
            provider.encrypted_api_key = fernet_encrypt(api_key)
            provider.save()

        action = 'Created' if created else 'Updated'
        self.stdout.write(self.style.SUCCESS(f'{action} provider: {provider.display_name} ({model})'))

        # Assign to all features
        updated = AIFeatureConfig.objects.update(primary_provider=provider)
        self.stdout.write(self.style.SUCCESS(f'Assigned to {updated} AI features.'))

        if options['test']:
            self._run_test(provider_key, model)

    def _run_test(self, provider_key, model):
        from ai_features.helpers import call_feature
        self.stdout.write('Testing AI call (detect_priority)...')
        try:
            result = call_feature('detect_priority', 'Fix the login bug', user=None)
            self.stdout.write(self.style.SUCCESS(f'Test passed! Response: {result!r}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Test FAILED: {e}'))
