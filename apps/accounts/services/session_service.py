from apps.accounts.models import UserSession
def create_session(
    request,
    user,
    token,
):
    ip = request.META.get("REMOTE_ADDR")
    agent = request.META.get("HTTP_USER_AGENT")
    UserSession.objects.create(
        user=user,
        token=token,
        ip_address=ip,
        user_agent=agent,
        is_active=True,
    )
def close_session(token):
    try:
        session = UserSession.objects.get(
            token=token,
            is_active=True,
        )
        session.is_active = False
        session.save()
    except UserSession.DoesNotExist:
        pass
def force_logout_user(user):
    sessions = UserSession.objects.filter(
        user=user,
        is_active=True,
    )
    for s in sessions:
        s.is_active = False
        s.save()
def force_logout_all():
    sessions = UserSession.objects.filter(
        is_active=True,
    )
    for s in sessions:
        s.is_active = False
        s.save()
def get_active_sessions():
    return UserSession.objects.filter(
        is_active=True
    ).select_related("user")