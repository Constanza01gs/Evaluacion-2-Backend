"""
Modelos principales de la plataforma EdTech.

Este archivo define las entidades necesarias para gestionar áreas,
cursos, perfiles de usuario, carro de matrícula, matrículas y pagos.

El modelo mantiene las entidades separadas para evitar duplicidad
de información y conservar una estructura normalizada en 3FN.
"""

from django.db import models
from django.contrib.auth.models import User


# ============================================================
# PERFIL DE USUARIO
# ============================================================

class Perfil(models.Model):
    """
    Extiende al usuario de Django para almacenar el rol utilizado
    posteriormente en los permisos y claims del JWT.

    Estudiante y Coordinador corresponden a los roles principales
    del proceso académico. Administrador permite gestionar
    internamente la plataforma.
    """

    ROL_ESTUDIANTE = 'ESTUDIANTE'
    ROL_COORDINADOR = 'COORDINADOR'

    # Extensión adicional del proyecto:
    # Se incorpora el rol ADMIN para gestionar coordinadores y
    # proporcionar acceso administrativo a funciones complementarias.
    # Los roles Estudiante y Coordinador solicitados se mantienen.
    ROL_ADMIN = 'ADMIN'

    ROL_CHOICES = [
        (
            ROL_ESTUDIANTE,
            'Estudiante'
        ),
        (
            ROL_COORDINADOR,
            'Coordinador Académico'
        ),
        (
            ROL_ADMIN,
            'Administrador'
        ),
    ]

    usuario = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='perfil'
    )

    rol = models.CharField(
        max_length=20,
        choices=ROL_CHOICES,
        default=ROL_ESTUDIANTE
    )

    def __str__(self):
        return (
            f'{self.usuario.username} - '
            f'{self.get_rol_display()}'
        )


# ============================================================
# ÁREA DE CONOCIMIENTO
# ============================================================

class Area(models.Model):
    """
    Representa las áreas de conocimiento utilizadas para clasificar
    los cursos y bootcamps disponibles.
    """

    nombre = models.CharField(
        max_length=100,
        unique=True
    )

    descripcion = models.TextField(
        blank=True
    )

    # Eliminación lógica.
    activo = models.BooleanField(
        default=True
    )

    def __str__(self):
        return self.nombre


# ============================================================
# CURSO / BOOTCAMP
# ============================================================

class Curso(models.Model):
    """
    Representa un curso o bootcamp disponible para matrícula.

    Cada curso pertenece a un área de conocimiento y mantiene
    su información de precio, fechas, capacidad máxima de la
    cohorte y cantidad de cupos actualmente disponibles.
    """

    area = models.ForeignKey(
        Area,
        on_delete=models.PROTECT,
        related_name='cursos'
    )

    titulo = models.CharField(
        max_length=150
    )

    descripcion = models.TextField()

    costo = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    fecha_inicio = models.DateField()

    fecha_termino = models.DateField()

    # Capacidad máxima definida para la cohorte.
    cupo_maximo = models.PositiveIntegerField()

    # Cupos que todavía pueden ser utilizados.
    cupos_disponibles = models.PositiveIntegerField()

    # Eliminación lógica.
    activo = models.BooleanField(
        default=True
    )

    def __str__(self):
        return self.titulo


# ============================================================
# CARRO DE MATRÍCULA
# ============================================================

class CarroMatricula(models.Model):
    """
    Carro persistente asociado a un usuario.

    La relación OneToOne garantiza que cada estudiante tenga
    un único carro de matrícula almacenado en PostgreSQL.
    """

    usuario = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='carro_matricula'
    )

    activo = models.BooleanField(
        default=True
    )

    fecha_creacion = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return (
            f'Carro de '
            f'{self.usuario.username}'
        )


# ============================================================
# ÍTEMS DEL CARRO
# ============================================================

class ItemCarro(models.Model):
    """
    Relaciona los cursos seleccionados con el carro del estudiante.

    La restricción de unicidad evita agregar dos veces el mismo
    curso dentro del mismo carro.
    """

    carro = models.ForeignKey(
        CarroMatricula,
        on_delete=models.CASCADE,
        related_name='items'
    )

    curso = models.ForeignKey(
        Curso,
        on_delete=models.PROTECT,
        related_name='items_carro'
    )

    fecha_agregado = models.DateTimeField(
        auto_now_add=True
    )

    # Permite realizar eliminación lógica del ítem.
    activo = models.BooleanField(
        default=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=[
                    'carro',
                    'curso'
                ],
                name='curso_unico_por_carro'
            )
        ]

    def __str__(self):
        return (
            f'{self.carro.usuario.username} - '
            f'{self.curso.titulo}'
        )


# ============================================================
# MATRÍCULA / TRANSACCIÓN
# ============================================================

class Matricula(models.Model):
    """
    Representa una transacción histórica generada desde el carro.

    Utiliza CHOICES para controlar los estados de la matrícula.
    Los cupos se descuentan únicamente cuando la matrícula
    cambia correctamente al estado PAGADO y se reponen
    automáticamente si posteriormente es CANCELADA.
    """

    ESTADO_PENDIENTE = 'PENDIENTE'
    ESTADO_PAGADO = 'PAGADO'
    ESTADO_COMPLETADO = 'COMPLETADO'
    ESTADO_CANCELADO = 'CANCELADO'

    ESTADO_CHOICES = [
        (
            ESTADO_PENDIENTE,
            'Pendiente'
        ),
        (
            ESTADO_PAGADO,
            'Pagado'
        ),
        (
            ESTADO_COMPLETADO,
            'Completado'
        ),
        (
            ESTADO_CANCELADO,
            'Cancelado'
        ),
    ]

    usuario = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='matriculas'
    )

    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default=ESTADO_PENDIENTE
    )

    fecha_creacion = models.DateTimeField(
        auto_now_add=True
    )

    total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    def __str__(self):
        return (
            f'Matrícula {self.id} - '
            f'{self.usuario.username}'
        )


# ============================================================
# DETALLE DE MATRÍCULA
# ============================================================

class DetalleMatricula(models.Model):
    """
    Guarda los cursos asociados a una matrícula histórica.

    El precio se almacena en el detalle para conservar el valor
    que tenía el curso cuando se realizó la transacción.
    """

    matricula = models.ForeignKey(
        Matricula,
        on_delete=models.CASCADE,
        related_name='detalles'
    )

    curso = models.ForeignKey(
        Curso,
        on_delete=models.PROTECT,
        related_name='detalles_matricula'
    )

    precio = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=[
                    'matricula',
                    'curso'
                ],
                name='curso_unico_por_matricula'
            )
        ]

    def __str__(self):
        return (
            f'{self.matricula.id} - '
            f'{self.curso.titulo}'
        )


# ============================================================
# PAGO DE MATRÍCULA - EXTENSIÓN ADICIONAL
# ============================================================

class Pago(models.Model):
    """
    Extensión adicional para representar un flujo de pago simulado.

    Permite que el estudiante realice un pago simulado de una
    matrícula y que posteriormente el Coordinador Académico
    pueda aprobarlo o rechazarlo.

    El método de pago solamente representa una simulación y
    no almacena información bancaria real.
    """

    # ========================================================
    # ESTADOS DEL PAGO
    # ========================================================

    ESTADO_PENDIENTE = 'PENDIENTE'
    ESTADO_APROBADO = 'APROBADO'
    ESTADO_RECHAZADO = 'RECHAZADO'

    ESTADO_CHOICES = [
        (
            ESTADO_PENDIENTE,
            'Pendiente de validación'
        ),
        (
            ESTADO_APROBADO,
            'Aprobado'
        ),
        (
            ESTADO_RECHAZADO,
            'Rechazado'
        ),
    ]


    # ========================================================
    # MÉTODOS DE PAGO SIMULADOS
    # ========================================================

    METODO_DEBITO = 'DEBITO'
    METODO_CREDITO = 'CREDITO'

    METODO_CHOICES = [
        (
            METODO_DEBITO,
            'Débito'
        ),
        (
            METODO_CREDITO,
            'Crédito'
        ),
    ]


    # ========================================================
    # CAMPOS
    # ========================================================

    matricula = models.OneToOneField(
        Matricula,
        on_delete=models.CASCADE,
        related_name='pago'
    )

    metodo_pago = models.CharField(
        max_length=20,
        choices=METODO_CHOICES
    )

    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default=ESTADO_PENDIENTE
    )

    fecha_pago = models.DateTimeField(
        auto_now_add=True
    )

    fecha_revision = models.DateTimeField(
        null=True,
        blank=True
    )


    def __str__(self):
        return (
            f'Pago matrícula {self.matricula.id} - '
            f'{self.get_estado_display()}'
        )