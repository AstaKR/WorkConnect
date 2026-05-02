import pytest
from unittest.mock import patch, MagicMock


@pytest.fixture
def mock_feature_config():
    config = MagicMock()
    config.feature_key = 'spell_check'
    config.is_enabled = True
    config.max_tokens = 200
    config.custom_prompt_template = ''
    config.primary_provider = MagicMock()
    config.primary_provider.provider_key = 'groq'
    config.primary_provider.model_name = 'llama-3.1-70b-versatile'
    config.primary_provider.base_url = ''
    config.primary_provider.encrypted_api_key = ''
    config.fallback_provider = None
    return config


@pytest.fixture
def mock_user():
    user = MagicMock()
    user.pk = 1
    return user


class TestBuildProvider:
    def test_raises_for_unknown_provider_key(self):
        from ai_features.helpers import _build_provider
        config = MagicMock()
        config.provider_key = 'unknown_provider'
        config.model_name = 'model'
        config.base_url = ''
        config.encrypted_api_key = ''
        with pytest.raises(ValueError, match="Unknown provider key"):
            _build_provider(config)

    def test_env_var_takes_priority_over_db_key(self):
        from ai_features.helpers import _build_provider
        config = MagicMock()
        config.provider_key = 'groq'
        config.model_name = 'llama-3.1-70b-versatile'
        config.base_url = ''
        config.encrypted_api_key = 'some-encrypted-value'
        with patch.dict('os.environ', {'GROQ_API_KEY': 'env-key-123'}):
            with patch('ai_features.providers.groq.GroqProvider.__init__', return_value=None) as mock_init:
                _build_provider(config)
                call_kwargs = mock_init.call_args[1]
                assert call_kwargs['api_key'] == 'env-key-123'

    def test_ollama_uses_default_base_url_when_none_stored(self):
        from ai_features.helpers import _build_provider
        from ai_features.providers.ollama import OllamaProvider
        config = MagicMock()
        config.provider_key = 'ollama'
        config.model_name = 'llama3'
        config.base_url = ''  # nothing stored in DB
        config.encrypted_api_key = ''
        provider = _build_provider(config)
        assert isinstance(provider, OllamaProvider)
        # Default base_url should be used, not empty string
        assert provider.base_url == 'http://localhost:11434'


class TestCallFeature:
    # AIFeatureConfig and AIUsageLog are imported locally inside call_feature,
    # so we must patch them at their source module, not at ai_features.helpers.
    @patch('ai_features.models.AIUsageLog')
    @patch('ai_features.helpers._build_provider')
    @patch('ai_features.models.AIFeatureConfig')
    def test_returns_result_on_primary_success(
        self, mock_config_cls, mock_build, mock_log, mock_feature_config, mock_user
    ):
        from ai_features.helpers import call_feature
        mock_config_cls.objects.select_related.return_value.get.return_value = mock_feature_config
        mock_provider = MagicMock()
        mock_provider.complete.return_value = 'corrected text'
        mock_build.return_value = mock_provider
        mock_log.objects.create = MagicMock()

        result = call_feature('spell_check', 'helllo', mock_user)

        assert result == 'corrected text'
        mock_log.objects.create.assert_called_once()
        call_kwargs = mock_log.objects.create.call_args[1]
        assert call_kwargs['success'] is True

    @patch('ai_features.models.AIUsageLog')
    @patch('ai_features.helpers._build_provider')
    @patch('ai_features.models.AIFeatureConfig')
    def test_falls_back_when_primary_fails(
        self, mock_config_cls, mock_build, mock_log, mock_feature_config, mock_user
    ):
        from ai_features.helpers import call_feature
        mock_feature_config.fallback_provider = MagicMock()
        mock_feature_config.fallback_provider.provider_key = 'claude'
        mock_feature_config.fallback_provider.model_name = 'claude-3-haiku-20240307'
        mock_feature_config.fallback_provider.base_url = ''
        mock_feature_config.fallback_provider.encrypted_api_key = ''
        mock_config_cls.objects.select_related.return_value.get.return_value = mock_feature_config

        failing_provider = MagicMock()
        failing_provider.complete.side_effect = RuntimeError('primary failed')
        success_provider = MagicMock()
        success_provider.complete.return_value = 'fallback result'
        mock_build.side_effect = [failing_provider, success_provider]
        mock_log.objects.create = MagicMock()

        result = call_feature('spell_check', 'test', mock_user)
        assert result == 'fallback result'

    @patch('ai_features.models.AIUsageLog')
    @patch('ai_features.helpers._build_provider')
    @patch('ai_features.models.AIFeatureConfig')
    def test_raises_runtime_error_when_both_fail(
        self, mock_config_cls, mock_build, mock_log, mock_feature_config, mock_user
    ):
        from ai_features.helpers import call_feature
        mock_feature_config.fallback_provider = MagicMock()
        mock_feature_config.fallback_provider.provider_key = 'claude'
        mock_feature_config.fallback_provider.model_name = 'claude-3-haiku-20240307'
        mock_feature_config.fallback_provider.base_url = ''
        mock_feature_config.fallback_provider.encrypted_api_key = ''
        mock_config_cls.objects.select_related.return_value.get.return_value = mock_feature_config

        failing_provider = MagicMock()
        failing_provider.complete.side_effect = RuntimeError('failed')
        mock_build.return_value = failing_provider
        mock_log.objects.create = MagicMock()

        with pytest.raises(RuntimeError, match="Both primary and fallback"):
            call_feature('spell_check', 'test', mock_user)
