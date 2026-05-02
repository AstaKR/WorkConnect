from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from reports.models import DailyReport, TaskEntry
from reports.serializers import DailyReportSerializer
from django.utils import timezone

User = get_user_model()


class DashboardSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.localdate()

        my_reports_count = DailyReport.objects.filter(user=user).count()
        data = {'my_reports_count': my_reports_count}

        if user.role in ['manager', 'ceo']:
            team_users = User.objects.all() if user.role == 'ceo' else User.objects.filter(manager=user)
            team_size = team_users.count()
            team_reports_today = DailyReport.objects.filter(user__in=team_users, date=today, is_submitted=True).count()
            pending_approvals = DailyReport.objects.filter(user__in=team_users, is_submitted=True, approval__isnull=True).count()
            data.update({
                'team_size': team_size,
                'team_reports_today': team_reports_today,
                'pending_approvals': pending_approvals,
            })

        return Response({'success': True, 'data': data})


class TeamReportsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role not in ['manager', 'ceo']:
            return Response({'success': False, 'message': 'Unauthorized'}, status=403)

        if user.role == 'ceo':
            reports = DailyReport.objects.select_related('user', 'approval').prefetch_related('tasks').order_by('-date')
        else:
            reports = DailyReport.objects.filter(user__manager=user).select_related('user', 'approval').prefetch_related('tasks').order_by('-date')

        serializer = DailyReportSerializer(reports, many=True)
        return Response({'success': True, 'data': serializer.data})


class EmployeeDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        if request.user.role not in ['manager', 'ceo']:
            return Response({'success': False, 'message': 'Unauthorized'}, status=403)
        try:
            employee = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'success': False, 'message': 'User not found'}, status=404)
        if request.user.role == 'manager' and employee.manager != request.user:
            return Response({'success': False, 'message': 'Unauthorized'}, status=403)

        reports = DailyReport.objects.filter(user=employee).select_related('approval').prefetch_related('tasks').order_by('-date')[:60]
        from accounts.serializers import UserSerializer
        return Response({
            'success': True,
            'data': {
                'user': UserSerializer(employee).data,
                'reports': DailyReportSerializer(reports, many=True).data,
            }
        })


class HierarchyAnalyticsView(APIView):
    """CEO-level analytics: location breakdown, employee hierarchy, task stats."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['manager', 'ceo']:
            return Response({'success': False, 'message': 'Unauthorized'}, status=403)

        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        today = timezone.localdate()

        # Date range filter
        task_qs = TaskEntry.objects.select_related('report__user', 'report__user__manager')
        report_qs = DailyReport.objects.select_related('user', 'user__manager', 'approval')

        if request.user.role == 'manager':
            task_qs = task_qs.filter(report__user__manager=request.user)
            report_qs = report_qs.filter(user__manager=request.user)

        if date_from:
            task_qs = task_qs.filter(report__date__gte=date_from)
            report_qs = report_qs.filter(date__gte=date_from)
        if date_to:
            task_qs = task_qs.filter(report__date__lte=date_to)
            report_qs = report_qs.filter(date__lte=date_to)

        # ── 1. Location breakdown (task level) ─────────────────────────────
        location_data = {}
        for task in task_qs.exclude(place_of_work__isnull=True).exclude(place_of_work=''):
            loc = task.place_of_work
            if loc not in location_data:
                location_data[loc] = {'location': loc, 'total': 0, 'completed': 0, 'in_progress': 0, 'pending': 0, 'employees': set()}
            location_data[loc]['total'] += 1
            if task.status == 'Completed':
                location_data[loc]['completed'] += 1
            elif task.status == 'In Progress':
                location_data[loc]['in_progress'] += 1
            else:
                location_data[loc]['pending'] += 1
            location_data[loc]['employees'].add(task.report.user_id)

        location_breakdown = [
            {**v, 'employees': len(v['employees']),
             'completion_rate': round((v['completed'] / v['total']) * 100) if v['total'] > 0 else 0}
            for v in location_data.values()
        ]
        location_breakdown.sort(key=lambda x: -x['total'])

        # ── 2. Employee hierarchy stats ────────────────────────────────────
        if request.user.role == 'ceo':
            all_users = User.objects.filter(is_active=True).select_related('manager')
        else:
            all_users = User.objects.filter(manager=request.user, is_active=True)

        employee_stats = []
        for emp in all_users:
            emp_reports = report_qs.filter(user=emp)
            emp_tasks = task_qs.filter(report__user=emp)
            total_tasks = emp_tasks.count()
            completed = emp_tasks.filter(status='Completed').count()
            locations = list(emp_tasks.exclude(place_of_work__isnull=True).exclude(place_of_work='')
                              .values_list('place_of_work', flat=True).distinct())
            employee_stats.append({
                'id': emp.id,
                'name': emp.full_name,
                'email': emp.email,
                'role': emp.role,
                'department': emp.department or '',
                'manager_name': emp.manager.full_name if emp.manager else '',
                'total_reports': emp_reports.count(),
                'submitted_reports': emp_reports.filter(is_submitted=True).count(),
                'total_tasks': total_tasks,
                'completed_tasks': completed,
                'completion_rate': round((completed / total_tasks) * 100) if total_tasks > 0 else 0,
                'locations_worked': locations,
            })
        employee_stats.sort(key=lambda x: -x['completion_rate'])

        # ── 3. Summary KPIs ────────────────────────────────────────────────
        total_tasks = task_qs.count()
        completed_tasks = task_qs.filter(status='Completed').count()
        today_reports = report_qs.filter(date=today)

        kpis = {
            'total_employees': all_users.count(),
            'active_today': today_reports.filter(is_submitted=True).count(),
            'pending_submission': today_reports.filter(is_submitted=False).count(),
            'pending_approval': report_qs.filter(is_submitted=True, approval__isnull=True).count(),
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'overall_completion': round((completed_tasks / total_tasks) * 100) if total_tasks > 0 else 0,
            'unique_locations': len(location_breakdown),
        }

        # ── 4. Department breakdown ────────────────────────────────────────
        dept_data = {}
        for emp in employee_stats:
            dept = emp['department'] or 'Unassigned'
            if dept not in dept_data:
                dept_data[dept] = {'department': dept, 'count': 0, 'total_tasks': 0, 'completed_tasks': 0}
            dept_data[dept]['count'] += 1
            dept_data[dept]['total_tasks'] += emp['total_tasks']
            dept_data[dept]['completed_tasks'] += emp['completed_tasks']
        dept_breakdown = [
            {**v, 'completion_rate': round((v['completed_tasks'] / v['total_tasks']) * 100) if v['total_tasks'] > 0 else 0}
            for v in dept_data.values()
        ]
        dept_breakdown.sort(key=lambda x: -x['total_tasks'])

        return Response({
            'success': True,
            'data': {
                'kpis': kpis,
                'location_breakdown': location_breakdown,
                'employee_stats': employee_stats,
                'department_breakdown': dept_breakdown,
            }
        })
