from django.urls import path

from apps.rooms.views.admin_views import (
    AdminRoomListCreateView,
    AdminRoomDetailView,
)


urlpatterns = [

    path(
        "admin/rooms/",
        AdminRoomListCreateView.as_view(),
    ),

    path(
        "admin/rooms/<int:room_id>/",
        AdminRoomDetailView.as_view(),
    ),

]