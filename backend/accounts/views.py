import csv
import io
import re
from django.http import HttpResponse
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer, UserSerializer, UserCreateSerializer, RoleSerializer
from .models import Role

User = get_user_model()


class LoginRateThrottle(permissions.BasePermission):
    pass  # placeholder — real throttle below


from rest_framework.throttling import AnonRateThrottle

class LoginThrottle(AnonRateThrottle):
    rate = '5/min'
    scope = 'login'


def _validate_password_strength(password: str) -> str | None:
    """Return error string or None if valid."""
    if not password or len(password) < 8:
        return 'Password must be at least 8 characters.'
    if not re.search(r'[A-Z]', password):
        return 'Password must contain at least one uppercase letter.'
    if not re.search(r'[a-z]', password):
        return 'Password must contain at least one lowercase letter.'
    if not re.search(r'\d', password):
        return 'Password must contain at least one digit.'
    return None

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [LoginThrottle]

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'User details fetched successfully'
        })

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'data': serializer.data,
                'message': 'User updated successfully'
            })
        return Response({
            'success': False,
            'data': serializer.errors,
            'message': 'Validation error'
        }, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        if not old_password or not new_password:
            return Response({'success': False, 'message': 'old_password and new_password are required'}, status=400)
        if not user.check_password(old_password):
            return Response({'success': False, 'message': 'Incorrect current password'}, status=400)
        err = _validate_password_strength(new_password)
        if err:
            return Response({'success': False, 'message': err}, status=400)
        user.set_password(new_password)
        user.save()
        return Response({'success': True, 'message': 'Password changed successfully'})

class PasswordResetThrottle(AnonRateThrottle):
    rate = '3/hour'
    scope = 'password_reset'


class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [PasswordResetThrottle]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'success': False, 'message': 'Email is required'}, status=400)
            
        user = User.objects.filter(email=email).first()
        if not user:
            # Prevent email enumeration by returning success even if user not found
            return Response({'success': True, 'message': 'If the email exists, a new password has been sent.'})
            
        import secrets
        import string
        from settings_app.email_utils import send_notification
        
        # Generate random 10-char password
        alphabet = string.ascii_letters + string.digits
        new_password = ''.join(secrets.choice(alphabet) for i in range(10))
        
        user.set_password(new_password)
        user.save()
        
        subject = "🔐 Your New ER Plan Password"
        body = f"<p>Your password has been reset. Your new temporary password is: <br><br><strong style='font-size: 24px; padding: 12px; background: #f1f5f9; border-radius: 8px; letter-spacing: 2px;'>{new_password}</strong></p><p>Please log in and change this password immediately in your account settings.</p>"
        
        # We don't render the full base.html here to keep it simple, or we can just pass the body
        success, err = send_notification(
            subject=subject,
            message=f"Your new password is: {new_password}",
            html_message=body,
            recipient_list=[user.email]
        )
        
        if not success:
            return Response({'success': False, 'message': 'Failed to send email. Please contact administrator.'}, status=500)
            
        return Response({'success': True, 'message': 'A new password has been sent to your email.'})

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def get_queryset(self):
        # CEO can see all, Manager can see their team
        user = self.request.user
        if user.role == 'ceo':
            return User.objects.all()
        elif user.role == 'manager':
            return User.objects.filter(manager=user)
        return User.objects.none()

    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'ceo':
            return Response({'success': False, 'message': 'Unauthorized'}, status=403)
        instance = self.get_object()
        instance.delete()
        return Response({'success': True, 'message': 'User permanently deleted'})

    @action(detail=True, methods=['post'], url_path='set_password')
    def set_password(self, request, pk=None):
        """CEO or Manager can reset any user's password (admin override)."""
        if request.user.role not in ('ceo', 'manager'):
            return Response({'success': False, 'message': 'Unauthorized'}, status=403)
        instance = self.get_object()
        # Managers can only reset passwords of their own team members
        if request.user.role == 'manager' and instance.manager != request.user:
            return Response({'success': False, 'message': 'You can only reset passwords for your team members'}, status=403)
        new_password = request.data.get('new_password', '').strip()
        err = _validate_password_strength(new_password)
        if err:
            return Response({'success': False, 'message': err}, status=400)
        instance.set_password(new_password)
        instance.save()
        return Response({'success': True, 'message': f'Password reset for {instance.full_name}'})

    @action(detail=False, methods=['get'], url_path='export')
    def export_users(self, request):
        """Export users to CSV. CEO-only."""
        if request.user.role != 'ceo':
            return Response({'success': False, 'message': 'Unauthorized'}, status=403)

        users = self.get_queryset()
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="users_export.csv"'

        writer = csv.writer(response)
        # Header row
        writer.writerow([
            'full_name', 'email', 'role', 'employee_id', 'designation', 'grade',
            'department', 'employment_status', 'start_date', 'phone',
            'city', 'state', 'emergency_contact_name', 'emergency_contact_phone',
        ])
        for u in users:
            writer.writerow([
                u.full_name, u.email, u.role, u.employee_id or '',
                u.designation or '', u.grade or '', u.department or '',
                u.employment_status or '', u.start_date or '', u.phone or '',
                u.city or '', u.state or '',
                u.emergency_contact_name or '', u.emergency_contact_phone or '',
            ])
        return response

    @action(detail=False, methods=['post'], url_path='import')
    def import_users(self, request):
        """Import users from CSV. CEO-only."""
        if request.user.role != 'ceo':
            return Response({'success': False, 'message': 'Unauthorized'}, status=403)

        csv_data = request.data.get('csv_data', '').strip()
        if not csv_data:
            return Response({'success': False, 'message': 'No CSV data provided'}, status=400)
        if len(csv_data) > 500_000:  # 500 KB max
            return Response({'success': False, 'message': 'CSV data too large (max 500KB)'}, status=400)

        try:
            reader = csv.DictReader(io.StringIO(csv_data))
            created_count = 0
            errors = []
            for i, row in enumerate(reader, start=2):
                email = (row.get('email') or '').strip()
                full_name = (row.get('full_name') or '').strip()
                if not email or not full_name:
                    errors.append(f'Row {i}: email and full_name are required')
                    continue
                if User.objects.filter(email=email).exists():
                    errors.append(f'Row {i}: {email} already exists')
                    continue
                password = row.get('password') or 'ChangeMe@123'
                User.objects.create_user(
                    email=email, full_name=full_name, password=password,
                    role=(row.get('role') or 'employee').strip().lower(),
                    employee_id=(row.get('employee_id') or '').strip(),
                    designation=(row.get('designation') or '').strip(),
                    grade=(row.get('grade') or '').strip(),
                    department=(row.get('department') or '').strip(),
                    phone=(row.get('phone') or '').strip(),
                    employment_status=(row.get('employment_status') or 'active').strip(),
                )
                created_count += 1
            return Response({
                'success': True,
                'message': f'{created_count} users created successfully.',
                'errors': errors,
            })
        except Exception as e:
            return Response({'success': False, 'message': f'CSV parse error: {str(e)}'}, status=400)

class TeamView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role == 'ceo':
            team = User.objects.all()
        else:
            team = User.objects.filter(manager=user)
        serializer = UserSerializer(team, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'Team fetched successfully'
        })


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'success': True, 'message': 'Registration successful. Please login.'}, status=status.HTTP_201_CREATED)
        return Response({'success': False, 'data': serializer.errors, 'message': 'Validation error'}, status=status.HTTP_400_BAD_REQUEST)


class RoleViewSet(viewsets.ModelViewSet):
    """
    Professional Role management — CEO only for write operations.
    Anyone authenticated can list/read roles.
    """
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Role.objects.all()

    def _require_ceo(self):
        if self.request.user.role != 'ceo':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only CEO can manage roles.')

    def perform_create(self, serializer):
        self._require_ceo()
        serializer.save()

    def perform_update(self, serializer):
        self._require_ceo()
        instance = serializer.instance
        if instance.is_system:
            # System roles: only allow permissions and description to be edited
            allowed = {k: v for k, v in serializer.validated_data.items()
                       if k in ('permissions', 'description', 'color', 'icon')}
            serializer.save(**{k: allowed.get(k, getattr(instance, k))
                               for k in ('permissions', 'description', 'color', 'icon')})
            return
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        self._require_ceo()
        instance = self.get_object()
        if instance.is_system:
            return Response({'success': False, 'message': 'System roles cannot be deleted.'}, status=400)
        instance.delete()
        return Response({'success': True, 'message': 'Role deleted'})

    @action(detail=False, methods=['get'], url_path='modules')
    def list_modules(self, request):
        """Return the full permission module schema for the UI."""
        MODULES = [
            {'key': 'dashboard',          'label': 'My Dashboard',       'icon': '📊', 'perms': ['view']},
            {'key': 'er_plan',            'label': 'ER Plan',            'icon': '📋', 'perms': ['view', 'create', 'edit', 'submit', 'reopen']},
            {'key': 'kanban',             'label': 'Kanban Board',       'icon': '🗂️', 'perms': ['view']},
            {'key': 'report_history',     'label': 'Report History',     'icon': '🕐', 'perms': ['view', 'export']},
            {'key': 'calendar',           'label': 'Calendar',           'icon': '📅', 'perms': ['view']},
            {'key': 'manager_dashboard',  'label': 'Manager Dashboard',  'icon': '👔', 'perms': ['view', 'approve', 'reject']},
            {'key': 'ceo_dashboard',      'label': 'CEO Dashboard',      'icon': '🏛️', 'perms': ['view', 'export']},
            {'key': 'user_management',    'label': 'User Management',    'icon': '👥', 'perms': ['view', 'create', 'edit', 'deactivate', 'delete', 'reset_password']},
            {'key': 'role_management',    'label': 'Role Management',    'icon': '🛡️', 'perms': ['view', 'create', 'edit', 'delete']},
            {'key': 'settings_system',    'label': 'System Settings',    'icon': '⚙️', 'perms': ['view', 'edit']},
            {'key': 'settings_locations', 'label': 'Locations',          'icon': '📍', 'perms': ['view', 'create', 'edit', 'delete']},
            {'key': 'reports_export',     'label': 'Reports Export',     'icon': '📤', 'perms': ['excel', 'csv', 'pdf']},
        ]
        return Response({'success': True, 'data': MODULES})

    @action(detail=False, methods=['post'], url_path='seed')
    def seed_system_roles(self, request):
        """Seed the three built-in system roles. CEO only. Idempotent."""
        self._require_ceo()
        SYSTEM_ROLES = [
            {
                'name': 'Employee',
                'description': 'Standard employee — can submit daily ER reports and view personal data.',
                'color': '#10B981',
                'icon': '👤',
                'system_role_key': 'employee',
                'permissions': {
                    'dashboard': ['view'],
                    'er_plan': ['view', 'create', 'edit', 'submit'],
                    'kanban': ['view'],
                    'report_history': ['view'],
                    'calendar': ['view'],
                },
            },
            {
                'name': 'Manager',
                'description': 'Team manager — can approve team reports and view team data.',
                'color': '#3B82F6',
                'icon': '👔',
                'system_role_key': 'manager',
                'permissions': {
                    'dashboard': ['view'],
                    'er_plan': ['view', 'create', 'edit', 'submit', 'reopen'],
                    'kanban': ['view'],
                    'report_history': ['view', 'export'],
                    'calendar': ['view'],
                    'manager_dashboard': ['view', 'approve', 'reject'],
                    'user_management': ['view', 'create', 'edit', 'deactivate', 'reset_password'],
                    'settings_locations': ['view'],
                },
            },
            {
                'name': 'CEO',
                'description': 'Full system access — can manage users, roles, settings, and all reports.',
                'color': '#8B5CF6',
                'icon': '🏛️',
                'system_role_key': 'ceo',
                'permissions': {mod: list(perms) for mod, perms in Role.get_default_permissions().items()},
            },
        ]
        created = []
        for rd in SYSTEM_ROLES:
            role, was_created = Role.objects.get_or_create(
                system_role_key=rd['system_role_key'],
                defaults={**rd, 'is_system': True}
            )
            if not was_created:
                # Update permissions/description but keep is_system=True
                role.permissions = rd['permissions']
                role.description = rd['description']
                role.save()
            created.append(RoleSerializer(role).data)
        return Response({'success': True, 'message': f'{len(created)} system roles seeded.', 'data': created})
