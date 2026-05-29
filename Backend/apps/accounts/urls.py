from django.urls import path
from .views.auth_views import (
    LoginView,
    RefreshView,
    LogoutView,
    VerifyOTPView,
    ForgotPasswordView,
    ConfirmResetView,
    DemoLoginView,
)
from .views.user_views import (
    CreateUserView,
    UserListView,
    UserDetailView,
    UserUpdateView,
    UserDeactivateView,
    ChangePasswordView,
    AdminForceResetView,
    UnlockUserView,
    OnlineUsersView,
)
from apps.accounts.views.login_history_views import (
    LoginHistoryListView,
)
from apps.accounts.views.session_views import (
    ForceLogoutUserView,
    ForceLogoutAllView,
)
from apps.accounts.views.dashboard_stats_view import DashboardStatsView

urlpatterns = [
    path("login/", LoginView.as_view()),
    path("demo-login/", DemoLoginView.as_view()),
    path("verify-otp/", VerifyOTPView.as_view()),
    path("refresh/", RefreshView.as_view()),
    path("logout/", LogoutView.as_view()),
    path("forgot-password/", ForgotPasswordView.as_view()),
    path("confirm-reset/", ConfirmResetView.as_view()),
    path("create-user/", CreateUserView.as_view()),
    path("users/", UserListView.as_view()),
    path("users/<int:user_id>/", UserDetailView.as_view()),
    path("users/<int:user_id>/update/", UserUpdateView.as_view()),
    path("users/<int:user_id>/deactivate/", UserDeactivateView.as_view()),
    path("change-password/", ChangePasswordView.as_view()),
    path("users/<int:user_id>/force-reset/", AdminForceResetView.as_view()),
    path("users/<int:user_id>/unlock/", UnlockUserView.as_view()),
    path("login-history/", LoginHistoryListView.as_view()),
    path("sessions/force-logout/<int:user_id>/", ForceLogoutUserView.as_view()),
    path("sessions/force-logout-all/", ForceLogoutAllView.as_view()),
    path("online-users/", OnlineUsersView.as_view()),
    path("dashboard-stats/", DashboardStatsView.as_view()),
]