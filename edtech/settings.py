"""
Configuración principal del proyecto EdTech.

Este archivo configura Django, PostgreSQL, Django REST Framework,
autenticación JWT, filtros y documentación Swagger/OpenAPI.
"""

from pathlib import Path
from datetime import timedelta
import os


# ============================================================
# RUTAS DEL PROYECTO
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent


# ============================================================
# CONFIGURACIÓN GENERAL
# ============================================================

SECRET_KEY = 'django-insecure-edtech-evaluacion-backend'

DEBUG = True

ALLOWED_HOSTS = []


# ============================================================
# APLICACIONES INSTALADAS
# ============================================================

INSTALLED_APPS = [

    # Aplicaciones de Django.
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Django REST Framework.
    'rest_framework',

    # Filtros para los endpoints.
    'django_filters',

    # Swagger / OpenAPI.
    'drf_spectacular',

    # Aplicación principal.
    'api.apps.ApiConfig',
]


# ============================================================
# MIDDLEWARE
# ============================================================

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]


ROOT_URLCONF = 'edtech.urls'


# ============================================================
# TEMPLATES
# ============================================================

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',

        # Carpeta general de templates.
        'DIRS': [
            BASE_DIR / 'templates',
        ],

        'APP_DIRS': True,

        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]


WSGI_APPLICATION = 'edtech.wsgi.application'


# ============================================================
# BASE DE DATOS POSTGRESQL
# ============================================================

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',

        # Base de datos creada en PostgreSQL.
        'NAME': 'edtech_db',

        # Usuario administrador de PostgreSQL.
        'USER': 'postgres',

        # La contraseña se obtiene desde una variable de entorno
        # para evitar guardar credenciales en el código fuente.
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),

        'HOST': 'localhost',

        'PORT': '5432',
    }
}


# ============================================================
# VALIDACIÓN DE CONTRASEÑAS
# ============================================================

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME':
        'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME':
        'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME':
        'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME':
        'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# ============================================================
# INTERNACIONALIZACIÓN
# ============================================================

LANGUAGE_CODE = 'es'

TIME_ZONE = 'America/Santiago'

USE_I18N = True

USE_TZ = True


# ============================================================
# ARCHIVOS ESTÁTICOS
# ============================================================

STATIC_URL = 'static/'

STATICFILES_DIRS = [
    BASE_DIR / 'static',
]


# ============================================================
# CONFIGURACIÓN DE DJANGO REST FRAMEWORK
# ============================================================

REST_FRAMEWORK = {

    # JWT será el sistema de autenticación principal de la API.
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),

    # Integración global de django-filter.
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
    ),

    # Generador del esquema OpenAPI.
    'DEFAULT_SCHEMA_CLASS':
        'drf_spectacular.openapi.AutoSchema',
}


# ============================================================
# CONFIGURACIÓN JWT
# ============================================================

SIMPLE_JWT = {

    # Duración del token de acceso.
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),

    # Duración del token de renovación.
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),

    'AUTH_HEADER_TYPES': ('Bearer',),
}


# ============================================================
# SWAGGER / OPENAPI
# ============================================================

SPECTACULAR_SETTINGS = {
    'TITLE': 'API Plataforma EdTech',

    'DESCRIPTION': (
        'API para la gestión de cursos, carros de matrícula '
        'y matrículas de la plataforma EdTech.'
    ),

    'VERSION': '1.0.0',
}


# ============================================================
# CONFIGURACIÓN GENERAL
# ============================================================

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'