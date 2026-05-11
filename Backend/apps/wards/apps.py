from django.apps import AppConfig

class WardsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.wards"

    def ready(self):
        import apps.wards.signals