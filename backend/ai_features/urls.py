from django.urls import path
from .views import (
    SpellCheckView, SentenceMakerView, ActionPlanView,
    DetectPriorityView, DailySummaryView, TaskBreakdownView, TeamInsightsView,
    ProviderListCreateView, ProviderDetailView, ProviderTestView,
    FeatureConfigListView, UsageStatsView,
)

urlpatterns = [
    # Feature endpoints
    path('spell-check/',     SpellCheckView.as_view(),     name='ai_spell_check'),
    path('sentence-maker/',  SentenceMakerView.as_view(),  name='ai_sentence_maker'),
    path('action-plan/',     ActionPlanView.as_view(),      name='ai_action_plan'),
    path('detect-priority/', DetectPriorityView.as_view(), name='ai_detect_priority'),
    path('daily-summary/',   DailySummaryView.as_view(),   name='ai_daily_summary'),
    path('task-breakdown/',  TaskBreakdownView.as_view(),  name='ai_task_breakdown'),
    path('team-insights/',   TeamInsightsView.as_view(),   name='ai_team_insights'),
    # Admin endpoints (CEO only)
    path('admin/providers/',                ProviderListCreateView.as_view(), name='ai_providers'),
    path('admin/providers/<int:pk>/',       ProviderDetailView.as_view(),     name='ai_provider_detail'),
    path('admin/providers/<int:pk>/test/',  ProviderTestView.as_view(),       name='ai_provider_test'),
    path('admin/features/',                 FeatureConfigListView.as_view(),  name='ai_features_config'),
    path('admin/usage/',                    UsageStatsView.as_view(),         name='ai_usage'),
]
