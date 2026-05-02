from rest_framework import serializers
from .models import AIProviderConfig, AIFeatureConfig, AIUsageLog
from .encryption import fernet_encrypt


class AIProviderConfigSerializer(serializers.ModelSerializer):
    api_key = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    has_key = serializers.SerializerMethodField()

    class Meta:
        model = AIProviderConfig
        fields = [
            'id', 'provider_key', 'display_name', 'base_url', 'model_name',
            'is_active', 'api_key', 'has_key', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_has_key(self, obj):
        return bool(obj.encrypted_api_key)

    def create(self, validated_data):
        api_key = validated_data.pop('api_key', '')
        instance = AIProviderConfig(**validated_data)
        if api_key:
            instance.encrypted_api_key = fernet_encrypt(api_key)
        instance.save()
        return instance

    def update(self, instance, validated_data):
        api_key = validated_data.pop('api_key', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        if api_key:  # only update if non-empty string provided
            instance.encrypted_api_key = fernet_encrypt(api_key)
        instance.save()
        return instance


class AIFeatureConfigSerializer(serializers.ModelSerializer):
    primary_provider_name = serializers.CharField(
        source='primary_provider.display_name', read_only=True, default=None
    )
    fallback_provider_name = serializers.CharField(
        source='fallback_provider.display_name', read_only=True, default=None
    )
    max_tokens = serializers.IntegerField(min_value=1, max_value=4000, required=False)

    class Meta:
        model = AIFeatureConfig
        fields = [
            'id', 'feature_key', 'display_name',
            'primary_provider', 'primary_provider_name',
            'fallback_provider', 'fallback_provider_name',
            'is_enabled', 'max_tokens', 'custom_prompt_template', 'updated_at',
        ]
        read_only_fields = ['id', 'feature_key', 'display_name', 'updated_at']
