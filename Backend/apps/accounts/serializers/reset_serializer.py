from rest_framework import serializers
class ConfirmResetSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField()