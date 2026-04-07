from django.urls import path
from apps.rooms.views.nurse_views import (
    NurseRoomListView,
    NurseRoomDetailView,
)

urlpatterns = [
    path("rooms/", NurseRoomListView.as_view()),
    path("rooms/<int:room_id>/", NurseRoomDetailView.as_view()),
]