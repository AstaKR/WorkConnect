from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
import json


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        UserPreferences.objects.create(user=user)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ceo')
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLES = [('employee', 'Employee'), ('manager', 'Manager'), ('ceo', 'CEO')]
    EMPLOYMENT_STATUS = [
        ('active', 'Active'),
        ('probation', 'Probation'),
        ('on_leave', 'On Leave'),
        ('resigned', 'Resigned'),
        ('terminated', 'Terminated'),
        ('retired', 'Retired'),
    ]
    ACCOUNT_TYPES = [
        ('organization', 'Organization'),
        ('individual', 'Individual'),
    ]

    # Core
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLES, default='employee')
    account_type = models.CharField(
        max_length=20,
        choices=ACCOUNT_TYPES,
        default='organization',
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    # Personal
    profile_pic = models.ImageField(upload_to='profiles/', null=True, blank=True)
    dob = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    pincode = models.CharField(max_length=10, blank=True, null=True)

    # Professional
    employee_id = models.CharField(max_length=50, blank=True, null=True)
    designation = models.CharField(max_length=100, blank=True, null=True)
    grade = models.CharField(max_length=50, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    manager = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='team_members')
    employment_status = models.CharField(max_length=20, choices=EMPLOYMENT_STATUS, default='active')
    start_date = models.DateField(null=True, blank=True)
    last_working_date = models.DateField(null=True, blank=True)

    # Emergency Contact
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True, null=True)
    emergency_contact_relation = models.CharField(max_length=50, blank=True, null=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    def __str__(self):
        return self.email

    @property
    def profile_pic_url(self):
        if self.profile_pic:
            return self.profile_pic.url
        return None


class UserPreferences(models.Model):
    FONT_SIZE_CHOICES = [('sm', 'Small'), ('md', 'Medium'), ('lg', 'Large')]
    LAYOUT_CHOICES = [('compact', 'Compact'), ('comfortable', 'Comfortable')]
    DIGEST_CHOICES = [('none', 'Off'), ('daily', 'Daily'), ('weekly', 'Weekly')]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='preferences')

    # Free-form theme name (ocean, forest, midnight, etc.) — no choices restriction
    theme = models.CharField(max_length=30, default='ocean', blank=True)
    primary_color = models.CharField(max_length=7, default='#2563EB')
    accent_color = models.CharField(max_length=7, default='#7C3AED')
    sidebar_color = models.CharField(max_length=7, default='#1E293B')
    background_color = models.CharField(max_length=7, default='#F8FAFC')
    font_size = models.CharField(max_length=5, choices=FONT_SIZE_CHOICES, default='md')
    layout_density = models.CharField(max_length=15, choices=LAYOUT_CHOICES, default='comfortable')

    # --- Email Notifications ---
    notify_report_submitted = models.BooleanField(default=True)
    notify_pending_reminder = models.BooleanField(default=True)
    notify_no_report_alert = models.BooleanField(default=True)
    notify_weekly_summary = models.BooleanField(default=True)
    notify_report_shared = models.BooleanField(default=True)
    notify_welcome = models.BooleanField(default=True)
    notify_password_reset = models.BooleanField(default=True)

    # Extended notifications
    notify_report_approved = models.BooleanField(default=True)
    notify_report_rejected = models.BooleanField(default=False)
    notify_task_assigned = models.BooleanField(default=True)
    notify_task_overdue = models.BooleanField(default=True)
    notify_announcements = models.BooleanField(default=True)
    notify_mentions = models.BooleanField(default=True)
    notify_login_alert = models.BooleanField(default=False)

    # Digest
    email_digest = models.CharField(max_length=10, choices=DIGEST_CHOICES, default='daily')

    def __str__(self):
        return f"{self.user.email} Preferences"


# ─── ERP Role & Permission System ─────────────────────────────────────────────
class Role(models.Model):
    """
    Custom role with per-module permission flags.
    System roles (employee/manager/ceo) are seeded and protected.
    """
    COLOR_CHOICES = [
        ('#3B82F6', 'Blue'), ('#10B981', 'Green'), ('#8B5CF6', 'Purple'),
        ('#F59E0B', 'Amber'), ('#EF4444', 'Red'), ('#6B7280', 'Gray'),
        ('#EC4899', 'Pink'), ('#14B8A6', 'Teal'),
    ]

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#3B82F6')
    icon = models.CharField(max_length=10, default='👤')
    is_system = models.BooleanField(default=False)  # System roles cannot be deleted
    system_role_key = models.CharField(max_length=20, blank=True, null=True)  # maps to user.role
    # JSON: { "module_key": ["perm1", "perm2"] }
    permissions = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    @classmethod
    def get_default_permissions(cls):
        """Return the full permission matrix for all modules."""
        return {
            'dashboard': ['view'],
            'er_plan': ['view', 'create', 'edit', 'submit', 'reopen'],
            'kanban': ['view'],
            'report_history': ['view', 'export'],
            'calendar': ['view'],
            'manager_dashboard': ['view', 'approve', 'reject'],
            'ceo_dashboard': ['view', 'export'],
            'user_management': ['view', 'create', 'edit', 'deactivate', 'delete', 'reset_password'],
            'role_management': ['view', 'create', 'edit', 'delete'],
            'settings_system': ['view', 'edit'],
            'settings_locations': ['view', 'create', 'edit', 'delete'],
            'reports_export': ['excel', 'csv', 'pdf'],
        }
