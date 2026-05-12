import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.core.role_permissions import IsSystemAdmin, IsAdmin
from django.conf import settings

class LogFileView(APIView):
    # Allow both System Admin and Admin to view logs as requested in previous unify task
    permission_classes = [IsAuthenticated, (IsSystemAdmin | IsAdmin)]

    def get(self, request, filename):
        # Ensure filename is one of the expected logs
        valid_logs = ['app.log', 'audit.log', 'error.log', 'security.log']
        if filename not in valid_logs:
            return Response({"error": "Invalid log file request"}, status=400)

        log_dir = os.path.join(settings.BASE_DIR, 'logs')
        file_path = os.path.join(log_dir, filename)
        
        if not os.path.exists(file_path):
             return Response({"error": f"Log file {filename} not found"}, status=404)

        try:
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 100))
        except ValueError:
            page = 1
            page_size = 100
        
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                # Read all lines and filter out whitespace-only ones
                lines = [line.strip() for line in f.readlines() if line.strip()]
            
            # Show newest logs first
            lines.reverse()
            
            total_lines = len(lines)
            start = (page - 1) * page_size
            end = start + page_size
            
            paginated_lines = lines[start:end]
            
            return Response({
                "filename": filename,
                "lines": paginated_lines,
                "page": page,
                "page_size": page_size,
                "total_lines": total_lines,
                "total_pages": (total_lines // page_size) + (1 if total_lines % page_size > 0 else 0)
            })
        except Exception as e:
            return Response({"error": str(e)}, status=500)
