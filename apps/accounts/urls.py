from django.urls import path
from .views.auth_views import (
    LoginView,
    RefreshView,
    LogoutView,
    VerifyOTPView,
    ForgotPasswordView,
    VerifyResetOTPView,
    ResetPasswordView,
)
from .views.user_views import (
    CreateUserView,
    UserListView,
    UserDetailView,
    UserUpdateView,
    UserDeactivateView,
    ChangePasswordView,
    AdminForceResetView,
    UnlockUserView
)
urlpatterns = [
    path("login/", LoginView.as_view()),
    path("verify-otp/", VerifyOTPView.as_view()),
    path("refresh/", RefreshView.as_view()),
    path("logout/", LogoutView.as_view()),
    path("create-user/", CreateUserView.as_view()),
    path("users/", UserListView.as_view()),
    path("users/<int:user_id>/", UserDetailView.as_view()),
    path("users/<int:user_id>/update/", UserUpdateView.as_view()),
    path("users/<int:user_id>/deactivate/", UserDeactivateView.as_view()),
    path("change-password/",ChangePasswordView.as_view()),
    path("forgot-password/", ForgotPasswordView.as_view()),
    path("verify-reset-otp/", VerifyResetOTPView.as_view()),
    path("reset-password/", ResetPasswordView.as_view()),
    path("users/<int:user_id>/force-reset/",AdminForceResetView.as_view()),
    path("users/<int:user_id>/unlock/",UnlockUserView.as_view()),
]