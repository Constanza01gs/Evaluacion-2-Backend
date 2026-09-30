"""
Serializadores de la plataforma EdTech.

Transforman los modelos de Django a datos JSON y viceversa.
También controlan qué campos pueden ser modificados mediante la API.
"""

from rest_framework import serializers
from django.contrib.auth.models import User

from .models import (
    Perfil,
    Area,
    Curso,
    CarroMatricula,
    ItemCarro,
    Matricula,
    DetalleMatricula,
    Pago,
)


# ============================================================
# ÁREAS DE CONOCIMIENTO
# ============================================================

class AreaSerializer(serializers.ModelSerializer):
    """
    Serializa las áreas utilizadas para clasificar los cursos.
    """

    class Meta:
        model = Area

        fields = [
            'id',
            'nombre',
            'descripcion',
            'activo',
        ]

        # El estado activo será controlado por la eliminación lógica.
        read_only_fields = [
            'activo',
        ]


# ============================================================
# CURSOS / BOOTCAMPS
# ============================================================

class CursoSerializer(serializers.ModelSerializer):
    """
    Serializa los cursos y muestra además el nombre de su área.

    Valida las fechas y evita que los cupos disponibles superen
    la capacidad máxima definida para la cohorte.
    """

    area_nombre = serializers.CharField(
        source='area.nombre',
        read_only=True
    )

    class Meta:
        model = Curso

        fields = [
            'id',
            'area',
            'area_nombre',
            'titulo',
            'descripcion',
            'costo',
            'fecha_inicio',
            'fecha_termino',
            'cupo_maximo',
            'cupos_disponibles',
            'activo',
        ]

        read_only_fields = [
            'activo',
        ]

    def validate(self, data):
        """
        Comprueba que las fechas sean correctas y que la
        disponibilidad no supere el límite máximo del curso.
        """

        fecha_inicio = data.get(
            'fecha_inicio',
            getattr(
                self.instance,
                'fecha_inicio',
                None
            )
        )

        fecha_termino = data.get(
            'fecha_termino',
            getattr(
                self.instance,
                'fecha_termino',
                None
            )
        )

        cupo_maximo = data.get(
            'cupo_maximo',
            getattr(
                self.instance,
                'cupo_maximo',
                None
            )
        )

        cupos_disponibles = data.get(
            'cupos_disponibles',
            getattr(
                self.instance,
                'cupos_disponibles',
                None
            )
        )

        # Validación de fechas.
        if (
            fecha_inicio
            and fecha_termino
            and fecha_termino < fecha_inicio
        ):
            raise serializers.ValidationError(
                'La fecha de término no puede ser anterior '
                'a la fecha de inicio.'
            )

        # El límite máximo debe permitir al menos una matrícula.
        if (
            cupo_maximo is not None
            and cupo_maximo < 1
        ):
            raise serializers.ValidationError({
                'cupo_maximo':
                    'El cupo máximo debe ser al menos 1.'
            })

        # La disponibilidad nunca puede superar la capacidad.
        if (
            cupo_maximo is not None
            and cupos_disponibles is not None
            and cupos_disponibles > cupo_maximo
        ):
            raise serializers.ValidationError({
                'cupos_disponibles':
                    'Los cupos disponibles no pueden superar '
                    'el cupo máximo del curso.'
            })

        return data


# ============================================================
# ÍTEMS DEL CARRO
# ============================================================

class ItemCarroSerializer(serializers.ModelSerializer):
    """
    Representa un curso agregado al carro del estudiante.

    El carro se determina automáticamente a partir del usuario
    autenticado, por lo que no se recibe desde el cliente.
    """

    curso_titulo = serializers.CharField(
        source='curso.titulo',
        read_only=True
    )

    costo = serializers.DecimalField(
        source='curso.costo',
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = ItemCarro

        fields = [
            'id',
            'curso',
            'curso_titulo',
            'costo',
            'fecha_agregado',
        ]

        read_only_fields = [
            'fecha_agregado',
        ]


# ============================================================
# CARRO DE MATRÍCULA
# ============================================================

class CarroMatriculaSerializer(serializers.ModelSerializer):
    """
    Muestra el carro persistente junto con sus cursos activos.
    """

    items = serializers.SerializerMethodField()

    total = serializers.SerializerMethodField()

    class Meta:
        model = CarroMatricula

        fields = [
            'id',
            'items',
            'total',
            'fecha_creacion',
        ]

        read_only_fields = fields

    def get_items(self, obj):
        """
        Devuelve solamente los ítems activos del carro.
        """

        items = obj.items.filter(
            activo=True,
            curso__activo=True
        )

        return ItemCarroSerializer(
            items,
            many=True
        ).data

    def get_total(self, obj):
        """
        Calcula el valor actual de los cursos contenidos
        en el carro.
        """

        return sum(
            item.curso.costo
            for item in obj.items.filter(
                activo=True,
                curso__activo=True
            )
        )


# ============================================================
# DETALLE DE MATRÍCULA
# ============================================================

class DetalleMatriculaSerializer(serializers.ModelSerializer):
    """
    Muestra los cursos que pertenecen a una matrícula histórica.
    """

    curso_titulo = serializers.CharField(
        source='curso.titulo',
        read_only=True
    )

    class Meta:
        model = DetalleMatricula

        fields = [
            'id',
            'curso',
            'curso_titulo',
            'precio',
        ]

        read_only_fields = fields


# ============================================================
# MATRÍCULA
# ============================================================

class MatriculaSerializer(serializers.ModelSerializer):
    """
    Serializa la transacción histórica del estudiante junto
    con los cursos incluidos en ella.
    """

    detalles = DetalleMatriculaSerializer(
        many=True,
        read_only=True
    )

    estudiante = serializers.SerializerMethodField()

    estado_nombre = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )

    class Meta:
        model = Matricula

        fields = [
            'id',
            'estudiante',
            'estado',
            'estado_nombre',
            'fecha_creacion',
            'total',
            'detalles',
        ]

        # Los cambios de estado serán realizados mediante
        # endpoints específicos protegidos según el rol.
        read_only_fields = fields

    def get_estudiante(self, obj):
        """
        Devuelve el nombre completo del estudiante.

        Si el usuario no posee nombre y apellido registrados,
        se utiliza su username como respaldo.
        """

        nombre_completo = (
            obj.usuario.get_full_name().strip()
        )

        return (
            nombre_completo
            or obj.usuario.username
        )


# ============================================================
# REGISTRO DE ESTUDIANTES
# ============================================================

class RegistroEstudianteSerializer(serializers.ModelSerializer):
    """
    Permite registrar nuevos estudiantes.

    La contraseña se almacena de forma segura mediante
    create_user(). El perfil y el carro son generados
    automáticamente mediante las señales de la aplicación.
    """

    password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    password_confirmacion = serializers.CharField(
        write_only=True
    )

    class Meta:
        model = User

        fields = [
            'username',
            'first_name',
            'last_name',
            'email',
            'password',
            'password_confirmacion',
        ]

    def validate(self, data):
        """
        Comprueba que ambas contraseñas coincidan.
        """

        if (
            data['password']
            != data['password_confirmacion']
        ):
            raise serializers.ValidationError(
                {
                    'password_confirmacion':
                    'Las contraseñas no coinciden.'
                }
            )

        return data

    def create(self, validated_data):
        """
        Crea el usuario utilizando create_user()
        para almacenar correctamente la contraseña.
        """

        validated_data.pop(
            'password_confirmacion'
        )

        password = validated_data.pop(
            'password'
        )

        usuario = User.objects.create_user(
            password=password,
            **validated_data
        )

        return usuario


# ============================================================
# EXTENSIÓN ADICIONAL - PAGO SIMULADO
# ============================================================
class PagoSerializer(serializers.ModelSerializer):
    """
    Representa el pago simulado asociado a una matrícula.

    Permite consultar el método de pago utilizado y el estado
    de revisión del pago realizado por el estudiante.
    """

    estado_nombre = serializers.CharField(
        source='get_estado_display',
        read_only=True
    )

    metodo_pago_nombre = serializers.CharField(
        source='get_metodo_pago_display',
        read_only=True
    )

    class Meta:
        model = Pago

        fields = [
            'id',
            'estado',
            'estado_nombre',
            'metodo_pago',
            'metodo_pago_nombre',
            'fecha_pago',
            'fecha_revision',
        ]

        read_only_fields = fields


# ============================================================
# EXTENSIÓN ADICIONAL - INFORMACIÓN DE PAGO EN MATRÍCULA
# ============================================================

class MatriculaConPagoSerializer(MatriculaSerializer):
    """
    Amplía la información de una matrícula incorporando
    el estado de su pago simulado.

    Se utiliza en las interfaces donde es necesario conocer
    si el estudiante ya informó un pago.
    """

    pago = PagoSerializer(
        read_only=True
    )

    class Meta(MatriculaSerializer.Meta):

        fields = MatriculaSerializer.Meta.fields + [
            'pago',
        ]

        read_only_fields = fields


# ============================================================
# EXTENSIÓN ADICIONAL - GESTIÓN DE COORDINADORES
# ============================================================

class CoordinadorSerializer(serializers.ModelSerializer):
    """
    Permite al Administrador crear y consultar Coordinadores
    Académicos.

    El rol no se recibe desde el cliente: se asigna
    automáticamente como COORDINADOR.
    """

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        required=True
    )

    rol = serializers.CharField(
        source='perfil.rol',
        read_only=True
    )

    class Meta:
        model = User

        fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'password',
            'rol',
            'is_active',
        ]

        read_only_fields = [
            'id',
            'rol',
            'is_active',
        ]

    def create(self, validated_data):
        """
        Crea un usuario y asigna explícitamente el rol
        COORDINADOR a su perfil.
        """

        password = validated_data.pop(
            'password'
        )

        usuario = User.objects.create_user(
            password=password,
            **validated_data
        )

        perfil = usuario.perfil

        perfil.rol = Perfil.ROL_COORDINADOR

        perfil.save()

        return usuario