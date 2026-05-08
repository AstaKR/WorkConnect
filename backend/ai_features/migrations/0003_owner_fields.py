from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('ai_features', '0002_seed_features'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Add owner FK to AIProviderConfig
        migrations.AddField(
            model_name='aiproviderconfig',
            name='owner',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='ai_providers',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        # Add owner FK to AIFeatureConfig
        migrations.AddField(
            model_name='aifeatureconfig',
            name='owner',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='ai_feature_configs',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        # Remove old unique=True on feature_key
        migrations.AlterField(
            model_name='aifeatureconfig',
            name='feature_key',
            field=models.CharField(max_length=40),
        ),
        # Add unique_together (owner, feature_key)
        migrations.AlterUniqueTogether(
            name='aifeatureconfig',
            unique_together={('owner', 'feature_key')},
        ),
    ]
