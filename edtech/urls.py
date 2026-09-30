"""
Rutas principales del proyecto EdTech.

Conecta la API REST, la autenticación JWT y la documentación
OpenAPI/Swagger del sistema.
"""

from django.urls import path, include, re_path
from api import views

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)


urlpatterns = [
    path(
        '',
        views.home,
        name='home'
    ),

    # ========================================================
    # API
    # ========================================================

    path(
        'api/',
        include('api.urls')
    ),


    # ========================================================
    # OPENAPI / SWAGGER
    # ========================================================

    path(
        'api/schema/',
        SpectacularAPIView.as_view(),
        name='schema'
    ),

    path(
        'api/docs/',
        SpectacularSwaggerView.as_view(
            url_name='schema'
        ),
        name='swagger-ui'
    ),


    path(
        'registro/',
        views.registro_page,
        name='registro_page'
    ),


    path(
        'login/',
        views.login_page,
        name='login_page'
    ),


    path(
        'cursos/',
        views.cursos_page,
        name='cursos_page'
    ),


    path(
        "areas/",
        views.areas_page,
        name="areas_page"
    ),


    path(
        'coordinador/',
        views.coordinador_page,
        name='coordinador_page'
    ),

    # ========================================================
    # EXTENSIÓN ADICIONAL - PANEL ADMINISTRADOR
    # ========================================================

    path(
        'admin-plataforma/',
        views.admin_plataforma_page,
        name='admin_plataforma_page'
    ),

    path(
        "carro/",
        views.carro_page,
        name="carro"
    ),

    # ========================================================
    # EXTENSIÓN ADICIONAL - PORTAL DE PAGO SIMULADO
    # ========================================================

    path(
        'pago/<int:pk>/',
        views.pago_page,
        name='pago_page'
    ),

    path(
        "mis-matriculas/",
        views.mis_matriculas_page,
        name="mis_matriculas"
    ),


    # ============================================================
    # ERROR 404 CONTROLADO
    # ============================================================

    re_path(
        r'^.*$',
        views.error_404,
        name='error_404'
    ),
    
]
