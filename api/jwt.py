"""
Configuración personalizada de JWT.

Agrega el rol, username y nombre completo del usuario
dentro de los claims de los tokens y devuelve información
básica del usuario durante el inicio de sesión.
"""

from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer
)

from rest_framework_simplejwt.views import (
    TokenObtainPairView
)


# ============================================================
# SERIALIZADOR JWT PERSONALIZADO
# ============================================================

class CustomTokenObtainPairSerializer(
    TokenObtainPairSerializer
):
    """
    Personaliza el token JWT agregando username,
    nombre completo y rol como claims.
    """

    @classmethod
    def get_token(cls, user):

        token = super().get_token(user)

        # Claims personalizados.
        token['username'] = user.username

        token['nombre_completo'] = (
            user.get_full_name().strip()
            or user.username
        )

        if hasattr(user, 'perfil'):
            token['rol'] = user.perfil.rol
        else:
            token['rol'] = None

        return token

    def validate(self, attrs):
        """
        Además de access y refresh, devuelve información
        útil para el frontend después del login.
        """

        data = super().validate(attrs)

        data['username'] = self.user.username

        data['nombre_completo'] = (
            self.user.get_full_name().strip()
            or self.user.username
        )

        if hasattr(self.user, 'perfil'):
            data['rol'] = self.user.perfil.rol
        else:
            data['rol'] = None

        return data


# ============================================================
# VISTA DE LOGIN JWT
# ============================================================

class CustomTokenObtainPairView(
    TokenObtainPairView
):
    """
    Endpoint encargado de generar los tokens JWT
    personalizados al iniciar sesión.
    """

    serializer_class = CustomTokenObtainPairSerializer