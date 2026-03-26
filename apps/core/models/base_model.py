from django.db import models
from django.conf import settings
from django.utils import timezone
class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(
            is_deleted=False
        )
class SoftDeleteModel(models.Model):
    is_deleted = models.BooleanField(
        default=False
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True
    )
    objects = SoftDeleteManager()
    all_objects = models.Manager()
    class Meta:
        abstract = True
    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()
    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save()
class AuditModel(models.Model):
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_%(class)s_set"
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_%(class)s_set"
    )
    class Meta:
        abstract = True
class BaseModel(SoftDeleteModel, AuditModel):
    class Meta:
        abstract = True