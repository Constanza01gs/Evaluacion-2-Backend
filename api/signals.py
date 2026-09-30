"""
Señales de la aplicación EdTech.

Este archivo crea automáticamente el Perfil de cada nuevo usuario.
El carro de matrícula se mantiene únicamente para los estudiantes,
ya que los Coordinadores Académicos y Administradores no utilizan carro.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User

from .models import Perfil, CarroMatricula


# ============================================================
# CREACIÓN AUTOMÁTICA DEL PERFIL
# ============================================================

@receiver(post_save, sender=User)
def crear_perfil_usuario(sender, instance, created, **kwargs):
    """
    Al crear un usuario se genera automáticamente su perfil.

    Los usuarios creados sin especificar otro rol comienzan como
    ESTUDIANTE, que corresponde al rol predeterminado del sistema.
    """

    if created:
        Perfil.objects.get_or_create(
            usuario=instance
        )


# ============================================================
# CARRO PERSISTENTE PARA ESTUDIANTES
# ============================================================

@receiver(post_save, sender=Perfil)
def gestionar_carro_segun_rol(sender, instance, **kwargs):
    """
    Mantiene un carro persistente únicamente para ESTUDIANTES.

    Si el perfil corresponde a un Coordinador Académico o a un
    Administrador, se elimina cualquier carro creado previamente
    durante la creación automática inicial del usuario.
    """

    if instance.rol == Perfil.ROL_ESTUDIANTE:

        # Los estudiantes deben disponer de un carro persistente.
        CarroMatricula.objects.get_or_create(
            usuario=instance.usuario
        )

    else:

        # ====================================================
        # EXTENSIÓN ADICIONAL - CONTROL DE ROLES
        # ====================================================
        # Coordinadores y Administradores no utilizan el carro
        # de matrícula destinado a los estudiantes.

        CarroMatricula.objects.filter(
            usuario=instance.usuario
        ).delete()