from django.db import migrations

FEATURES = [
    {'feature_key': 'spell_check',    'display_name': '✨ Spell & Grammar Check',  'max_tokens': 200},
    {'feature_key': 'sentence_maker', 'display_name': '💬 Sentence Maker',          'max_tokens': 150},
    {'feature_key': 'action_plan',    'display_name': '🎯 Action Plan Generator',   'max_tokens': 300},
    {'feature_key': 'detect_priority','display_name': '🔥 Priority Detection',      'max_tokens': 10},
    {'feature_key': 'daily_summary',  'display_name': '📋 Daily Summary',           'max_tokens': 400},
    {'feature_key': 'task_breakdown', 'display_name': '🧩 Task Breakdown',          'max_tokens': 400},
    {'feature_key': 'team_insights',  'display_name': '📊 Team Insights',           'max_tokens': 500},
]


def seed_features(apps, schema_editor):
    AIFeatureConfig = apps.get_model('ai_features', 'AIFeatureConfig')
    for f in FEATURES:
        AIFeatureConfig.objects.get_or_create(
            feature_key=f['feature_key'],
            defaults={
                'display_name': f['display_name'],
                'max_tokens': f['max_tokens'],
                'is_enabled': True,
            }
        )


def unseed_features(apps, schema_editor):
    AIFeatureConfig = apps.get_model('ai_features', 'AIFeatureConfig')
    AIFeatureConfig.objects.filter(
        feature_key__in=[f['feature_key'] for f in FEATURES]
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('ai_features', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_features, unseed_features),
    ]
