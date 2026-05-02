from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DailyReportViewSet, TaskEntryViewSet, TaskDirectUpdateView, WorkLocationViewSet
from .views_export import ExportReportView

router = DefaultRouter()
router.register(r'locations', WorkLocationViewSet, basename='location')
router.register(r'', DailyReportViewSet, basename='report')

task_list = TaskEntryViewSet.as_view({'get': 'list', 'post': 'create'})
task_detail = TaskEntryViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})

urlpatterns = [
    # Flat task update — used by admin/CEO to edit any task directly
    path('tasks/<int:pk>/', TaskDirectUpdateView.as_view(), name='task-direct-update'),
    path('<int:report_pk>/tasks/', task_list, name='task-list'),
    path('<int:report_pk>/tasks/<int:pk>/', task_detail, name='task-detail'),
    path('<int:pk>/export/', ExportReportView.as_view(), name='report_export'),
    path('', include(router.urls)),
]
