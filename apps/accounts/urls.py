from django.urls import path
from .views.auth_views import (
    LoginView,
    RefreshView,
    LogoutView,
    VerifyOTPView,
)
from .views.user_views import CreateUserView
urlpatterns = [
    path("login/", LoginView.as_view()),
    path("verify-otp/", VerifyOTPView.as_view()),
    path("refresh/", RefreshView.as_view()),
    path("logout/", LogoutView.as_view()),
    path("create-user/", CreateUserView.as_view()),

]