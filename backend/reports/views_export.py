from rest_framework.views import APIView
from rest_framework import permissions
from django.http import HttpResponse
from .models import DailyReport
import openpyxl
from django.utils import timezone

class ExportReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            report = DailyReport.objects.get(pk=pk)
            
            # Authorization check
            if request.user != report.user and request.user.role not in ['manager', 'ceo'] and request.user != report.user.manager:
                return HttpResponse('Unauthorized', status=403)
                
            workbook = openpyxl.Workbook()
            sheet = workbook.active
            sheet.title = f"Report_{report.date}"
            
            # Headers
            sheet.append(["Job / Task", "Priority", "Status", "Action Plan"])
            
            for task in report.tasks.all().order_by('order'):
                sheet.append([
                    task.job,
                    task.priority,
                    task.status,
                    task.action_plan or ''
                ])
                
            response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = f'attachment; filename="Report_{report.user.full_name.replace(" ", "_")}_{report.date}.xlsx"'
            
            workbook.save(response)
            return response
            
        except DailyReport.DoesNotExist:
            return HttpResponse('Report not found', status=404)
