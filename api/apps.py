"""
Configuración de la aplicación principal EdTech.

Aquí se cargan las señales cuando Django inicia la aplicación.
"""

from django.apps import AppConfig


class ApiConfig(AppConfig):

    default_auto_field = 'django.db.models.BigAutoField'

    name = 'api'

    def ready(self):
        """
        Importa las señales para que Django pueda ejecutarlas
        cuando se creen nuevos usuarios.
        """

        import api.signals