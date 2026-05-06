from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import UserPreferences, Role

User = get_user_model()


class RoleSerializer(serializers.ModelSerializer):
    user_count = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = ['id', 'name', 'description', 'color', 'icon', 'is_system',
                  'system_role_key', 'permissions', 'user_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'is_system', 'system_role_key', 'created_at', 'updated_at']

    def get_user_count(self, obj):
        if obj.system_role_key:
            return User.objects.filter(role=obj.system_role_key).count()
        return 0


class UserPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreferences
        exclude = ('user', 'id')


class UserSerializer(serializers.ModelSerializer):
    preferences = UserPreferencesSerializer(read_only=True)
    manager_name = serializers.CharField(source='manager.full_name', read_only=True)
    manager_email = serializers.CharField(source='manager.email', read_only=True)
    profile_pic_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'role', 'account_type', 'is_active',
            # Personal
            'profile_pic', 'profile_pic_url', 'dob', 'phone',
            'address', 'city', 'state', 'pincode',
            # Professional
            'employee_id', 'designation', 'grade', 'department',
            'manager', 'manager_name', 'manager_email',
            'employment_status', 'start_date', 'last_working_date',
            # Emergency
            'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
            # Meta
            'date_joined', 'preferences',
        ]
        read_only_fields = ['id', 'account_type', 'date_joined', 'preferences', 'profile_pic_url', 'manager_name', 'manager_email']

    def get_profile_pic_url(self, obj):
        if obj.profile_pic:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_pic.url)
            return obj.profile_pic.url
        return None


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            'email', 'full_name', 'password', 'role', 'account_type',
            'dob', 'phone', 'address', 'city', 'state', 'pincode',
            'employee_id', 'designation', 'grade', 'department',
            'manager', 'employment_status', 'start_date', 'last_working_date',
            'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
        ]

    def validate_password(self, value):
        import re
        if len(value) < 8:
            raise serializers.ValidationError('Password must be at least 8 characters.')
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError('Password must contain at least one uppercase letter.')
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError('Password must contain at least one lowercase letter.')
        if not re.search(r'\d', value):
            raise serializers.ValidationError('Password must contain at least one digit.')
        return value

    def validate_email(self, value):
        return value.lower().strip()

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user, context=self.context).data
        return data
