from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from rest_framework.throttling import UserRateThrottle

from .helpers import call_feature, _build_provider
from .models import AIProviderConfig, AIFeatureConfig, AIUsageLog
from .serializers import AIProviderConfigSerializer, AIFeatureConfigSerializer


class AIFeatureThrottle(UserRateThrottle):
    scope = 'ai_feature'


class AIHeavyThrottle(UserRateThrottle):
    scope = 'ai_heavy'


class IsCEO(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ceo'


class IsManagerOrCEO(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('manager', 'ceo')


# ── Feature Views ─────────────────────────────────────────────────────────────

class SpellCheckView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [AIFeatureThrottle]

    def post(self, request):
        text = (request.data.get('text') or '').strip()
        task_id = request.data.get('task_id') or None
        if not text:
            return Response({'success': False, 'message': 'text is required'}, status=400)
        prompt = (
            "Fix ONLY spelling and grammar in the text below. "
            "Return ONLY the corrected text with no explanation:\n\n" + text
        )
        try:
            result = call_feature('spell_check', prompt, request.user, task_id=task_id)
            return Response({'success': True, 'data': {'corrected': result}})
        except (ValueError, RuntimeError) as e:
            return Response({'success': False, 'message': str(e)}, status=503)


class SentenceMakerView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [AIFeatureThrottle]

    def post(self, request):
        text = (request.data.get('text') or '').strip()
        task_id = request.data.get('task_id') or None
        if not text:
            return Response({'success': False, 'message': 'text is required'}, status=400)
        prompt = (
            "Rewrite the rough notes below as one professional, concise sentence. "
            "Return ONLY the improved sentence:\n\n" + text
        )
        try:
            result = call_feature('sentence_maker', prompt, request.user, task_id=task_id)
            return Response({'success': True, 'data': {'improved': result}})
        except (ValueError, RuntimeError) as e:
            return Response({'success': False, 'message': str(e)}, status=503)


class ActionPlanView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [AIFeatureThrottle]

    def post(self, request):
        job = (request.data.get('job') or '').strip()
        task_id = request.data.get('task_id') or None
        if not job:
            return Response({'success': False, 'message': 'job is required'}, status=400)
        prompt = (
            f"Write a brief 2-4 step action plan for completing: '{job}'. "
            "Make it actionable and professional. Return only the action plan."
        )
        try:
            result = call_feature('action_plan', prompt, request.user, task_id=task_id)
            return Response({'success': True, 'data': {'action_plan': result}})
        except (ValueError, RuntimeError) as e:
            return Response({'success': False, 'message': str(e)}, status=503)


class DetectPriorityView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [AIFeatureThrottle]

    def post(self, request):
        job = (request.data.get('job') or '').strip()
        task_id = request.data.get('task_id') or None
        if not job:
            return Response({'success': False, 'message': 'job is required'}, status=400)
        prompt = f"Analyze this task: '{job}'. Reply with exactly one word — High, Medium, or Low. No other text."
        try:
            raw = call_feature('detect_priority', prompt, request.user, task_id=task_id)
            priority = raw.strip().capitalize()
            if priority not in ('High', 'Medium', 'Low'):
                priority = 'Medium'
            return Response({'success': True, 'data': {'priority': priority}})
        except (ValueError, RuntimeError) as e:
            return Response({'success': False, 'message': str(e)}, status=503)


class DailySummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [AIHeavyThrottle]

    def post(self, request):
        from reports.models import DailyReport
        report_id = request.data.get('report_id')
        tasks_raw = request.data.get('tasks')

        if report_id:
            try:
                report = DailyReport.objects.prefetch_related('tasks').get(
                    pk=report_id, user=request.user
                )
                task_lines = '\n'.join(
                    f"- {t.job} (Status: {t.status}, Priority: {t.priority})"
                    for t in report.tasks.all()
                )
            except DailyReport.DoesNotExist:
                return Response({'success': False, 'message': 'Report not found'}, status=404)
        elif tasks_raw and isinstance(tasks_raw, list):
            # Cap at 50 items; truncate each field to prevent prompt injection
            task_lines = '\n'.join(
                f"- {str(t.get('job', ''))[:200]} ({str(t.get('status', 'Pending'))[:50]})"
                for t in tasks_raw[:50]
            )
        else:
            return Response({'success': False, 'message': 'report_id or tasks list required'}, status=400)

        prompt = (
            "Write a professional 2-3 sentence daily work summary for a manager "
            "based on these tasks:\n" + task_lines
        )
        try:
            result = call_feature('daily_summary', prompt, request.user)
            return Response({'success': True, 'data': {'summary': result}})
        except (ValueError, RuntimeError) as e:
            return Response({'success': False, 'message': str(e)}, status=503)


class TaskBreakdownView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [AIHeavyThrottle]

    def post(self, request):
        import json
        import re
        job = (request.data.get('job') or '').strip()
        task_id = request.data.get('task_id') or None
        if not job:
            return Response({'success': False, 'message': 'job is required'}, status=400)
        prompt = (
            f"Break down this task into 3-5 sub-tasks: '{job}'. "
            'Return a JSON array of strings only. Example: ["Sub-task 1", "Sub-task 2"]'
        )
        try:
            raw = call_feature('task_breakdown', prompt, request.user, task_id=task_id)
            # Try parsing the full response first
            try:
                subtasks = json.loads(raw)
                if not isinstance(subtasks, list):
                    raise ValueError
            except (json.JSONDecodeError, ValueError):
                # Fall back: find last JSON array in response
                matches = re.findall(r'\[[^\[\]]+\]', raw, re.DOTALL)
                if matches:
                    try:
                        subtasks = json.loads(matches[-1])
                    except json.JSONDecodeError:
                        subtasks = [raw.strip()]
                else:
                    subtasks = [raw.strip()]
            return Response({'success': True, 'data': {'subtasks': subtasks}})
        except (ValueError, RuntimeError) as e:
            return Response({'success': False, 'message': str(e)}, status=503)


class TeamInsightsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsManagerOrCEO]
    throttle_classes = [AIHeavyThrottle]

    def post(self, request):
        date_from = request.data.get('date_from', '')
        date_to = request.data.get('date_to', '')
        from reports.models import DailyReport
        from django.contrib.auth import get_user_model
        User = get_user_model()

        if request.user.role == 'manager':
            team = User.objects.filter(manager=request.user)
        else:
            team = User.objects.all()
        reports = DailyReport.objects.filter(user__in=team)
        if date_from:
            reports = reports.filter(date__gte=date_from)
        if date_to:
            reports = reports.filter(date__lte=date_to)

        from django.db.models import Count, Q
        team_count = team.count()
        report_stats = reports.aggregate(
            total_tasks=Count('tasks'),
            completed=Count('tasks', filter=Q(tasks__status='Completed')),
        )
        total_tasks = report_stats['total_tasks']
        completed = report_stats['completed']
        report_count = reports.count()

        prompt = (
            f"Write a 3-4 sentence professional team productivity insight. "
            f"Data: {report_count} reports, {team_count} employees, "
            f"{total_tasks} tasks total, {completed} completed. "
            f"Period: {date_from or 'all time'} to {date_to or 'today'}."
        )
        try:
            result = call_feature('team_insights', prompt, request.user)
            return Response({'success': True, 'data': {'insights': result}})
        except (ValueError, RuntimeError) as e:
            return Response({'success': False, 'message': str(e)}, status=503)


# ── Admin Views (CEO only) ────────────────────────────────────────────────────

class ProviderListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCEO]

    def get(self, request):
        qs = AIProviderConfig.objects.all().order_by('display_name')
        return Response({'success': True, 'data': AIProviderConfigSerializer(qs, many=True).data})

    def post(self, request):
        s = AIProviderConfigSerializer(data=request.data)
        if s.is_valid():
            s.save()
            return Response({'success': True, 'data': s.data}, status=201)
        return Response({'success': False, 'data': s.errors}, status=400)


class ProviderDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCEO]

    def _get(self, pk):
        try:
            return AIProviderConfig.objects.get(pk=pk)
        except AIProviderConfig.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self._get(pk)
        if not obj:
            return Response({'success': False, 'message': 'Not found'}, status=404)
        return Response({'success': True, 'data': AIProviderConfigSerializer(obj).data})

    def patch(self, request, pk):
        obj = self._get(pk)
        if not obj:
            return Response({'success': False, 'message': 'Not found'}, status=404)
        s = AIProviderConfigSerializer(obj, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return Response({'success': True, 'data': s.data})
        return Response({'success': False, 'data': s.errors}, status=400)

    def delete(self, request, pk):
        obj = self._get(pk)
        if not obj:
            return Response({'success': False, 'message': 'Not found'}, status=404)
        obj.delete()
        return Response({'success': True, 'message': 'Provider deleted'})


class ProviderTestView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCEO]

    def post(self, request, pk):
        try:
            config = AIProviderConfig.objects.get(pk=pk)
        except AIProviderConfig.DoesNotExist:
            return Response({'success': False, 'message': 'Not found'}, status=404)
        try:
            provider = _build_provider(config)
            result = provider.complete("Reply with the single word OK and nothing else.", max_tokens=5)
            _PREVIEW_LEN = 50
            return Response({'success': True, 'message': f'Provider responded: {result[:_PREVIEW_LEN]}'})
        except Exception as e:
            return Response({'success': False, 'message': f'Test failed: {e}'}, status=503)


class FeatureConfigListView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCEO]

    def get(self, request):
        qs = AIFeatureConfig.objects.select_related('primary_provider', 'fallback_provider').all()
        return Response({'success': True, 'data': AIFeatureConfigSerializer(qs, many=True).data})

    def patch(self, request):
        """Bulk update: list of {id, primary_provider?, fallback_provider?, is_enabled?, max_tokens?}"""
        updates = request.data if isinstance(request.data, list) else [request.data]
        results = []
        errors = []
        for item in updates:
            item_id = item.get('id') if isinstance(item, dict) else None
            if item_id is None:
                errors.append({'id': None, 'error': 'id is required'})
                continue
            try:
                obj = AIFeatureConfig.objects.get(pk=item_id)
                s = AIFeatureConfigSerializer(obj, data=item, partial=True)
                if s.is_valid():
                    s.save()
                    results.append(s.data)
                else:
                    errors.append({'id': item_id, 'error': s.errors})
            except AIFeatureConfig.DoesNotExist:
                errors.append({'id': item_id, 'error': 'Not found'})
        all_ok = len(errors) == 0
        return Response({
            'success': all_ok,
            'data': results,
            'errors': errors,
        }, status=200 if all_ok else 207)


class UsageStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCEO]

    def get(self, request):
        from django.utils import timezone
        from django.db.models import Count
        today = timezone.now().date()
        logs = AIUsageLog.objects.filter(created_at__date=today)
        return Response({
            'success': True,
            'data': {
                'total': logs.count(),
                'by_provider': list(logs.values('provider_key').annotate(count=Count('id')).order_by('-count')),
                'by_feature':  list(logs.values('feature_key').annotate(count=Count('id')).order_by('-count')),
            }
        })
