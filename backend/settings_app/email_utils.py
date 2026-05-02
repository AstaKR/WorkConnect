"""
Dynamic SMTP configuration loaded from SystemSettings.
Call configure_smtp() before sending any email to ensure the DB settings are used.
"""
from django.core import mail
from django.conf import settings as django_settings


def get_smtp_connection():
    """
    Returns an explicit Django EmailBackend connection using the values
    stored in the SystemSettings database record.
    Returns (connection, from_email) if configured, or (None, None) if missing.
    """
    from .models import SystemSettings
    from django.core.mail.backends.smtp import EmailBackend
    cfg = SystemSettings.load()

    if not cfg.smtp_host or not cfg.smtp_user or not cfg.smtp_password:
        return None, None

    connection = EmailBackend(
        host=cfg.smtp_host,
        port=cfg.smtp_port or 587,
        username=cfg.smtp_user,
        password=cfg.smtp_password,
        use_tls=cfg.smtp_use_tls,
        fail_silently=False,
    )
    return connection, cfg.smtp_user


def send_notification(subject: str, message: str, html_message: str, recipient_list: list, attachments: list = None):
    """
    Create an explicit SMTP connection from DB settings, then send an email.
    attachments should be a list of tuples: (filename, content, mimetype)
    """
    connection, from_email = get_smtp_connection()
    if not connection:
        return False, "SMTP is not configured in System Settings. Please configure it first."
        
    from django.core.mail import EmailMultiAlternatives
    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=message,
            from_email=from_email,
            to=recipient_list,
            connection=connection
        )
        if html_message:
            msg.attach_alternative(html_message, "text/html")
        
        if attachments:
            for attachment in attachments:
                msg.attach(*attachment)

        
        msg.send(fail_silently=False)
        return True, 'Email sent successfully'
    except Exception as e:
        return False, str(e)
