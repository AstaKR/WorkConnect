from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from .models import SystemSettings
from .email_utils import send_notification
from accounts.models import UserPreferences
from accounts.serializers import UserPreferencesSerializer

def _to_bool(value):
    """Safely coerce a FormData string value to bool."""
    if isinstance(value, bool):
        return value
    return str(value).lower() in ('true', '1', 'yes')

class SystemSettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        if request.user.role != 'ceo':
            return Response({'success': False, 'message': 'Unauthorized'}, status=403)
            
        settings = SystemSettings.load()
        
        logo_url = settings.company_logo_url
        if settings.company_logo:
            logo_url = request.build_absolute_uri(settings.company_logo.url)

        data = {
            'ai_provider': settings.ai_provider,
            'company_name': settings.company_name,
            'company_logo_url': logo_url,
            'has_gemini_key': bool(settings.gemini_api_key),
            'has_openai_key': bool(settings.openai_api_key),
            'has_anthropic_key': bool(settings.anthropic_api_key),
            'has_groq_key': bool(settings.groq_api_key),
            'maintenance_mode': settings.maintenance_mode,
            'require_location': settings.require_location,
            'smtp_host': settings.smtp_host,
            'smtp_port': settings.smtp_port,
            'smtp_user': settings.smtp_user,
            'has_smtp_password': bool(settings.smtp_password),
            'smtp_use_tls': settings.smtp_use_tls,
        }
        return Response({'success': True, 'data': data})

    def patch(self, request):
        if request.user.role != 'ceo':
            return Response({'success': False, 'message': 'Unauthorized'}, status=403)
            
        settings = SystemSettings.load()
        
        # Update allowed fields
        if 'ai_provider' in request.data:
            settings.ai_provider = request.data['ai_provider']
        if 'company_name' in request.data:
            settings.company_name = request.data['company_name']
        if 'company_logo_url' in request.data:
            settings.company_logo_url = request.data['company_logo_url']
            
        if 'company_logo' in request.FILES:
            settings.company_logo = request.FILES['company_logo']
            settings.company_logo_url = '' # Clear the URL if file is uploaded
            
        if 'maintenance_mode' in request.data:
            settings.maintenance_mode = _to_bool(request.data['maintenance_mode'])
        if 'require_location' in request.data:
            settings.require_location = _to_bool(request.data['require_location'])
            
        if 'smtp_host' in request.data:
            settings.smtp_host = request.data['smtp_host']
        if 'smtp_port' in request.data:
            try:
                settings.smtp_port = int(request.data['smtp_port'])
            except (ValueError, TypeError):
                settings.smtp_port = 587
        if 'smtp_user' in request.data:
            settings.smtp_user = request.data['smtp_user']
        if 'smtp_use_tls' in request.data:
            settings.smtp_use_tls = _to_bool(request.data['smtp_use_tls'])
            
        # Update passwords/keys if provided
        if 'gemini_api_key' in request.data and request.data['gemini_api_key']:
            settings.gemini_api_key = request.data['gemini_api_key']
        if 'smtp_password' in request.data and request.data['smtp_password']:
            settings.smtp_password = request.data['smtp_password']
            
        settings.updated_by = request.user
        settings.save()

        return Response({'success': True, 'message': 'Settings updated successfully'})


class PublicSettingsView(APIView):
    """ Publicly accessible branding settings """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        settings = SystemSettings.load()
        logo_url = settings.company_logo_url
        if settings.company_logo:
            logo_url = request.build_absolute_uri(settings.company_logo.url)

        return Response({
            'success': True,
            'data': {
                'company_name': settings.company_name,
                'company_logo_url': logo_url,
            }
        })


class AppearanceSettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        prefs, _ = UserPreferences.objects.get_or_create(user=request.user)
        return Response({'success': True, 'data': UserPreferencesSerializer(prefs).data})

    def patch(self, request):
        prefs, _ = UserPreferences.objects.get_or_create(user=request.user)
        serializer = UserPreferencesSerializer(prefs, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'success': True, 'data': serializer.data, 'message': 'Appearance updated'})
        return Response({'success': False, 'data': serializer.errors}, status=400)


class TestEmailView(APIView):
    """ CEO can send a test email to verify SMTP settings """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role != 'ceo':
            return Response({'success': False, 'message': 'Unauthorized'}, status=403)

        cfg = SystemSettings.load()
        if not cfg.smtp_host or not cfg.smtp_user or not cfg.smtp_password:
            return Response({
                'success': False,
                'message': 'SMTP is not configured. Please fill in the SMTP settings and save first.'
            }, status=400)

        success, message = send_notification(
            subject='✅ ER Plan — Test Email',
            message='This is a test email from your ER Plan system. SMTP is working correctly!',
            html_message='''
                <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px">
                    <h2 style="color:#2563eb;margin-bottom:8px">✅ SMTP Configuration Test</h2>
                    <p style="color:#374151">This is a test email from your <strong>ER Plan</strong> system.</p>
                    <p style="color:#374151">If you received this, your SMTP settings are working correctly!</p>
                    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
                    <p style="color:#9ca3af;font-size:12px">ER Work Report System — System Configuration</p>
                </div>
            ''',
            recipient_list=[request.user.email],
        )
        return Response({'success': success, 'message': message})
