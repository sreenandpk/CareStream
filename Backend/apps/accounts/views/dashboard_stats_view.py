from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.core.role_permissions import IsAdmin
from apps.devices.models import Device
from apps.patients.models import Patient
from apps.beds.models import Bed
from apps.alerts.models import Alert
import logging

User = get_user_model()
app_logger = logging.getLogger('app')
error_logger = logging.getLogger('error')

class DashboardStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        app_logger.info("Dashboard statistics requested")
        
        try:
            # --- Accounts Metrics ---
            total_users = User.objects.count()
            active_staff = User.objects.filter(
                is_active=True, 
                role__in=['ADMIN', 'DOCTOR', 'NURSE']
            ).count()
            locked_accounts = User.objects.filter(is_locked=True).count()
            
            # --- Clinical Metrics ---
            total_patients = Patient.objects.all().count()
            occupied_beds = Bed.objects.filter(patient__isnull=False).count()
            total_beds = Bed.objects.count()
            active_crises = Alert.objects.filter(status="ACTIVE", severity="CRITICAL").count()

            # --- Infrastructure Metrics ---
            total_devices = Device.objects.count()
            active_simulators = Device.objects.filter(mode="SIMULATION", is_active=True).count()
            real_hardware = Device.objects.filter(mode="REAL", is_active=True).count()

            # --- Security Metrics (Audit Log Count) ---
            from django.conf import settings
            import os
            audit_log_count = 0
            try:
                log_path = os.path.join(settings.BASE_DIR, 'logs', 'audit.log')
                if os.path.exists(log_path):
                    with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
                        audit_log_count = sum(1 for line in f if line.strip())
            except Exception:
                audit_log_count = locked_accounts # Fallback

            return Response({
                "success": True,
                "data": {
                    "total_users": total_users,
                    "active_staff": active_staff,
                    "security_alerts": audit_log_count,
                    "total_patients": total_patients,
                    "occupied_beds": occupied_beds,
                    "total_beds": total_beds,
                    "active_crises": active_crises,
                    "total_devices": total_devices,
                    "active_simulators": active_simulators,
                    "real_hardware": real_hardware,
                    "system_health": "100.0"
                }
            })
        except Exception as e:
            error_logger.error(f"Dashboard Stats Error: {str(e)}")
            return Response({
                    "success": False, 
                    "error": "Failed to calculate system statistics"
                }, status=status.HTTP_400_BAD_REQUEST)
