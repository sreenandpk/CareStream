from django.urls import path
from apps.rooms.views.doctor_views import (
    DoctorRoomListView,
    DoctorRoomDetailView,
)

urlpatterns = [
    path("rooms/", DoctorRoomListView.as_view()),
    path("rooms/<int:room_id>/", DoctorRoomDetailView.as_view()),
]