import logging
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from apps.core.role_permissions import IsAdminOrSystemAdmin
from apps.core.pagination import StandardResultsSetPagination
from apps.wards.models import Ward
from apps.wards.serializers.admin_serializers import AdminWardSerializer

from apps.wards.services.ward_service import (
    get_all_wards,
    create_ward,
    update_ward,
    delete_ward,
)

app_logger = logging.getLogger("app")
audit_logger = logging.getLogger("audit")


class AdminWardListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSystemAdmin]
    pagination_class = StandardResultsSetPagination

    @extend_schema(
        tags=["Wards Admin"],
        responses=AdminWardSerializer(many=True),
    )
    def get(self, request):
        app_logger.info(f"Ward list requested by {request.user.username}")

        search_query = request.query_params.get('search', '')

        # ✅ PERFORMANCE + SEARCH
        wards = (
            get_all_wards()
            .prefetch_related("rooms__beds")   # deep relation
        )

        if search_query:
            from django.db.models import Q
            wards = wards.filter(
                Q(name__icontains=search_query) |
                Q(floor__icontains=search_query)
            )

        paginator = self.pagination_class()
        result_page = paginator.paginate_queryset(wards, request)
        serializer = AdminWardSerializer(result_page, many=True)

        return paginator.get_paginated_response(serializer.data)


    @extend_schema(
        tags=["Wards Admin"],
        request=AdminWardSerializer,
        responses=AdminWardSerializer,
    )
    def post(self, request):
        app_logger.info(f"Create ward request by {request.user.username}")

        serializer = AdminWardSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ward = create_ward(serializer.validated_data, request.user)

        audit_logger.info(
            f"Ward created {ward.name} by {request.user.username}"
        )

        return Response({
            "success": True,
            "data": AdminWardSerializer(ward).data,
        }, status=status.HTTP_201_CREATED)


class AdminWardDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSystemAdmin]

    @extend_schema(
        tags=["Wards Admin"],
        responses=AdminWardSerializer,
    )
    def get(self, request, ward_id):
        app_logger.info(
            f"Ward detail requested {ward_id} by {request.user.username}"
        )

        ward = get_object_or_404(
            Ward.objects.prefetch_related("rooms__beds"),
            id=ward_id
        )

        return Response({
            "success": True,
            "data": AdminWardSerializer(ward).data,
        })


    @extend_schema(
        tags=["Wards Admin"],
        request=AdminWardSerializer,
        responses=AdminWardSerializer,
    )
    def put(self, request, ward_id):
        app_logger.info(
            f"Ward update request {ward_id} by {request.user.username}"
        )

        ward_instance = get_object_or_404(Ward, id=ward_id)

        serializer = AdminWardSerializer(
            instance=ward_instance,
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        ward = update_ward(
            ward_id,
            serializer.validated_data,
            request.user,
        )

        audit_logger.info(
            f"Ward updated {ward.id} by {request.user.username}"
        )

        return Response({
            "success": True,
            "data": AdminWardSerializer(ward).data,
        })


    @extend_schema(
        tags=["Wards Admin"],
        request=AdminWardSerializer,
        responses=AdminWardSerializer,
    )
    def patch(self, request, ward_id):
        app_logger.info(f"Ward partial update {ward_id}")
        ward_instance = get_object_or_404(Ward, id=ward_id)
        serializer = AdminWardSerializer(ward_instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        ward = update_ward(ward_id, serializer.validated_data, request.user)
        return Response({
            "success": True,
            "data": AdminWardSerializer(ward).data,
        })


    @extend_schema(
        tags=["Wards Admin"],
        responses=None,
    )
    def delete(self, request, ward_id):
        app_logger.info(
            f"Ward delete request {ward_id} by {request.user.username}"
        )

        delete_ward(ward_id, request.user)

        audit_logger.info(
            f"Ward deleted {ward_id} by {request.user.username}"
        )

        return Response({
            "success": True,
            "message": "Ward deleted",
        }, status=status.HTTP_204_NO_CONTENT)