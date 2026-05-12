from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os

class Command(BaseCommand):
    help = 'Initialize an admin user if it does not exist'

    def handle(self, *args, **options):
        User = get_user_model()
        
        username = os.getenv('ADMIN_USERNAME', 'admin')
        password = os.getenv('ADMIN_PASSWORD', 'admin123')
        email = os.getenv('ADMIN_EMAIL', 'admin@carestream.com')

        user = User.objects.filter(username=username).first()
        if not user:
            self.stdout.write(f'Creating admin user: {username}')
            user = User.objects.create_superuser(
                username=username,
                email=email,
                password=password,
                role='ADMIN',
                email_status='valid'
            )
            self.stdout.write(self.style.SUCCESS(f'Successfully created admin user: {username}'))
        else:
            # Ensure existing admin has valid status
            if user.email_status != 'valid':
                user.email_status = 'valid'
                user.save()
            self.stdout.write(f'Admin user {username} already exists')
