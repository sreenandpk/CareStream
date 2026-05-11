import logging
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema

from apps.core.role_permissions import IsAdminOrSystemAdmin
from apps.wards.models import NurseShift, Ward
from apps.wards.serializers.admin_shift_serializers import AdminNurseShiftSerializer

app_logger = logging.getLogger("app")

class AdminNurseShiftListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSystemAdmin]

    @extend_schema(
        tags=["Wards Shifts Admin"],
        responses=AdminNurseShiftSerializer(many=True),
    )
    def get(self, request):
        ward_id = request.query_params.get("ward")
        nurse_id = request.query_params.get("nurse")
        
        queryset = NurseShift.objects.all().order_by("-start_time")
        
        if ward_id:
            queryset = queryset.filter(ward_id=ward_id)
        if nurse_id:
            queryset = queryset.filter(nurse_id=nurse_id)
            
        serializer = AdminNurseShiftSerializer(queryset, many=True)
        return Response({
            "success": True,
            "results": serializer.data
        })

    @extend_schema(
        tags=["Wards Shifts Admin"],
        request=AdminNurseShiftSerializer,
        responses=AdminNurseShiftSerializer,
    )
    def post(self, request):
        app_logger.info(f"Create shift request by {request.user.username}")
        serializer = AdminNurseShiftSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Ensure the nurse is actually assigned to the ward
        nurse = serializer.validated_data["nurse"]
        ward = serializer.validated_data["ward"]
        
        if not ward.nurses.filter(id=nurse.id).exists():
             return Response({
                "success": False,
                "message": f"Nurse {nurse.username} is not assigned to {ward.name}. Assign them to the ward first."
            }, status=status.HTTP_400_BAD_REQUEST)

        shift = serializer.save(created_by=request.user, updated_by=request.user)
        return Response({
            "success": True,
            "data": AdminNurseShiftSerializer(shift).data
        }, status=status.HTTP_201_CREATED)

class AdminNurseShiftDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSystemAdmin]

    @extend_schema(
        tags=["Wards Shifts Admin"],
        responses=AdminNurseShiftSerializer,
    )
    def get(self, request, shift_id):
        shift = get_object_or_404(NurseShift, id=shift_id)
        serializer = AdminNurseShiftSerializer(shift)
        return Response({
            "success": True,
            "data": serializer.data
        })

    def patch(self, request, shift_id):
        app_logger.info(f"Update shift request {shift_id} by {request.user.username}")
        shift = get_object_or_404(NurseShift, id=shift_id)
        serializer = AdminNurseShiftSerializer(shift, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return Response({
            "success": True,
            "data": serializer.data
        })

    @extend_schema(
        tags=["Wards Shifts Admin"],
        responses=None,
    )
    def delete(self, request, shift_id):
        shift = get_object_or_404(NurseShift, id=shift_id)
        shift.delete() # Hard delete for shifts is generally fine if they are wrong entries
        return Response({
            "success": True,
            "message": "Shift deleted"
        }, status=status.HTTP_204_NO_CONTENT)
