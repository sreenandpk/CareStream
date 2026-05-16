from pathlib import Path
import os
import ssl
from dotenv import load_dotenv
from datetime import timedelta

# =====================
# BASE CONFIG (RELOAD TRIGGER: 18:31)
# =====================

BASE_DIR = Path(__file__).resolve().parent.parent
import os

LOG_DIR = os.path.join(BASE_DIR, "logs")
load_dotenv()

# =====================
# SECURITY
# =====================

SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-production-carestream-v6-2024-hush-hush")

if not SECRET_KEY:
    raise ValueError("SECRET_KEY not set in .env")

DEBUG = os.getenv("DEBUG", "True") == "True"

ALLOWED_HOSTS = ["*"]

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
# CORS & SECURITY
# =====================

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://carestream-v8.duckdns.org",
    "https://care-stream.vercel.app",
]
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://carestream-v8.duckdns.org",
    "https://care-stream.vercel.app",
]

CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

# =====================
# PRODUCTION COOKIE SYNC (Vercel <-> DuckDNS)
# =====================
SESSION_COOKIE_SAMESITE = 'None'
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SAMESITE = 'None'
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = False  # Allow frontend to read CSRF token if needed
SESSION_COOKIE_HTTPONLY = True

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

# Redis Cache configured below

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "accounts.User"
# 📧 PRIMARY BACKED (SendGrid): Used for Registrations (Identity Shield)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.sendgrid.net'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'apikey'
EMAIL_HOST_PASSWORD = os.getenv('SENDGRID_API_KEY')
DEFAULT_FROM_EMAIL = os.getenv('EMAIL_HOST_USER', 'sreenandpk3@gmail.com')
SERVER_EMAIL = DEFAULT_FROM_EMAIL

# 🛡️ SECONDARY BACKEND (Gmail): Used for Reliable OTPs (High Deliverability)
GMAIL_SMTP_HOST = 'smtp.gmail.com'
GMAIL_SMTP_PORT = 587
GMAIL_SMTP_USER = os.getenv('EMAIL_HOST_USER', 'sreenandpk3@gmail.com')
GMAIL_SMTP_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD') # Your App Password

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
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
        "websocket": {
            "level": "INFO",
            "class": "apps.core.logging_handlers.WebSocketLogHandler",
            "formatter": "verbose",
        },
    },
    "loggers": {
        "django": {
            "handlers": ["console", "websocket"],
            "level": "INFO",
            "propagate": True,
        },
        "django.request": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
        "security": {
            "handlers": ["console", "websocket"],
            "level": "WARNING",
            "propagate": False,
        },
        "audit": {
            "handlers": ["console", "websocket"],
            "level": "INFO",
            "propagate": False,
        },
        "app": {
            "handlers": ["console", "websocket"],
            "level": "INFO",
            "propagate": False,
        },
    },
}
RATELIMIT_ENABLE = True
RATELIMIT_FAIL_OPEN = True
RATELIMIT_USE_CACHE = "default"

# =====================
# REDIS / CACHE
# =====================
REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/1").strip('"\'')
IS_REDIS_SSL = REDIS_URL.startswith("rediss://")

# 🔥 UNIVERSAL SSL INJECTION: Force 'ssl_cert_reqs=none' for AWS ElastiCache compatibility
if IS_REDIS_SSL and "ssl_cert_reqs" not in REDIS_URL:
    separator = "&" if "?" in REDIS_URL else "?"
    REDIS_URL = f"{REDIS_URL}{separator}ssl_cert_reqs=none"

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "IGNORE_EXCEPTIONS": True,
            "REDIS_CLIENT_KWARGS": {
                "ssl_cert_reqs": 0
            } if IS_REDIS_SSL else {}
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
CELERY_BROKER_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_BACKEND = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0")

if IS_REDIS_SSL:
    CELERY_BROKER_USE_SSL = {
        'ssl_cert_reqs': 0
    }
    CELERY_REDIS_BACKEND_USE_SSL = {
        'ssl_cert_reqs': 0
    }


from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    "high-frequency-simulation-1s": {
        "task": "apps.simulation.tasks.run_simulation",
        "schedule": 1.0,
    },
    "drop-all-vitals-5m": {
        "task": "apps.vitals.tasks.drop_all_vitals_periodic",
        "schedule": 300.0, # Every 5 minutes
    },
    "summarize-warm-vitals-1h": {
        "task": "apps.vitals.tasks.summarize_warm_vitals",
        "schedule": 3600.0, # Every hour
    },
    "cleanup-cold-data-24h": {
        "task": "apps.vitals.tasks.cleanup_cold_data",
        "schedule": 86400.0, # Daily
    },
    "auto-resolve-stale-alerts-5m": {
        "task": "apps.alerts.tasks.auto_resolve_stale_alerts",
        "schedule": 300.0, # Every 5 minutes
    },
}

# 🔥 ADD THIS
ASGI_APPLICATION = "config.asgi.application"

# 🔥 CHANNEL LAYERS (UNIVERSAL COMPATIBILITY)
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [REDIS_URL],
            "symmetric_encryption_keys": [SECRET_KEY],
            "capacity": 1500,
            "expiry": 10,
        },
    },
}

# Force Reload
DATA_UPLOAD_MAX_NUMBER_FIELDS = 10000
