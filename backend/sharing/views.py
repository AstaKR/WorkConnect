from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.shortcuts import get_object_or_404
from .models import ShareLink
from reports.models import DailyReport
from reports.serializers import DailyReportSerializer

class CreateShareLinkView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, report_id):
        report = get_object_or_404(DailyReport, id=report_id)
        
        # Only manager or ceo can share, or the employee themselves
        if request.user != report.user and request.user.role not in ['manager', 'ceo'] and request.user != report.user.manager:
            return Response({'success': False, 'message': 'Unauthorized'}, status=403)
            
        # Create or get existing active link
        link, created = ShareLink.objects.get_or_create(
            report=report,
            is_active=True,
            defaults={'created_by': request.user}
        )
        
        # Build absolute URI for the frontend public route
        share_url = f"{request.scheme}://{request.get_host()}/share/{link.token}"
        # In a real app we'd build the frontend URL from settings. 
        # Assuming frontend is on port 5173 for local dev:
        frontend_share_url = f"http://localhost:5173/share/{link.token}"
        
        return Response({
            'success': True, 
            'data': {
                'token': link.token,
                'url': frontend_share_url,
                'expires_at': link.expires_at
            }
        })

class PublicShareView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        link = get_object_or_404(ShareLink, token=token)
        
        if not link.is_valid():
            return Response({'success': False, 'message': 'This link has expired or been deactivated.'}, status=404)
            
        # Increment view count
        link.view_count += 1
        link.save()
        
        serializer = DailyReportSerializer(link.report)
        return Response({'success': True, 'data': serializer.data})
