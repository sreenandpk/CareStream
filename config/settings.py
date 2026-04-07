from pathlib import Path
import os
from dotenv import load_dotenv
from datetime import timedelta

# =====================
# BASE CONFIG
# =====================

BASE_DIR = Path(__file__).resolve().parent.parent
import os

LOG_DIR = os.path.join(BASE_DIR, "logs")
load_dotenv()

# =====================
# SECURITY
# =====================

SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    raise ValueError("SECRET_KEY not set in .env")

DEBUG = os.getenv("DEBUG", "True") == "True"

ALLOWED_HOSTS = ["localhost", "127.0.0.1"]

# =====================
# APPLICATIONS
# =====================

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third party
    "corsheaders",
    "rest_framework",
    "rest_framework.authtoken",
    "rest_framework_simplejwt.token_blacklist",
    "django_ratelimit",
    "drf_spectacular",
    "channels",
    # Local apps
    "apps.wards",
    "apps.rooms",
    "apps.beds",
    "apps.patients",
    "apps.vitals",
    "apps.alerts",
    "apps.devices",
    "apps.accounts",
    "apps.core",
    "apps.simulation",
]

# =====================
# MIDDLEWARE
# =====================

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "django_ratelimit.middleware.RatelimitMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
]
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
# =====================
# CORS
# =====================

CORS_ALLOW_ALL_ORIGINS = True

# =====================
# URLS
# =====================

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],  # ← add this
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# =====================
# DATABASE (POSTGRESQL)
# =====================

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME"),
        "USER": os.getenv("DB_USER"),
        "PASSWORD": os.getenv("DB_PASSWORD"),
        "HOST": os.getenv("DB_HOST"),
        "PORT": os.getenv("DB_PORT"),
    }
}

# =====================
# PASSWORD VALIDATION
# =====================

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# =====================
# DJANGO REST FRAMEWORK
# =====================

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
     "EXCEPTION_HANDLER": "apps.core.exceptions.custom_exception_handler",
     "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",

}

# =====================
# JWT CONFIG
# =====================

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# =====================
# INTERNATIONALIZATION
# =====================

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"

USE_I18N = True

USE_TZ = True

# =====================
# STATIC FILES
# =====================

STATIC_URL = "/static/"

STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# =====================
# DEFAULT PK
# =====================

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "accounts.User"
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"

EMAIL_HOST = "smtp.gmail.com"

EMAIL_PORT = 587

EMAIL_USE_TLS = True

EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")

EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,

    "formatters": {
        "verbose": {
            "format": "[{asctime}] {levelname} {name} {message}",
            "style": "{",
        },
    },

    "handlers": {

        "app_file": {
            "level": "INFO",
            "class": "logging.FileHandler",
            "filename": os.path.join(LOG_DIR, "app.log"),
            "formatter": "verbose",
        },

        "error_file": {
            "level": "ERROR",
            "class": "logging.FileHandler",
            "filename": os.path.join(LOG_DIR, "error.log"),
            "formatter": "verbose",
        },

        "security_file": {
            "level": "WARNING",
            "class": "logging.FileHandler",
            "filename": os.path.join(LOG_DIR, "security.log"),
            "formatter": "verbose",
        },

        "audit_file": {
            "level": "INFO",
            "class": "logging.FileHandler",
            "filename": os.path.join(LOG_DIR, "audit.log"),
            "formatter": "verbose",
        },

        "console": {
            "class": "logging.StreamHandler",
        },
    },

    "loggers": {

        "django": {
            "handlers": ["console", "app_file"],
            "level": "INFO",
            "propagate": True,
        },

        "django.request": {
            "handlers": ["error_file"],
            "level": "ERROR",
            "propagate": False,
        },

        "security": {
            "handlers": ["security_file"],
            "level": "WARNING",
            "propagate": False,
        },

        "audit": {
            "handlers": ["audit_file"],
            "level": "INFO",
            "propagate": False,
        },

        "app": {
            "handlers": ["app_file"],
            "level": "INFO",
            "propagate": False,
        },
    },
}
RATELIMIT_ENABLE = True

RATELIMIT_USE_CACHE = "default"
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/1",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        }
    }
}
SPECTACULAR_SETTINGS = {
    "TITLE": "CareStream API",
    "DESCRIPTION": "CareStream Backend API",
    "VERSION": "1.0.0",

    "SERVE_INCLUDE_SCHEMA": False,

    "SWAGGER_UI_SETTINGS": {
        "layout": "BaseLayout",
        "docExpansion": "none",
        "filter": True,
        "defaultModelsExpandDepth": -1,
    },

    "SECURITY": [
        {"BearerAuth": []},
    ],

    "SECURITY_SCHEMES": {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    },
}
CELERY_BROKER_URL = "redis://127.0.0.1:6379/0"
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_BACKEND = "redis://127.0.0.1:6379/0"


from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    "run-simulation-every-5-seconds": {
        "task": "apps.simulation.tasks.run_simulation",
        "schedule": 5.0,
    },
}
# 🔥 ADD THIS
ASGI_APPLICATION = "config.asgi.application"

# 🔥 CHANNEL LAYERS (USE REDIS)
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("127.0.0.1", 6379)],
        },
    },
}
