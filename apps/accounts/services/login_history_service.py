from apps.accounts.models import LoginHistory


def save_login_history(
    request,
    username,
    user=None,
    success=False,
    reason=None,
):

    ip = request.META.get("REMOTE_ADDR")
    agent = request.META.get("HTTP_USER_AGENT")

    LoginHistory.objects.create(
        user=user,
        username=username,
        ip_address=ip,
        user_agent=agent,
        success=success,
        reason=reason,
    )