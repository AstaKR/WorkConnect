from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(model_name='user', name='profile_pic',
            field=models.ImageField(blank=True, null=True, upload_to='profiles/'),),
        migrations.AddField(model_name='user', name='dob',
            field=models.DateField(blank=True, null=True),),
        migrations.AddField(model_name='user', name='address',
            field=models.TextField(blank=True, null=True),),
        migrations.AddField(model_name='user', name='city',
            field=models.CharField(blank=True, max_length=100, null=True),),
        migrations.AddField(model_name='user', name='state',
            field=models.CharField(blank=True, max_length=100, null=True),),
        migrations.AddField(model_name='user', name='pincode',
            field=models.CharField(blank=True, max_length=10, null=True),),
        migrations.AddField(model_name='user', name='designation',
            field=models.CharField(blank=True, max_length=100, null=True),),
        migrations.AddField(model_name='user', name='grade',
            field=models.CharField(blank=True, max_length=50, null=True),),
        migrations.AddField(model_name='user', name='employment_status',
            field=models.CharField(
                choices=[('active', 'Active'), ('probation', 'Probation'), ('on_leave', 'On Leave'),
                         ('resigned', 'Resigned'), ('terminated', 'Terminated'), ('retired', 'Retired')],
                default='active', max_length=20),),
        migrations.AddField(model_name='user', name='start_date',
            field=models.DateField(blank=True, null=True),),
        migrations.AddField(model_name='user', name='last_working_date',
            field=models.DateField(blank=True, null=True),),
        migrations.AddField(model_name='user', name='emergency_contact_name',
            field=models.CharField(blank=True, max_length=100, null=True),),
        migrations.AddField(model_name='user', name='emergency_contact_phone',
            field=models.CharField(blank=True, max_length=20, null=True),),
        migrations.AddField(model_name='user', name='emergency_contact_relation',
            field=models.CharField(blank=True, max_length=50, null=True),),
    ]
