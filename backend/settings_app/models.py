from django.db import models
from django.conf import settings

class SystemSettings(models.Model):
    PROVIDER_CHOICES = [
        ('claude', 'Claude'),
        ('gemini', 'Gemini'),
        ('groq', 'Groq'),
        ('openai', 'OpenAI'),
    ]
    
    ai_provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES, default='gemini')
    anthropic_api_key = models.CharField(max_length=255, blank=True, null=True)
    gemini_api_key = models.CharField(max_length=255, blank=True, null=True)
    groq_api_key = models.CharField(max_length=255, blank=True, null=True)
    openai_api_key = models.CharField(max_length=255, blank=True, null=True)
    
    company_name = models.CharField(max_length=100, default='ER Work Report System')
    company_logo_url = models.URLField(blank=True, null=True)
    company_logo = models.ImageField(upload_to='logos/', blank=True, null=True)
    
    # Advanced Options
    maintenance_mode = models.BooleanField(default=False)
    require_location = models.BooleanField(default=False)
    
    # SMTP Config
    smtp_host = models.CharField(max_length=255, blank=True, null=True)
    smtp_port = models.IntegerField(default=587)
    smtp_user = models.CharField(max_length=255, blank=True, null=True)
    smtp_password = models.CharField(max_length=255, blank=True, null=True)
    smtp_use_tls = models.BooleanField(default=True)
    
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Enforce Singleton
        self.pk = 1
        super(SystemSettings, self).save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return "System Settings"
