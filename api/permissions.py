"""
Permisos personalizados de la plataforma EdTech.

Este archivo controla el acceso a los endpoints según los roles
de negocio definidos en el perfil del usuario.
"""

from rest_framework.permissions import BasePermission

from .models import Perfil


# ============================================================
# PERMISO PARA ESTUDIANTES
# ============================================================

class EsEstudiante(BasePermission):
    """
    Permite el acceso únicamente a usuarios autenticados
    cuyo perfil tenga el rol ESTUDIANTE.
    """

    message = (
        'Esta acción está disponible solo para estudiantes.'
    )

    def has_permission(self, request, view):

        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, 'perfil')
            and request.user.perfil.rol == Perfil.ROL_ESTUDIANTE
        )


# ============================================================
# PERMISO PARA COORDINADORES
# ============================================================

class EsCoordinador(BasePermission):
    """
    Permite el acceso únicamente a usuarios autenticados
    cuyo perfil tenga el rol COORDINADOR.
    """

    message = (
        'Esta acción está disponible solo para '
        'coordinadores académicos.'
    )

    def has_permission(self, request, view):

        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, 'perfil')
            and request.user.perfil.rol == Perfil.ROL_COORDINADOR
        )


# ============================================================
# EXTENSIÓN ADICIONAL - PERMISO PARA ADMINISTRADORES
# ============================================================

class EsAdmin(BasePermission):
    """
    Extensión adicional para permitir el acceso únicamente
    al Administrador de la plataforma.

    Este rol complementa los roles académicos solicitados
    de Estudiante y Coordinador Académico.
    """

    message = (
        'Esta acción está disponible solo para administradores.'
    )

    def has_permission(self, request, view):

        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, 'perfil')
            and request.user.perfil.rol == Perfil.ROL_ADMIN
        )