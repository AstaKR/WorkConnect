from rest_framework import serializers
from .models import DailyReport, TaskEntry, ReportApproval, WorkLocation

class WorkLocationSerializer(serializers.ModelSerializer):
    is_custom = serializers.SerializerMethodField()

    class Meta:
        model = WorkLocation
        fields = ['id', 'name', 'category', 'icon', 'is_default', 'is_custom', 'created_by']
        read_only_fields = ['is_default', 'created_by']

    def get_is_custom(self, obj):
        return obj.created_by_id is not None

class TaskEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskEntry
        exclude = ('report',)

class ReportApprovalSerializer(serializers.ModelSerializer):
    approved_by_name = serializers.CharField(source='approved_by.full_name', read_only=True)
    
    class Meta:
        model = ReportApproval
        fields = '__all__'

class DailyReportSerializer(serializers.ModelSerializer):
    tasks = TaskEntrySerializer(many=True, read_only=True)
    approval = ReportApprovalSerializer(read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    
    class Meta:
        model = DailyReport
        fields = '__all__'
        read_only_fields = ('user', 'is_submitted', 'submitted_at')
