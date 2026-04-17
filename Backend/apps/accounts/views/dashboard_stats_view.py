from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.core.role_permissions import IsAdmin
import logging

User = get_user_model()
app_logger = logging.getLogger('app')
error_logger = logging.getLogger('error')

class DashboardStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        app_logger.info("Dashboard statistics requested")
        
        try:
            total_users = User.objects.count()
            # Active staff: anyone with a professional role who is currently active
            active_staff = User.objects.filter(
                is_active=True, 
                role__in=['ADMIN', 'DOCTOR', 'NURSE']
            ).count()
            
            # Locked accounts: tracked for security metrics
            locked_accounts = User.objects.filter(is_locked=True).count()
            
            # Professional staff count (Total available)
            total_staff = User.objects.filter(
                role__in=['ADMIN', 'DOCTOR', 'NURSE']
            ).count()
            
            return Response({
                "success": True,
                "data": {
                    "total_users": total_users,
                    "active_staff": active_staff,
                    "locked_accounts": locked_accounts,
                    "total_staff": total_staff,
                    "security_alerts": locked_accounts, # Real-time protection proxy
                    "system_health": "100.0"
                }
            })
        except Exception as e:
            error_logger.error(f"Dashboard Stats Error: {str(e)}")
            return Response(
                {
                    "success": False, 
                    "error": "Failed to calculate system statistics"
                },
                status=status.HTTP_400_BAD_REQUEST
            )
