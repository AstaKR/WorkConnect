import pytest
from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


class AIViewAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='employee@test.com', full_name='Test Employee',
            password='TestPass@123', role='employee',
        )

    def test_spell_check_requires_auth(self):
        resp = self.client.post('/api/ai/spell-check/', {'text': 'helllo'})
        self.assertEqual(resp.status_code, 401)

    def test_spell_check_requires_text(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.post('/api/ai/spell-check/', {})
        self.assertEqual(resp.status_code, 400)
        self.assertFalse(resp.data['success'])

    def test_sentence_maker_requires_text(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.post('/api/ai/sentence-maker/', {})
        self.assertEqual(resp.status_code, 400)

    def test_action_plan_requires_job(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.post('/api/ai/action-plan/', {})
        self.assertEqual(resp.status_code, 400)

    def test_team_insights_requires_manager_role(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.post('/api/ai/team-insights/', {'date_from': '2026-01-01', 'date_to': '2026-01-07'})
        self.assertEqual(resp.status_code, 403)

    def test_admin_providers_requires_ceo(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.get('/api/ai/admin/providers/')
        self.assertEqual(resp.status_code, 403)
