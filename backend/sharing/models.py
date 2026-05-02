import uuid
from django.db import models
from django.utils import timezone
from datetime import timedelta
from reports.models import DailyReport
from django.conf import settings

def default_expiration():
    return timezone.now() + timedelta(days=7)

class ShareLink(models.Model):
    report = models.ForeignKey(DailyReport, on_delete=models.CASCADE, related_name='share_links')
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    expires_at = models.DateTimeField(default=default_expiration)
    view_count = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid(self):
        return self.is_active and timezone.now() < self.expires_at

    def __str__(self):
        return str(self.token)
