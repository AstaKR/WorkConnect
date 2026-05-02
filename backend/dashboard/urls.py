from django.urls import path
from .views import DashboardSummaryView, TeamReportsView, EmployeeDetailView, HierarchyAnalyticsView

urlpatterns = [
    path('summary/', DashboardSummaryView.as_view(), name='dashboard_summary'),
    path('team/', TeamReportsView.as_view(), name='dashboard_team'),
    path('employee/<int:user_id>/', EmployeeDetailView.as_view(), name='employee_detail'),
    path('hierarchy/', HierarchyAnalyticsView.as_view(), name='hierarchy_analytics'),
]
