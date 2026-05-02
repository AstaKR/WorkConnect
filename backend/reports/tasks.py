from celery import shared_task
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.template.loader import render_to_string
from .models import DailyReport
from settings_app.models import SystemSettings
from django.conf import settings

User = get_user_model()


def _get_context(user, subject, title, body_html, action_url=None, action_text=None):
    cfg = SystemSettings.load()
    base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    if action_url and not action_url.startswith('http'):
        action_url = f"{base_url}{action_url}"
        
    prefs = getattr(user, 'preferences', None)
    
    return {
        'recipient_name': user.full_name,
        'subject': subject,
        'company_name': cfg.company_name or 'ER Plan',
        'company_logo': cfg.company_logo_url,
        'primary_color': prefs.primary_color if prefs else '#2563EB',
        'accent_color': prefs.accent_color if prefs else '#7C3AED',
        'title': title,
        'body_html': body_html,
        'action_url': action_url,
        'action_text': action_text,
    }

def _email(subject, plain, html, to, attachments=None):
    """Helper: configure SMTP from DB then send."""
    from settings_app.email_utils import send_notification
    send_notification(subject=subject, message=plain, html_message=html, recipient_list=[to], attachments=attachments)


@shared_task
def send_report_submitted_email(report_id):
    try:
        report = DailyReport.objects.get(id=report_id)
        manager = report.user.manager
        if manager and manager.preferences.notify_report_submitted:
            time_str = timezone.now().strftime("%I:%M %p")
            subject = f"📋 Report Submitted: {report.user.full_name} at {time_str}"
            body = f"<p><strong>{report.user.full_name}</strong> has submitted their daily work report for <strong>{report.date}</strong>.</p><p>Please review and approve the report.</p>"
            html = render_to_string('emails/base.html', _get_context(
                user=manager,
                subject=subject,
                title="Daily Report Submitted",
                body_html=body,
                action_url=f"/employee/{report.user.id}",
                action_text="Review Report"
            ))
            
            # Generate CSV Attachment
            import csv
            import io
            csv_buffer = io.StringIO()
            writer = csv.writer(csv_buffer)
            # Headers matching user request
            writer.writerow(["Name", "Date", "Day", "Place of work", "Job", "Priority", "Action Plan", "Responsible person", "Remarks"])
            
            name = report.user.full_name or report.user.email
            date_str = report.date.strftime("%d-%m-%Y")
            day_str = report.date.strftime("%A")
            
            for task in report.tasks.all().order_by('order'):
                place = task.place_of_work or report.place_of_work
                writer.writerow([
                    name,
                    date_str,
                    day_str,
                    place,
                    task.job,
                    task.priority,
                    task.action_plan,
                    name,  # Responsible person
                    task.status  # Remarks
                ])
                
            csv_content = csv_buffer.getvalue()
            filename = f"Tasks_{name.replace(' ', '_')}_{date_str}.csv"
            attachments = [(filename, csv_content, 'text/csv')]

            _email(
                subject=subject,
                plain=f"{report.user.full_name} has submitted their daily report for {report.date}.",
                html=html,
                to=manager.email,
                attachments=attachments
            )
    except DailyReport.DoesNotExist:
        pass


@shared_task
def send_pending_task_reminders():
    today = timezone.localdate()
    users = User.objects.filter(is_active=True, role='employee')
    for user in users:
        if not hasattr(user, 'preferences'):
            continue
        if user.preferences.notify_pending_reminder:
            report = DailyReport.objects.filter(user=user, date=today).first()
            if not report or not report.is_submitted:
                subject = "⏰ Reminder: Submit your daily report"
                body = f"<p>This is a gentle reminder that you haven't submitted your daily work report for <strong>{today}</strong> yet.</p><p>Please submit it before the end of the day.</p>"
                html = render_to_string('emails/base.html', _get_context(
                    user=user,
                    subject=subject,
                    title="Pending Report Reminder",
                    body_html=body,
                    action_url="/",
                    action_text="Submit Report Now"
                ))
                _email(
                    subject=subject,
                    plain="Don't forget to submit your daily report for today.",
                    html=html,
                    to=user.email,
                )


@shared_task
def send_no_report_alerts():
    today = timezone.localdate()
    users = User.objects.filter(is_active=True, role='employee')
    for user in users:
        if not hasattr(user, 'preferences'):
            continue
        report = DailyReport.objects.filter(user=user, date=today).first()
        if not report or not report.is_submitted:
            if user.preferences.notify_no_report_alert:
                subject = "🚨 Alert: Missing Daily Report"
                body = f"<div class='message-box' style='border-left-color: #ef4444;'><p>You have <strong>not submitted</strong> your daily work report for <strong>{today}</strong>.</p><p>This alert has also been sent to your manager. Please submit it immediately.</p></div>"
                html = render_to_string('emails/base.html', _get_context(
                    user=user,
                    subject=subject,
                    title="Missing Report Alert",
                    body_html=body,
                    action_url="/",
                    action_text="Submit Report Now"
                ))
                _email(subject=subject, plain="You missed today's report.", html=html, to=user.email)
            
            if user.manager and hasattr(user.manager, 'preferences') and user.manager.preferences.notify_no_report_alert:
                subject = f"🚨 Alert: {user.full_name} missed today's report"
                body = f"<div class='message-box' style='border-left-color: #ef4444;'><p><strong>{user.full_name}</strong> ({user.email}) has not submitted their daily report for <strong>{today}</strong>.</p></div>"
                html = render_to_string('emails/base.html', _get_context(
                    user=user.manager,
                    subject=subject,
                    title="Employee Missing Report",
                    body_html=body,
                    action_url=f"/employee/{user.id}",
                    action_text="View Employee"
                ))
                _email(subject=subject, plain=f"{user.full_name} missed today's report.", html=html, to=user.manager.email)


@shared_task
def send_weekly_summary():
    from django.db.models import Count
    today = timezone.localdate()
    week_start = today - timezone.timedelta(days=7)
    managers = User.objects.filter(is_active=True, role__in=['manager', 'ceo'])
    for manager in managers:
        if not hasattr(manager, 'preferences') or not manager.preferences.notify_weekly_summary:
            continue
        team = User.objects.filter(manager=manager, is_active=True)
        submitted = DailyReport.objects.filter(user__in=team, date__gte=week_start, is_submitted=True).count()
        total_possible = team.count() * 7
        
        subject = "📊 Weekly Report Summary"
        body = f"<p>Here is the weekly work report summary for your team.</p><div class='message-box'><p>Your team submitted <strong>{submitted}</strong> out of <strong>{total_possible}</strong> expected reports this week.</p></div>"
        html = render_to_string('emails/base.html', _get_context(
            user=manager,
            subject=subject,
            title="Weekly Report Summary",
            body_html=body,
            action_url="/dashboard",
            action_text="View Dashboard"
        ))
        
        _email(
            subject=subject,
            plain=f"Weekly summary: {submitted}/{total_possible} reports submitted.",
            html=html,
            to=manager.email,
        )


@shared_task
def send_report_approved_email(report_id):
    try:
        report = DailyReport.objects.get(id=report_id)
        if hasattr(report.user, 'preferences') and report.user.preferences.notify_report_submitted:
            subject = f"✅ Report Approved: {report.date}"
            body = f"<p>Great news! Your manager has <strong>approved</strong> your daily report for <strong>{report.date}</strong>.</p>"
            html = render_to_string('emails/base.html', _get_context(
                user=report.user,
                subject=subject,
                title="Report Approved",
                body_html=body,
                action_url=f"/reports",
                action_text="View History"
            ))
            _email(
                subject=subject,
                plain="Your manager has approved your report.",
                html=html,
                to=report.user.email,
            )
    except DailyReport.DoesNotExist:
        pass
