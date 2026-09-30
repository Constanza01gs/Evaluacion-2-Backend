"""
Rutas de la API de la plataforma EdTech.

Aquí se conectan los endpoints públicos y protegidos
con sus respectivas vistas.
"""

from django.urls import path

from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

from .jwt import CustomTokenObtainPairView

from .views import (
    AreaListView,
    CursoListView,

    GestionAreaView,
    GestionAreaDetalleView,

    GestionCursoView,
    GestionCursoDetalleView,

    CarroMatriculaView,
    ItemCarroDeleteView,

    ConfirmarMatriculaView,
    MisMatriculasView,

    DetallePagoMatriculaView,
    RealizarPagoSimuladoView,
    RechazarPagoMatriculaView,

    GestionMatriculasView,
    CambiarEstadoMatriculaView,

    GestionCoordinadoresView,
    GestionCoordinadorDetalleView,
    DashboardAdminView,

    RegistroEstudianteView
)


urlpatterns = [

    # ========================================================
    # JWT
    # ========================================================

    path(
        'token/',
        CustomTokenObtainPairView.as_view(),
        name='token_obtain_pair'
    ),

    path(
        'token/refresh/',
        TokenRefreshView.as_view(),
        name='token_refresh'
    ),


    # ========================================================
    # REGISTRO
    # ========================================================

    path(
        'registro/',
        RegistroEstudianteView.as_view(),
        name='registro_estudiante'
    ),


    # ========================================================
    # CATÁLOGO PÚBLICO
    # ========================================================

    path(
        'areas/',
        AreaListView.as_view(),
        name='areas'
    ),

    path(
        'cursos/',
        CursoListView.as_view(),
        name='cursos'
    ),


    # ========================================================
    # GESTIÓN DE ÁREAS - COORDINADOR
    # ========================================================

    path(
        'areas/gestionar/',
        GestionAreaView.as_view(),
        name='crear_area'
    ),

    path(
        'areas/<int:pk>/',
        GestionAreaDetalleView.as_view(),
        name='gestionar_area'
    ),


    # ========================================================
    # GESTIÓN DE CURSOS - COORDINADOR
    # ========================================================

    path(
        'cursos/gestionar/',
        GestionCursoView.as_view(),
        name='crear_curso'
    ),

    path(
        'cursos/<int:pk>/',
        GestionCursoDetalleView.as_view(),
        name='gestionar_curso'
    ),


    # ========================================================
    # CARRO - ESTUDIANTE
    # ========================================================

    path(
        'carro-matricula/',
        CarroMatriculaView.as_view(),
        name='carro_matricula'
    ),

    path(
        'carro-matricula/<int:pk>/',
        ItemCarroDeleteView.as_view(),
        name='eliminar_item_carro'
    ),


    # ========================================================
    # MATRÍCULAS - ESTUDIANTE
    # ========================================================

    path(
        'matriculas/confirmar/',
        ConfirmarMatriculaView.as_view(),
        name='confirmar_matricula'
    ),

    path(
        'mis-matriculas/',
        MisMatriculasView.as_view(),
        name='mis_matriculas'
    ),

    # ========================================================
    # EXTENSIÓN ADICIONAL - PAGO SIMULADO
    # ========================================================

    path(
        'pagos/matricula/<int:pk>/',
        DetallePagoMatriculaView.as_view(),
        name='detalle_pago_matricula'
    ),

    path(
        'pagos/matricula/<int:pk>/realizar/',
        RealizarPagoSimuladoView.as_view(),
        name='realizar_pago_simulado'
    ),

    path(
        'pagos/matricula/<int:pk>/rechazar/',
        RechazarPagoMatriculaView.as_view(),
        name='rechazar-pago-matricula'
    ),


    # ========================================================
    # MATRÍCULAS - COORDINADOR
    # ========================================================

    path(
        'matriculas/',
        GestionMatriculasView.as_view(),
        name='gestionar_matriculas'
    ),

    path(
        'matriculas/<int:pk>/estado/',
        CambiarEstadoMatriculaView.as_view(),
        name='cambiar_estado_matricula'
    ),


    # ========================================================
    # EXTENSIÓN ADICIONAL - ADMINISTRADOR
    # ========================================================

    path(
        'admin/dashboard/',
        DashboardAdminView.as_view(),
        name='dashboard_admin'
    ),

    path(
        'admin/coordinadores/',
        GestionCoordinadoresView.as_view(),
        name='gestionar_coordinadores'
    ),

    path(
        'admin/coordinadores/<int:pk>/',
        GestionCoordinadorDetalleView.as_view(),
        name='gestionar_coordinador'
    ),
]