import csv
import io
from django.db import models as django_models
from datetime import datetime
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from django.utils import timezone
from .models import DailyReport, TaskEntry, ReportApproval, WorkLocation
from .serializers import DailyReportSerializer, TaskEntrySerializer, ReportApprovalSerializer


class WorkLocationViewSet(viewsets.ModelViewSet):
    """
    CRUD for work locations.
    - Everyone can see all active locations.
    - Only CEO can create/update/delete locations.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        from .serializers import WorkLocationSerializer
        return WorkLocationSerializer

    def get_queryset(self):
        # All users see all active locations
        return WorkLocation.objects.filter(is_active=True)

    def perform_create(self, serializer):
        if self.request.user.role != 'ceo':
            raise PermissionDenied("Only CEO can add locations.")
        serializer.save(created_by=self.request.user, is_default=False)

    def update(self, request, *args, **kwargs):
        if request.user.role != 'ceo':
            raise PermissionDenied("Only CEO can edit locations.")
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'ceo':
            raise PermissionDenied("Only CEO can delete locations.")
        instance = self.get_object()
        instance.delete()
        return Response(status=204)

    @action(detail=False, methods=['post'], url_path='import')
    def import_locations(self, request):
        if request.user.role != 'ceo':
            raise PermissionDenied("Only CEO can import locations.")
        
        csv_data = request.data.get('csv_data', '').strip()
        if not csv_data:
            return Response({'success': False, 'message': 'No CSV data provided'}, status=400)

        try:
            reader = csv.DictReader(io.StringIO(csv_data))
            valid_categories = {'office', 'store', 'factory', 'warehouse', 'remote', 'other'}
            created = []
            
            for row in reader:
                name = (row.get('name') or row.get('Location') or row.get('location') or '').strip()
                if not name:
                    continue
                
                category = (row.get('category') or row.get('Category') or 'other').strip().lower()
                if category not in valid_categories:
                    category = 'other'
                
                icon = (row.get('icon') or row.get('Icon') or '📍').strip()
                
                loc = WorkLocation.objects.create(
                    name=name,
                    category=category,
                    icon=icon,
                    is_default=False,
                    created_by=request.user
                )
                from .serializers import WorkLocationSerializer
                created.append(WorkLocationSerializer(loc).data)

            return Response({
                'success': True,
                'message': f'{len(created)} locations imported successfully',
                'data': created
            })
        except Exception as e:
            return Response({'success': False, 'message': f'CSV parse error: {str(e)}'}, status=400)


class DailyReportViewSet(viewsets.ModelViewSet):
    serializer_class = DailyReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = DailyReport.objects.select_related('user', 'approval').prefetch_related('tasks')

        # Base role-based access
        if user.role == 'ceo':
            qs = qs.all()
        elif user.role == 'manager':
            qs = qs.filter(user__manager=user) | qs.filter(user=user)
        else:
            qs = qs.filter(user=user)

        params = self.request.query_params

        # Filter by specific user (CEO/manager only)
        user_id = params.get('user_id')
        if user_id and user.role in ['ceo', 'manager']:
            qs = qs.filter(user_id=user_id)

        # Date range filter
        date_from = params.get('date_from')
        date_to = params.get('date_to')
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)

        # Status filter: submitted | draft | approved | pending_approval
        status_filter = params.get('status')
        if status_filter == 'submitted':
            qs = qs.filter(is_submitted=True)
        elif status_filter == 'draft':
            qs = qs.filter(is_submitted=False)
        elif status_filter == 'approved':
            qs = qs.filter(approval__isnull=False)
        elif status_filter == 'pending':
            qs = qs.filter(is_submitted=True, approval__isnull=True)

        return qs.order_by('-date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    # ── Get or create report for today ─────────────────────────────────────
    @action(detail=False, methods=['get'])
    def today(self, request):
        report, _ = DailyReport.objects.get_or_create(user=request.user, date=timezone.localdate())
        return Response({'success': True, 'data': self.get_serializer(report).data})

    # ── Get or create report for any date ──────────────────────────────────
    @action(detail=False, methods=['get'], url_path=r'date/(?P<date>\d{4}-\d{2}-\d{2})')
    def by_date(self, request, date=None):
        try:
            parsed = datetime.strptime(date, '%Y-%m-%d').date()
        except ValueError:
            return Response({'success': False, 'message': 'Invalid date format. Use YYYY-MM-DD.'}, status=400)

        report, created = DailyReport.objects.get_or_create(user=request.user, date=parsed)
        return Response({'success': True, 'data': self.get_serializer(report).data, 'created': created})

    # ── Submit ──────────────────────────────────────────────────────────────
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        report = self.get_object()
        if report.user != request.user:
            return Response({'success': False, 'message': 'Unauthorized'}, status=403)
        report.is_submitted = True
        report.submitted_at = timezone.now()
        report.save()
        try:
            from .tasks import send_report_submitted_email
            send_report_submitted_email.delay(report.id)
        except Exception:
            pass
        return Response({'success': True, 'message': 'Report submitted successfully'})

    # ── Submit All (combined: save details + tasks + submit in 1 request) ───
    @action(detail=True, methods=['post'], url_path='submit_all')
    def submit_all(self, request, pk=None):
        report = self.get_object()
        if report.user != request.user:
            return Response({'success': False, 'message': 'Unauthorized'}, status=403)

        # 1. Update report fields
        place_of_work = request.data.get('place_of_work')
        notes = request.data.get('notes')
        if place_of_work is not None:
            report.place_of_work = place_of_work
        if notes is not None:
            report.notes = notes

        # 2. Bulk upsert tasks
        tasks_data = request.data.get('tasks', [])
        incoming_ids = []
        for index, td in enumerate(tasks_data):
            task_id = td.get('id')
            if not task_id or (isinstance(task_id, int) and task_id > 1000000000000):
                from .models import TaskEntry
                task = TaskEntry.objects.create(
                    report=report,
                    job=td.get('job', ''),
                    priority=td.get('priority', 'Medium'),
                    status=td.get('status', 'Pending'),
                    action_plan=td.get('action_plan', ''),
                    order=td.get('order', index)
                )
            else:
                from .models import TaskEntry
                task = TaskEntry.objects.filter(id=task_id, report=report).first()
                if task:
                    task.job = td.get('job', task.job)
                    task.priority = td.get('priority', task.priority)
                    task.status = td.get('status', task.status)
                    task.action_plan = td.get('action_plan', task.action_plan)
                    task.order = td.get('order', index)
                    task.save()
            if task:
                incoming_ids.append(task.id)

        # Cleanup deleted tasks
        from .models import TaskEntry
        TaskEntry.objects.filter(report=report).exclude(id__in=incoming_ids).delete()

        # 3. Submit
        report.is_submitted = True
        report.submitted_at = timezone.now()
        report.save()

        # 4. Fire email async (non-blocking)
        try:
            from .tasks import send_report_submitted_email
            send_report_submitted_email.delay(report.id)
        except Exception:
            pass

        return Response({'success': True, 'message': 'Report submitted successfully'})

    # ── Unsubmit (reopen) ───────────────────────────────────────────────────
    @action(detail=True, methods=['post'])
    def unsubmit(self, request, pk=None):
        report = self.get_object()
        if report.user != request.user and request.user.role not in ['manager', 'ceo']:
            return Response({'success': False, 'message': 'Unauthorized'}, status=403)
        report.is_submitted = False
        report.submitted_at = None
        report.save()
        return Response({'success': True, 'message': 'Report reopened'})

    # ── Approve ─────────────────────────────────────────────────────────────
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        report = self.get_object()
        if request.user.role not in ['manager', 'ceo']:
            return Response({'success': False, 'message': 'Unauthorized'}, status=403)
        comment = request.data.get('comment', '')
        approval, _ = ReportApproval.objects.get_or_create(report=report)
        approval.approved_by = request.user
        approval.comment = comment
        approval.save()
        try:
            from .tasks import send_report_approved_email
            send_report_approved_email.delay(report.id)
        except Exception:
            pass
        return Response({'success': True, 'message': 'Report approved successfully'})

    # ── Bulk delete tasks ───────────────────────────────────────────────────
    @action(detail=True, methods=['delete'], url_path='tasks/bulk')
    def bulk_delete_tasks(self, request, pk=None):
        report = self.get_object()
        if report.user != request.user and request.user.role not in ['manager', 'ceo']:
            return Response({'success': False, 'message': 'Unauthorized'}, status=403)
        ids = request.data.get('ids', [])
        if not ids:
            return Response({'success': False, 'message': 'No task IDs provided'}, status=400)
        deleted, _ = TaskEntry.objects.filter(report=report, id__in=ids).delete()
        return Response({'success': True, 'message': f'{deleted} tasks deleted'})

    # ── Import tasks from CSV ───────────────────────────────────────────────
    @action(detail=True, methods=['post'], url_path='import')
    def import_tasks(self, request, pk=None):
        report = self.get_object()
        if report.user != request.user and request.user.role not in ['manager', 'ceo']:
            return Response({'success': False, 'message': 'Unauthorized'}, status=403)

        csv_data = request.data.get('csv_data', '').strip()
        if not csv_data:
            return Response({'success': False, 'message': 'No CSV data provided'}, status=400)

        try:
            reader = csv.DictReader(io.StringIO(csv_data))
            valid_priorities = {'High', 'Medium', 'Low'}
            valid_statuses = {'Pending', 'In Progress', 'Completed'}
            base_order = TaskEntry.objects.filter(report=report).count()
            created = []

            for i, row in enumerate(reader):
                job = (row.get('task') or row.get('job') or row.get('Task') or row.get('Job') or '').strip()
                if not job:
                    continue
                priority = (row.get('priority') or row.get('Priority') or 'Medium').strip().capitalize()
                if priority not in valid_priorities:
                    priority = 'Medium'
                raw_status = (row.get('status') or row.get('Status') or 'Pending').strip().title()
                if raw_status not in valid_statuses:
                    raw_status = 'Pending'
                action_plan = (row.get('action_plan') or row.get('notes') or row.get('Notes') or '').strip()

                task = TaskEntry.objects.create(
                    report=report,
                    job=job,
                    priority=priority,
                    status=raw_status,
                    action_plan=action_plan,
                    order=base_order + i,
                )
                created.append(TaskEntrySerializer(task).data)

            return Response({
                'success': True,
                'message': f'{len(created)} tasks imported successfully',
                'data': created
            })
        except Exception as e:
            return Response({'success': False, 'message': f'CSV parse error: {str(e)}'}, status=400)


    # ── Bulk save tasks ─────────────────────────────────────────────────────
    @action(detail=True, methods=['post'], url_path='save_tasks')
    def save_tasks(self, request, pk=None):
        report = self.get_object()
        if report.user != request.user and request.user.role not in ['manager', 'ceo']:
            return Response({'success': False, 'message': 'Unauthorized'}, status=403)
        
        tasks_data = request.data.get('tasks', [])
        incoming_ids = []
        
        for index, td in enumerate(tasks_data):
            task_id = td.get('id')
            # Treat large timestamps (from Date.now()) as new tasks
            if not task_id or (isinstance(task_id, int) and task_id > 1000000000000):
                task = TaskEntry.objects.create(
                    report=report,
                    job=td.get('job', ''),
                    priority=td.get('priority', 'Medium'),
                    status=td.get('status', 'Pending'),
                    action_plan=td.get('action_plan', ''),
                    order=td.get('order', index)
                )
            else:
                task = TaskEntry.objects.filter(id=task_id, report=report).first()
                if task:
                    task.job = td.get('job', task.job)
                    task.priority = td.get('priority', task.priority)
                    task.status = td.get('status', task.status)
                    task.action_plan = td.get('action_plan', task.action_plan)
                    task.order = td.get('order', index)
                    task.save()
            if task:
                incoming_ids.append(task.id)
                
        # Cleanup removed tasks
        TaskEntry.objects.filter(report=report).exclude(id__in=incoming_ids).delete()
        
        return Response({
            'success': True, 
            'data': TaskEntrySerializer(TaskEntry.objects.filter(report=report).order_by('order'), many=True).data
        })


class TaskEntryViewSet(viewsets.ModelViewSet):
    serializer_class = TaskEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TaskEntry.objects.filter(report_id=self.kwargs.get('report_pk'))

    def perform_create(self, serializer):
        report = DailyReport.objects.get(id=self.kwargs.get('report_pk'))
        if report.user != self.request.user and self.request.user.role not in ['manager', 'ceo']:
            raise PermissionDenied("You do not have permission to add tasks to this report.")
        serializer.save(report=report)


class TaskDirectUpdateView(APIView):
    """
    PATCH /reports/tasks/<pk>/ — Update a task directly (no report_pk needed).
    Allowed for: task owner, manager, CEO.
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            task = TaskEntry.objects.select_related('report__user').get(pk=pk)
        except TaskEntry.DoesNotExist:
            return Response({'success': False, 'message': 'Task not found'}, status=404)

        # Permission: owner OR manager/ceo
        if task.report.user != request.user and request.user.role not in ['manager', 'ceo']:
            return Response({'success': False, 'message': 'Unauthorized'}, status=403)

        s = TaskEntrySerializer(task, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return Response({'success': True, 'data': s.data})
        return Response({'success': False, 'data': s.errors}, status=400)
