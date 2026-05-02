from django.urls import path
from .views import SystemSettingsView, AppearanceSettingsView, PublicSettingsView, TestEmailView

urlpatterns = [
    path('', SystemSettingsView.as_view(), name='system_settings'),
    path('public/', PublicSettingsView.as_view(), name='public_settings'),
    path('appearance/', AppearanceSettingsView.as_view(), name='appearance_settings'),
    path('test-email/', TestEmailView.as_view(), name='test_email'),
]
