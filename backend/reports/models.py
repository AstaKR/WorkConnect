from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL


class WorkLocation(models.Model):
    CATEGORY_CHOICES = [
        ('office', 'Office'),
        ('store', 'Store'),
        ('factory', 'Factory'),
        ('warehouse', 'Warehouse'),
        ('remote', 'Remote'),
        ('other', 'Other'),
    ]
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    icon = models.CharField(max_length=10, default='📍')
    is_default = models.BooleanField(default=False)   # True = system-wide default
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='custom_locations',
        null=True, blank=True  # null = system default visible to all
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_default', 'category', 'name']

    def __str__(self):
        return self.name


class DailyReport(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports')
    date = models.DateField()
    place_of_work = models.CharField(max_length=150, default='Corporate Office')
    is_submitted = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'date']

    def __str__(self):
        return f"{self.user} - {self.date}"


class TaskEntry(models.Model):
    PRIORITY = [('High', 'High'), ('Medium', 'Medium'), ('Low', 'Low')]
    STATUS = [('Completed', 'Completed'), ('Pending', 'Pending'), ('In Progress', 'In Progress')]

    report = models.ForeignKey(DailyReport, on_delete=models.CASCADE, related_name='tasks')
    job = models.CharField(max_length=255)
    priority = models.CharField(max_length=10, choices=PRIORITY, default='Medium')
    place_of_work = models.CharField(max_length=150, blank=True, null=True)
    action_plan = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS, default='Pending')
    responsible = models.CharField(max_length=100, blank=True, null=True)
    order = models.IntegerField(default=0)
    # AI assistance fields — grouped together
    remarks = models.TextField(blank=True, null=True)
    ai_enabled = models.BooleanField(default=False)
    ai_assisted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.job} ({self.status})"


class ReportApproval(models.Model):
    report = models.OneToOneField(DailyReport, on_delete=models.CASCADE, related_name='approval')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='approved_reports')
    approved_at = models.DateTimeField(auto_now_add=True)
    comment = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Approval for {self.report}"
