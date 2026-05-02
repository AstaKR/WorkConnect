from django.db import models
from django.conf import settings


class AIProviderConfig(models.Model):
    PROVIDER_KEYS = [
        ('groq', 'Groq'),
        ('claude', 'Anthropic Claude'),
        ('openai', 'OpenAI'),
        ('gemini', 'Google Gemini'),
        ('ollama', 'Ollama (Local)'),
        ('custom', 'Custom Endpoint'),
    ]
    provider_key = models.CharField(max_length=20, choices=PROVIDER_KEYS)
    display_name = models.CharField(max_length=100)
    base_url = models.CharField(max_length=255, blank=True, default='')
    model_name = models.CharField(max_length=100)
    encrypted_api_key = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.display_name} ({self.provider_key})"


class AIFeatureConfig(models.Model):
    feature_key = models.CharField(max_length=40, unique=True)
    display_name = models.CharField(max_length=100)
    primary_provider = models.ForeignKey(
        AIProviderConfig, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='primary_features'
    )
    fallback_provider = models.ForeignKey(
        AIProviderConfig, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='fallback_features'
    )
    is_enabled = models.BooleanField(default=True)
    custom_prompt_template = models.TextField(
        blank=True, default='',
        help_text='Optional. Use {input} as placeholder for user content.'
    )
    max_tokens = models.IntegerField(default=300)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.display_name


class AIUsageLog(models.Model):
    feature_key = models.CharField(max_length=40)
    provider_key = models.CharField(max_length=20)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='ai_usage_logs'
    )
    task_id = models.IntegerField(null=True, blank=True)
    tokens_used = models.IntegerField(default=0)
    latency_ms = models.IntegerField(default=0)
    success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.feature_key}/{self.provider_key} @ {self.created_at:%Y-%m-%d %H:%M}"
