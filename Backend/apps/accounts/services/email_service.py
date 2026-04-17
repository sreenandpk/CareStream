import logging
from django.conf import settings
from django.core.mail import send_mail
app_logger = logging.getLogger("app")

def send_identity_verification_signal(email, username):
    """
    🛡️ IDENTITY SHIELD: Sends a high-priority signal via SendGrid.
    This triggers the SendGrid webhook and allows the Interceptor to catch 
    non-existent mailboxes (ghost accounts) before they enter the system.
    """
    subject = "CareStream - Identity Verification Signal"
    message = f"Hello {username}, we are verifying your mailbox for clinical access. No action required."
    
    # Use default EMAIL_BACKEND (SendGrid) to trigger webhooks
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        print(f"📡 [SIGNAL] Identity Verification Signal broadcasted to {email} via SENDGRID")
    except Exception as e:
        print(f"❌ [SIGNAL FAILURE] Could not broadcast signal for {email}. Error: {e}")
        app_logger.error(f"SendGrid Signal Failure for {email}: {e}")


def send_auth_otp(email, username, code, otp_type):
    if otp_type == "RESET":
        subject = "CareStream - Password Reset Verification"
        message = f"""
Hello {username},

You have requested to reset your CareStream password. 
Please use the 6-digit verification code below to authorize this change:

Verification Code: {code}

This code will expire in 5 minutes. If you did not request this, please ignore this email.

Best regards,
CareStream Security Team
"""
    elif otp_type == "EMAIL_CHANGE":
        subject = "CareStream - Email Change Verification"
        message = f"""
Hello {username},

An administrator has requested to update the email address for your CareStream profile. 
Please use the following 6-digit verification code to authorize this identity change:

Verification Code: {code}

This code will expire in 5 minutes. If you did not expect this change, please contact system security immediately.

Best regards,
CareStream Security Team
"""
    else:
        subject = "CareStream - Login Verification Code"
        message = f"""
Hello {username},

Your login verification code for CareStream is:

{code}

This code will expire in 5 minutes.

Security Note: Do not share this code with anyone.
"""
    
    # 🔓 EMERGENCY BACKDOOR: Print OTP to console in case SMTP is blocked
    print("\n" + "🔑" * 20)
    print(f"SECURITY ALERT: {otp_type} OTP for {username} ({email}) is: {code}")
    print("🔑" * 20 + "\n")

    try:
        from django.core.mail import get_connection
        # 🚀 Use the RELIABLE GMAIL ENGINE for OTPs to avoid Spam folders
        connection = get_connection(
            host=settings.GMAIL_SMTP_HOST,
            port=settings.GMAIL_SMTP_PORT,
            username=settings.GMAIL_SMTP_USER,
            password=settings.GMAIL_SMTP_PASSWORD,
            use_tls=True
        )
        
        send_mail(
            subject,
            message,
            settings.GMAIL_SMTP_USER,
            [email],
            fail_silently=False,
            connection=connection
        )
        print(f"✅ GMAIL DISPATCH SUCCESS: {subject} landed in {email} from {settings.GMAIL_SMTP_USER}")
    except Exception as e:
        logger = logging.getLogger(__name__)
        print(f"❌ GMAIL FAILURE: Could not send OTP to {email}. Error: {e}")
        logger.error(f"Failed to send {otp_type} OTP to {email}: {e}")

def send_user_credentials(email, username, password):
    subject = "CareStream Account Created"
    message = f"""
Welcome to CareStream! 

Your account has been created successfully.
Username: {username}
Temporary Password: {password}

Please log in and change your password immediately.
"""
    # 🔓 ADMIN MIRROR: Print credentials to console so you can see them instantly
    print("\n" + "💎" * 20)
    print(f"NEW USER ACCOUNT CREATED")
    print(f"Email: {email}")
    print(f"Username: {username}")
    print(f"Temp Password: {password}")
    print("💎" * 20 + "\n")

    try:
        from django.core.mail import get_connection
        # 🚀 Use the RELIABLE GMAIL ENGINE for Registration emails to hit the Inbox
        connection = get_connection(
            host=settings.GMAIL_SMTP_HOST,
            port=settings.GMAIL_SMTP_PORT,
            username=settings.GMAIL_SMTP_USER,
            password=settings.GMAIL_SMTP_PASSWORD,
            use_tls=True
        )

        send_mail(
            subject,
            message,
            settings.GMAIL_SMTP_USER,
            [email],
            fail_silently=False,
            connection=connection
        )
        print(f"✅ GMAIL DISPATCH SUCCESS: Account Created sent to {email} from {settings.GMAIL_SMTP_USER}")
    except Exception as e:
        logger = logging.getLogger(__name__)
        print(f"❌ GMAIL FAILURE: Could not send credentials to {email}. Error: {e}")
        logger.error(f"Failed to send credentials to {email}: {e}")