"""
============================================================
CARGA DE DATOS DE PRUEBA - EDTECH
============================================================

Este archivo agrega datos de prueba a la plataforma sin eliminar
los registros existentes.

Carga:
1. Áreas académicas.
2. Cursos.
3. Estudiantes.
4. Matrículas históricas.
5. Detalles de matrícula.
6. Pagos simulados coherentes con cada matrícula.

No crea Coordinadores Académicos, ya que estos se gestionan
manualmente desde el panel del Administrador.
============================================================
"""

import os
import django
from decimal import Decimal
from datetime import date


# ============================================================
# CONFIGURAR DJANGO
# ============================================================

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "edtech.settings"
)

django.setup()


# ============================================================
# IMPORTACIONES
# ============================================================

from django.contrib.auth.models import User

from api.models import (
    Perfil,
    Area,
    Curso,
    CarroMatricula,
    Matricula,
    DetalleMatricula,
    Pago,
)


# ============================================================
# ÁREAS
# ============================================================

areas_datos = [
    (
        "Tecnología",
        "Cursos relacionados con desarrollo de software y tecnologías digitales."
    ),
    (
        "Programación",
        "Cursos orientados al aprendizaje de lenguajes y fundamentos de programación."
    ),
    (
        "Diseño",
        "Cursos relacionados con diseño digital y experiencia de usuario."
    ),
    (
        "Bases de Datos",
        "Cursos orientados al diseño y administración de bases de datos."
    ),
    (
        "Ciencia de Datos",
        "Cursos relacionados con análisis, procesamiento y visualización de datos."
    ),
]


areas = {}


for nombre, descripcion in areas_datos:

    area, creada = Area.objects.get_or_create(
        nombre=nombre,
        defaults={
            "descripcion": descripcion,
            "activo": True,
        }
    )

    # Si ya existía, nos aseguramos de mantenerla activa.
    if not creada:

        area.activo = True

        if not area.descripcion:
            area.descripcion = descripcion

        area.save()

    areas[nombre] = area


# ============================================================
# CURSOS
# ============================================================

"""
Cada curso mantiene dos valores relacionados con su capacidad:

- cupo_maximo:
  cantidad total de estudiantes permitidos en la cohorte.

- cupos_disponibles:
  cantidad de cupos que todavía quedan disponibles.

Los valores pueden ser iguales al crear un curso nuevo.
Posteriormente, los cupos disponibles disminuyen cuando una
matrícula es aprobada y pasa al estado PAGADO.
"""

cursos_datos = [
    {
        "titulo": "Python para Principiantes",
        "area": "Programación",
        "descripcion":
            "Introducción a la programación utilizando Python.",
        "costo": Decimal("95000.00"),
        "fecha_inicio": date(2026, 10, 12),
        "fecha_termino": date(2026, 11, 30),
        "cupo_maximo": 25,
        "cupos_disponibles": 25,
    },
    {
        "titulo": "Diseño de Interfaces UX/UI",
        "area": "Diseño",
        "descripcion":
            "Fundamentos de diseño de interfaces y experiencia de usuario.",
        "costo": Decimal("110000.00"),
        "fecha_inicio": date(2026, 10, 19),
        "fecha_termino": date(2026, 12, 5),
        "cupo_maximo": 20,
        "cupos_disponibles": 20,
    },
    {
        "titulo": "Bases de Datos con PostgreSQL",
        "area": "Bases de Datos",
        "descripcion":
            "Diseño, consultas y administración de bases de datos PostgreSQL.",
        "costo": Decimal("120000.00"),
        "fecha_inicio": date(2026, 11, 2),
        "fecha_termino": date(2026, 12, 18),
        "cupo_maximo": 18,
        "cupos_disponibles": 18,
    },
    {
        "titulo": "Desarrollo de APIs con Django REST",
        "area": "Tecnología",
        "descripcion":
            "Construcción de APIs REST utilizando Django REST Framework.",
        "costo": Decimal("135000.00"),
        "fecha_inicio": date(2026, 11, 9),
        "fecha_termino": date(2027, 1, 8),
        "cupo_maximo": 20,
        "cupos_disponibles": 20,
    },
    {
        "titulo": "Análisis de Datos con Python",
        "area": "Ciencia de Datos",
        "descripcion":
            "Introducción al procesamiento y análisis de datos con Python.",
        "costo": Decimal("140000.00"),
        "fecha_inicio": date(2026, 11, 16),
        "fecha_termino": date(2027, 1, 15),
        "cupo_maximo": 16,
        "cupos_disponibles": 16,
    },
]


cursos = {}


# Primero recuperamos el curso que ya existe.
curso_django = Curso.objects.filter(
    titulo="Desarrollo Web con Django"
).first()


if curso_django:

    cursos["Desarrollo Web con Django"] = curso_django


# Creamos únicamente los cursos que faltan.
for datos in cursos_datos:

    curso, creada = Curso.objects.get_or_create(
        titulo=datos["titulo"],
        defaults={
            "area": areas[datos["area"]],
            "descripcion": datos["descripcion"],
            "costo": datos["costo"],
            "fecha_inicio": datos["fecha_inicio"],
            "fecha_termino": datos["fecha_termino"],
            "cupo_maximo":
                datos["cupo_maximo"],
            "cupos_disponibles":
                datos["cupos_disponibles"],
            "activo": True,
        }
    )

    cursos[datos["titulo"]] = curso


# ============================================================
# ESTUDIANTES
# ============================================================

estudiantes_datos = [
    (
        "camila",
        "Camila",
        "Soto",
        "camila@edtech.cl"
    ),
    (
        "diego",
        "Diego",
        "Muñoz",
        "diego@edtech.cl"
    ),
    (
        "valentina",
        "Valentina",
        "Rojas",
        "valentina@edtech.cl"
    ),
    (
        "matias",
        "Matías",
        "Silva",
        "matias@edtech.cl"
    ),
    (
        "sofia",
        "Sofía",
        "Contreras",
        "sofia@edtech.cl"
    ),
    (
        "benjamin",
        "Benjamín",
        "Torres",
        "benjamin@edtech.cl"
    ),
]


estudiantes = {}


for (
    username,
    first_name,
    last_name,
    email
) in estudiantes_datos:

    usuario, creado = User.objects.get_or_create(
        username=username,
        defaults={
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
        }
    )

    if creado:

        # Contraseña solo para datos de prueba.
        usuario.set_password("Estudiante123")
        usuario.save()

    perfil, _ = Perfil.objects.get_or_create(
        usuario=usuario
    )

    perfil.rol = Perfil.ROL_ESTUDIANTE
    perfil.save()

    # Garantiza carro persistente.
    CarroMatricula.objects.get_or_create(
        usuario=usuario,
        defaults={
            "activo": True
        }
    )

    estudiantes[username] = usuario


# ============================================================
# CREAR MATRÍCULA HISTÓRICA
# ============================================================

def crear_matricula(
    usuario,
    nombres_cursos,
    estado
):
    """
    Crea una matrícula histórica únicamente si no existe otra
    matrícula del mismo usuario con exactamente esos cursos.
    """

    cursos_objetos = [
        cursos[nombre]
        for nombre in nombres_cursos
        if nombre in cursos
    ]

    if not cursos_objetos:
        return

    # Evita duplicar los datos al ejecutar nuevamente seed.py.
    for matricula_existente in Matricula.objects.filter(
        usuario=usuario
    ):

        ids_existentes = set(
            matricula_existente.detalles.values_list(
                "curso_id",
                flat=True
            )
        )

        ids_nuevos = {
            curso.id
            for curso in cursos_objetos
        }

        if ids_existentes == ids_nuevos:
            return

    total = sum(
        (
            curso.costo
            for curso in cursos_objetos
        ),
        Decimal("0.00")
    )

    matricula = Matricula.objects.create(
        usuario=usuario,
        estado=estado,
        total=total
    )

    for curso in cursos_objetos:

        DetalleMatricula.objects.create(
            matricula=matricula,
            curso=curso,
            precio=curso.costo
        )

    # Pago coherente con el estado histórico.
    if estado in (
        Matricula.ESTADO_PAGADO,
        Matricula.ESTADO_COMPLETADO
    ):

        Pago.objects.create(
            matricula=matricula,
            metodo_pago=Pago.METODO_DEBITO,
            estado=Pago.ESTADO_APROBADO
        )

    elif estado == Matricula.ESTADO_PENDIENTE:

        Pago.objects.create(
            matricula=matricula,
            metodo_pago=Pago.METODO_CREDITO,
            estado=Pago.ESTADO_PENDIENTE
        )


# ============================================================
# MATRÍCULAS DE PRUEBA
# ============================================================

crear_matricula(
    estudiantes["camila"],
    [
        "Python para Principiantes",
        "Desarrollo Web con Django",
    ],
    Matricula.ESTADO_COMPLETADO
)


crear_matricula(
    estudiantes["diego"],
    [
        "Desarrollo Web con Django",
        "Desarrollo de APIs con Django REST",
    ],
    Matricula.ESTADO_PAGADO
)


crear_matricula(
    estudiantes["valentina"],
    [
        "Diseño de Interfaces UX/UI",
    ],
    Matricula.ESTADO_COMPLETADO
)


crear_matricula(
    estudiantes["matias"],
    [
        "Bases de Datos con PostgreSQL",
        "Python para Principiantes",
    ],
    Matricula.ESTADO_PAGADO
)


crear_matricula(
    estudiantes["sofia"],
    [
        "Análisis de Datos con Python",
        "Diseño de Interfaces UX/UI",
    ],
    Matricula.ESTADO_PENDIENTE
)


crear_matricula(
    estudiantes["benjamin"],
    [
        "Desarrollo Web con Django",
    ],
    Matricula.ESTADO_COMPLETADO
)


# ============================================================
# RESUMEN
# ============================================================

print()

print("==========================================")
print(" CARGA DE DATOS EDTECH FINALIZADA")
print("==========================================")

print(
    f"Áreas: {Area.objects.count()}"
)

print(
    f"Cursos: {Curso.objects.count()}"
)

print(
    "Estudiantes:",
    Perfil.objects.filter(
        rol=Perfil.ROL_ESTUDIANTE
    ).count()
)

print(
    f"Matrículas: {Matricula.objects.count()}"
)

print("==========================================")

print()