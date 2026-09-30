"""

Vistas API de la plataforma EdTech.



Este archivo implementa el catálogo público, gestión de cursos,

carro persistente, checkout, matrículas, documentación OpenAPI

y control transaccional de cupos según los roles del sistema.

"""



from decimal import Decimal



from django.db import transaction

from django.db.models import Count

from django.shortcuts import render

from django.contrib.auth.models import User

from django.utils import timezone



from rest_framework import status, serializers

from rest_framework.permissions import (

    AllowAny,

    IsAuthenticated,

)

from rest_framework.response import Response

from rest_framework.views import APIView

from rest_framework.generics import ListAPIView, ListCreateAPIView



from django_filters.rest_framework import DjangoFilterBackend



from drf_spectacular.utils import (

    extend_schema,

    inline_serializer,

)



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



from .serializers import (

    AreaSerializer,

    CursoSerializer,

    CarroMatriculaSerializer,

    MatriculaSerializer,

    MatriculaConPagoSerializer,

    RegistroEstudianteSerializer,

    CoordinadorSerializer,

)





from .permissions import (

    EsEstudiante,

    EsCoordinador,

    EsAdmin,

)





# ============================================================

# SERIALIZADORES AUXILIARES PARA DOCUMENTACIÓN OPENAPI

# ============================================================



MensajeSerializer = inline_serializer(

    name='MensajeRespuesta',

    fields={

        'detail': serializers.CharField(),

    },

)



RegistroRespuestaSerializer = inline_serializer(

    name='RegistroEstudianteRespuesta',

    fields={

        'detail': serializers.CharField(),

        'username': serializers.CharField(),

    },

)



AgregarCursoCarroRequestSerializer = inline_serializer(

    name='AgregarCursoCarroRequest',

    fields={

        'curso': serializers.IntegerField(),

    },

)



CambiarEstadoMatriculaRequestSerializer = inline_serializer(

    name='CambiarEstadoMatriculaRequest',

    fields={

        'estado': serializers.ChoiceField(

            choices=[

                Matricula.ESTADO_PAGADO,

                Matricula.ESTADO_COMPLETADO,

                Matricula.ESTADO_CANCELADO,

            ]

        ),

    },

)



# ============================================================

# SERIALIZADORES AUXILIARES - PAGO SIMULADO

# ============================================================



PagoSimuladoRequestSerializer = inline_serializer(

    name='PagoSimuladoRequest',

    fields={

        'metodo_pago': serializers.ChoiceField(

            choices=[

                'DEBITO',

                'CREDITO',

            ]

        ),

    },

)





PagoSimuladoRespuestaSerializer = inline_serializer(

    name='PagoSimuladoRespuesta',

    fields={

        'detail': serializers.CharField(),

        'pago_id': serializers.IntegerField(),

        'matricula_id': serializers.IntegerField(),

        'estado_pago': serializers.CharField(),

    },

)





# ============================================================

# REGISTRO DE ESTUDIANTES

# ============================================================



class RegistroEstudianteView(APIView):

    """

    Permite registrar públicamente un nuevo estudiante.



    El perfil ESTUDIANTE y su carro persistente son creados

    automáticamente por las señales de la aplicación.

    """



    permission_classes = [

        AllowAny,

    ]



    @extend_schema(

        summary='Registrar estudiante',

        description=(

            'Permite crear públicamente una cuenta de estudiante. '

            'El perfil y el carro persistente se crean '

            'automáticamente.'

        ),

        request=RegistroEstudianteSerializer,

        responses={

            201: RegistroRespuestaSerializer,

            400: RegistroEstudianteSerializer,

        },

        tags=['Autenticación'],

    )

    def post(self, request):



        serializer = RegistroEstudianteSerializer(

            data=request.data

        )



        if serializer.is_valid():



            usuario = serializer.save()



            return Response(

                {

                    'detail':

                    'Estudiante registrado correctamente.',

                    'username':

                    usuario.username,

                },

                status=status.HTTP_201_CREATED

            )



        return Response(

            serializer.errors,

            status=status.HTTP_400_BAD_REQUEST

        )





# ============================================================

# CATÁLOGO PÚBLICO DE ÁREAS

# ============================================================



@extend_schema(

    summary='Listar áreas',

    description=(

        'Devuelve públicamente todas las áreas de conocimiento '

        'que se encuentran activas.'

    ),

    responses={

        200: AreaSerializer(many=True),

    },

    tags=['Áreas'],

)

class AreaListView(ListAPIView):

    """

    Permite consultar públicamente las áreas activas.

    """



    serializer_class = AreaSerializer



    permission_classes = [

        AllowAny,

    ]



    queryset = Area.objects.filter(

        activo=True

    ).order_by(

        'nombre'

    )





# ============================================================

# CATÁLOGO PÚBLICO DE CURSOS

# ============================================================



@extend_schema(

    summary='Listar cursos',

    description=(

        'Devuelve públicamente los cursos activos. '

        'Permite filtrar por área, costo y fecha de inicio.'

    ),

    responses={

        200: CursoSerializer(many=True),

    },

    tags=['Cursos'],

)

class CursoListView(ListCreateAPIView):
    """
    Permite consultar públicamente los cursos activos.

    GET:
    Disponible públicamente y permite filtros mediante
    django-filter.

    POST:
    Permite crear cursos únicamente al Coordinador Académico.
    """

    serializer_class = CursoSerializer

    queryset = Curso.objects.filter(
        activo=True,
        area__activo=True
    ).order_by(
        'titulo'
    )

    filter_backends = [
        DjangoFilterBackend,
    ]

    filterset_fields = {
        'area': ['exact'],
        'costo': ['exact', 'gte', 'lte'],
        'fecha_inicio': ['exact', 'gte', 'lte'],
    }

    def get_permissions(self):
        """
        El catálogo es público para GET.

        La creación de cursos mediante POST requiere
        autenticación y rol de Coordinador Académico.
        """

        if self.request.method == 'GET':
            return [
                AllowAny()
            ]

        return [
            IsAuthenticated(),
            EsCoordinador(),
        ]

    @extend_schema(
        summary='Listar cursos',
        description=(
            'Devuelve públicamente los cursos activos. '
            'Permite filtrar por área, costo y fecha de inicio.'
        ),
        responses={
            200: CursoSerializer(many=True),
        },
        tags=['Cursos'],
    )
    def get(self, request, *args, **kwargs):
        return super().get(
            request,
            *args,
            **kwargs
        )

    @extend_schema(
        summary='Crear curso',
        description=(
            'Permite al Coordinador Académico crear un nuevo '
            'curso o bootcamp.'
        ),
        request=CursoSerializer,
        responses={
            201: CursoSerializer,
            400: CursoSerializer,
        },
        tags=['Cursos'],
    )
    def post(self, request, *args, **kwargs):
        return super().post(
            request,
            *args,
            **kwargs
        )





# ============================================================

# GESTIÓN DE ÁREAS - COORDINADOR

# ============================================================



class GestionAreaView(APIView):

    """

    Permite al Coordinador crear nuevas áreas de conocimiento.

    """



    permission_classes = [

        IsAuthenticated,

        EsCoordinador,

    ]



    @extend_schema(

        summary='Crear área',

        description=(

            'Permite al Coordinador Académico crear una nueva '

            'área de conocimiento.'

        ),

        request=AreaSerializer,

        responses={

            201: AreaSerializer,

            400: AreaSerializer,

        },

        tags=['Áreas'],

    )

    def post(self, request):



        serializer = AreaSerializer(

            data=request.data

        )



        if serializer.is_valid():



            area = serializer.save()



            return Response(

                AreaSerializer(area).data,

                status=status.HTTP_201_CREATED

            )



        return Response(

            serializer.errors,

            status=status.HTTP_400_BAD_REQUEST

        )





class GestionAreaDetalleView(APIView):

    """

    Permite al Coordinador modificar o inactivar

    un área de conocimiento.

    """



    permission_classes = [

        IsAuthenticated,

        EsCoordinador,

    ]



    def obtener_area(self, pk):

        """

        Obtiene solamente áreas activas.

        """



        try:



            return Area.objects.get(

                pk=pk,

                activo=True

            )



        except Area.DoesNotExist:



            return None



    @extend_schema(

        summary='Actualizar área',

        description=(

            'Permite al Coordinador Académico modificar '

            'un área activa.'

        ),

        request=AreaSerializer,

        responses={

            200: AreaSerializer,

            400: AreaSerializer,

            404: MensajeSerializer,

        },

        tags=['Áreas'],

    )

    def put(self, request, pk):



        area = self.obtener_area(pk)



        if not area:



            return Response(

                {

                    'detail':

                    'Área no encontrada.'

                },

                status=status.HTTP_404_NOT_FOUND

            )



        serializer = AreaSerializer(

            area,

            data=request.data

        )



        if serializer.is_valid():



            serializer.save()



            return Response(

                serializer.data

            )



        return Response(

            serializer.errors,

            status=status.HTTP_400_BAD_REQUEST

        )



    @extend_schema(

        summary='Inactivar área',

        description=(

            'Realiza eliminación lógica del área. '

            'No permite inactivarla mientras posea cursos '

            'activos asociados.'

        ),

        request=None,

        responses={

            200: MensajeSerializer,

            400: MensajeSerializer,

            404: MensajeSerializer,

        },

        tags=['Áreas'],

    )

    def delete(self, request, pk):



        area = self.obtener_area(pk)



        if not area:



            return Response(

                {

                    'detail':

                    'Área no encontrada.'

                },

                status=status.HTTP_404_NOT_FOUND

            )



        # No se permite inactivar un área con cursos activos.

        if area.cursos.filter(

            activo=True

        ).exists():



            return Response(

                {

                    'detail':

                    'No se puede inactivar el área porque '

                    'tiene cursos activos asociados.'

                },

                status=status.HTTP_400_BAD_REQUEST

            )



        area.activo = False



        area.save(

            update_fields=[

                'activo'

            ]

        )



        return Response(

            {

                'detail':

                'Área inactivada correctamente.'

            }

        )





# ============================================================

# GESTIÓN DE CURSOS - COORDINADOR

# ============================================================



class GestionCursoView(APIView):

    """

    Permite al Coordinador crear cursos.

    """



    permission_classes = [

        IsAuthenticated,

        EsCoordinador,

    ]



    @extend_schema(

        summary='Crear curso',

        description=(

            'Permite al Coordinador Académico crear un nuevo '

            'curso o bootcamp.'

        ),

        request=CursoSerializer,

        responses={

            201: CursoSerializer,

            400: CursoSerializer,

        },

        tags=['Cursos'],

    )

    def post(self, request):



        serializer = CursoSerializer(

            data=request.data

        )



        if serializer.is_valid():



            curso = serializer.save()



            return Response(

                CursoSerializer(

                    curso

                ).data,

                status=status.HTTP_201_CREATED

            )



        return Response(

            serializer.errors,

            status=status.HTTP_400_BAD_REQUEST

        )





class GestionCursoDetalleView(APIView):

    """

    Permite actualizar o realizar eliminación lógica

    de un curso existente.

    """



    permission_classes = [

        IsAuthenticated,

        EsCoordinador,

    ]



    def obtener_curso(self, pk):



        try:



            return Curso.objects.get(

                pk=pk,

                activo=True

            )



        except Curso.DoesNotExist:



            return None



    @extend_schema(

        summary='Actualizar curso',

        description=(

            'Permite al Coordinador Académico modificar '

            'un curso activo.'

        ),

        request=CursoSerializer,

        responses={

            200: CursoSerializer,

            400: CursoSerializer,

            404: MensajeSerializer,

        },

        tags=['Cursos'],

    )

    def put(self, request, pk):



        curso = self.obtener_curso(pk)



        if not curso:



            return Response(

                {

                    'detail':

                    'Curso no encontrado.'

                },

                status=status.HTTP_404_NOT_FOUND

            )



        serializer = CursoSerializer(

            curso,

            data=request.data

        )



        if serializer.is_valid():



            serializer.save()



            return Response(

                serializer.data

            )



        return Response(

            serializer.errors,

            status=status.HTTP_400_BAD_REQUEST

        )



    @extend_schema(

        summary='Inactivar curso',

        description=(

            'Realiza eliminación lógica del curso. '

            'El registro permanece almacenado en la base '

            'de datos con estado inactivo.'

        ),

        request=None,

        responses={

            200: MensajeSerializer,

            404: MensajeSerializer,

        },

        tags=['Cursos'],

    )

    def delete(self, request, pk):



        curso = self.obtener_curso(pk)



        if not curso:



            return Response(

                {

                    'detail':

                    'Curso no encontrado.'

                },

                status=status.HTTP_404_NOT_FOUND

            )



        curso.activo = False



        curso.save(

            update_fields=[

                'activo'

            ]

        )



        return Response(

            {

                'detail':

                'Curso inactivado correctamente.'

            }

        )





# ============================================================

# CARRO PERSISTENTE DEL ESTUDIANTE

# ============================================================



class CarroMatriculaView(APIView):

    """

    Permite consultar y agregar cursos al carro persistente

    del estudiante autenticado.

    """



    permission_classes = [

        IsAuthenticated,

        EsEstudiante,

    ]



    def obtener_carro(self, usuario):

        """

        Obtiene o crea el carro persistente del estudiante.

        """



        carro, creado = (

            CarroMatricula.objects.get_or_create(

                usuario=usuario,

                defaults={

                    'activo': True

                }

            )

        )



        if not carro.activo:



            carro.activo = True



            carro.save(

                update_fields=[

                    'activo'

                ]

            )



        return carro



    @extend_schema(

        summary='Consultar carro de matrícula',

        description=(

            'Devuelve el carro persistente del estudiante '

            'autenticado, sus cursos y el total.'

        ),

        responses={

            200: CarroMatriculaSerializer,

        },

        tags=['Carro de matrícula'],

    )

    def get(self, request):



        carro = self.obtener_carro(

            request.user

        )



        serializer = CarroMatriculaSerializer(

            carro

        )



        return Response(

            serializer.data

        )



    @extend_schema(

        summary='Agregar curso al carro de matrícula',

        description=(

            'Permite al estudiante autenticado agregar un curso '

            'a su carro persistente. Agregarlo al carro no '

            'descuenta cupos.'

        ),

        request=AgregarCursoCarroRequestSerializer,

        responses={

            201: CarroMatriculaSerializer,

            400: MensajeSerializer,

            404: MensajeSerializer,

        },

        tags=['Carro de matrícula'],

    )

    def post(self, request):



        curso_id = request.data.get(

            'curso'

        )



        try:



            curso = Curso.objects.get(

                pk=curso_id,

                activo=True,

                area__activo=True

            )



        except (

            Curso.DoesNotExist,

            ValueError,

            TypeError

        ):



            return Response(

                {

                    'detail':

                    'El curso no existe o no está disponible.'

                },

                status=status.HTTP_404_NOT_FOUND

            )



        carro = self.obtener_carro(

            request.user

        )



        item = ItemCarro.objects.filter(

            carro=carro,

            curso=curso

        ).first()



        # Evita agregar dos veces el mismo curso.

        if item and item.activo:



            return Response(

                {

                    'detail':

                    'El curso ya se encuentra en el carro.'

                },

                status=status.HTTP_400_BAD_REQUEST

            )



        # Si el ítem existía inactivo, se reactiva.

        if item:



            item.activo = True



            item.save(

                update_fields=[

                    'activo'

                ]

            )



        else:



            ItemCarro.objects.create(

                carro=carro,

                curso=curso

            )



        # IMPORTANTE:

        # Agregar al carro NO descuenta cupos.



        return Response(

            CarroMatriculaSerializer(

                carro

            ).data,

            status=status.HTTP_201_CREATED

        )





# ============================================================

# ELIMINACIÓN LÓGICA DE ÍTEM DEL CARRO

# ============================================================



class ItemCarroDeleteView(APIView):

    """

    Permite quitar un curso del carro mediante

    eliminación lógica.

    """



    permission_classes = [

        IsAuthenticated,

        EsEstudiante,

    ]



    @extend_schema(

        summary='Quitar curso del carro',

        description=(

            'Quita un curso del carro del estudiante mediante '

            'eliminación lógica.'

        ),

        request=None,

        responses={

            200: MensajeSerializer,

            404: MensajeSerializer,

        },

        tags=['Carro de matrícula'],

    )

    def delete(self, request, pk):



        try:



            item = ItemCarro.objects.get(

                pk=pk,

                carro__usuario=request.user,

                activo=True

            )



        except ItemCarro.DoesNotExist:



            return Response(

                {

                    'detail':

                    'Ítem no encontrado en el carro.'

                },

                status=status.HTTP_404_NOT_FOUND

            )



        item.activo = False



        item.save(

            update_fields=[

                'activo'

            ]

        )



        return Response(

            {

                'detail':

                'Curso eliminado del carro.'

            }

        )





# ============================================================

# CHECKOUT / CONFIRMACIÓN DE MATRÍCULA

# ============================================================



class ConfirmarMatriculaView(APIView):

    """

    Convierte el contenido del carro en una matrícula histórica.



    El checkout genera inicialmente una matrícula PENDIENTE.

    Los cupos todavía NO se descuentan en esta etapa.

    """



    permission_classes = [

        IsAuthenticated,

        EsEstudiante,

    ]



    @extend_schema(

        summary='Confirmar matrícula',

        description=(

            'Convierte los cursos del carro del estudiante en '

            'una matrícula histórica con estado PENDIENTE. '

            'No requiere cuerpo de petición y todavía no '

            'descuenta cupos.'

        ),

        request=None,

        responses={

            201: MatriculaSerializer,

            400: MensajeSerializer,

        },

        tags=['Matrículas'],

    )

    @transaction.atomic

    def post(self, request):



        try:



            carro = CarroMatricula.objects.get(

                usuario=request.user,

                activo=True

            )



        except CarroMatricula.DoesNotExist:



            return Response(

                {

                    'detail':

                    'No existe un carro activo.'

                },

                status=status.HTTP_400_BAD_REQUEST

            )



        items = list(

            carro.items.select_related(

                'curso'

            ).filter(

                activo=True,

                curso__activo=True

            )

        )



        if not items:



            return Response(

                {

                    'detail':

                    'El carro está vacío.'

                },

                status=status.HTTP_400_BAD_REQUEST

            )



        # Se comprueba que los cursos seleccionados

        # tengan disponibilidad al confirmar el carro.

        for item in items:



            if item.curso.cupos_disponibles < 1:



                return Response(

                    {

                        'detail':

                        f'No hay cupos disponibles para '

                        f'{item.curso.titulo}.'

                    },

                    status=status.HTTP_400_BAD_REQUEST

                )



        total = sum(

            (

                item.curso.costo

                for item in items

            ),

            Decimal('0.00')

        )



        matricula = Matricula.objects.create(

            usuario=request.user,

            estado=Matricula.ESTADO_PENDIENTE,

            total=total

        )



        # Guarda el precio histórico de cada curso.

        for item in items:



            DetalleMatricula.objects.create(

                matricula=matricula,

                curso=item.curso,

                precio=item.curso.costo

            )



            # El ítem sale del carro mediante

            # eliminación lógica.

            item.activo = False



            item.save(

                update_fields=[

                    'activo'

                ]

            )



        return Response(

            MatriculaSerializer(

                matricula

            ).data,

            status=status.HTTP_201_CREATED

        )





# ============================================================

# MATRÍCULAS DEL ESTUDIANTE

# ============================================================



@extend_schema(

    summary='Consultar mis matrículas',

    description=(

        'Devuelve solamente las matrículas pertenecientes '

        'al estudiante autenticado.'

    ),

    responses={

        200: MatriculaSerializer(many=True),

    },

    tags=['Matrículas'],

)

class MisMatriculasView(ListAPIView):

    """

    Devuelve solamente las matrículas pertenecientes

    al estudiante autenticado.

    """



    serializer_class = MatriculaConPagoSerializer



    permission_classes = [

        IsAuthenticated,

        EsEstudiante,

    ]



    def get_queryset(self):



        return Matricula.objects.filter(

            usuario=self.request.user

        ).prefetch_related(

            'detalles__curso'

        ).order_by(

            '-fecha_creacion'

        )





# ============================================================

# EXTENSIÓN ADICIONAL - PORTAL DE PAGO SIMULADO

# ============================================================



class DetallePagoMatriculaView(APIView):

    """

    Permite al estudiante consultar una matrícula pendiente

    antes de realizar el pago simulado.



    Solamente puede consultar matrículas que le pertenecen.

    """



    permission_classes = [

        IsAuthenticated,

        EsEstudiante,

    ]





    @extend_schema(

        summary='Consultar matrícula para pago',

        description=(

            'Devuelve el detalle de una matrícula perteneciente '

            'al estudiante autenticado para mostrarlo en el '

            'portal de pago simulado.'

        ),

        responses={

            200: MatriculaSerializer,

            404: MensajeSerializer,

        },

        tags=['Pagos'],

    )

    def get(self, request, pk):



        try:



            matricula = (

                Matricula.objects

                .prefetch_related(

                    'detalles__curso'

                )

                .get(

                    pk=pk,

                    usuario=request.user

                )

            )



        except Matricula.DoesNotExist:



            return Response(

                {

                    'detail':

                    'Matrícula no encontrada.'

                },

                status=status.HTTP_404_NOT_FOUND

            )





        return Response(

            MatriculaSerializer(

                matricula

            ).data

        )







class RealizarPagoSimuladoView(APIView):

    """

    Registra una solicitud de pago simulado.



    El pago queda inicialmente PENDIENTE y debe ser revisado

    posteriormente por el Coordinador Académico.



    En esta etapa todavía no se descuentan cupos.

    """



    permission_classes = [

        IsAuthenticated,

        EsEstudiante,

    ]





    @extend_schema(

        summary='Realizar pago simulado',

        description=(

            'Registra el pago simulado de una matrícula. '

            'La solicitud queda PENDIENTE hasta que sea '

            'revisada por un Coordinador Académico.'

        ),

        request=PagoSimuladoRequestSerializer,

        responses={

            201: PagoSimuladoRespuestaSerializer,

            400: MensajeSerializer,

            404: MensajeSerializer,

        },

        tags=['Pagos'],

    )

    @transaction.atomic

    def post(self, request, pk):



        # ----------------------------------------------------

        # VALIDAR MÉTODO DE PAGO

        # ----------------------------------------------------



        metodo_pago = request.data.get(

            'metodo_pago'

        )





        metodos_validos = [

            'DEBITO',

            'CREDITO',

        ]





        if metodo_pago not in metodos_validos:



            return Response(

                {

                    'detail':

                    'Debes seleccionar un método de pago válido.'

                },

                status=status.HTTP_400_BAD_REQUEST

            )





        # ----------------------------------------------------

        # OBTENER MATRÍCULA DEL ESTUDIANTE

        # ----------------------------------------------------



        try:



            matricula = (

                Matricula.objects

                .select_for_update()

                .get(

                    pk=pk,

                    usuario=request.user

                )

            )



        except Matricula.DoesNotExist:



            return Response(

                {

                    'detail':

                    'Matrícula no encontrada.'

                },

                status=status.HTTP_404_NOT_FOUND

            )





        # ----------------------------------------------------

        # VALIDAR ESTADO DE LA MATRÍCULA

        # ----------------------------------------------------



        if (

            matricula.estado

            != Matricula.ESTADO_PENDIENTE

        ):



            return Response(

                {

                    'detail':

                    'Solo se puede realizar el pago de una '

                    'matrícula pendiente.'

                },

                status=status.HTTP_400_BAD_REQUEST

            )





        # ----------------------------------------------------

        # CREAR O REUTILIZAR EL PAGO

        # ----------------------------------------------------



        pago, creado = Pago.objects.get_or_create(

            matricula=matricula,

            defaults={

                'estado':

                Pago.ESTADO_PENDIENTE,

            }

        )





        # Si ya existe una solicitud pendiente,

        # evitamos crear o enviar otra.



        if (

            not creado

            and pago.estado

            == Pago.ESTADO_PENDIENTE

        ):



            return Response(

                {

                    'detail':

                    'Esta matrícula ya posee un pago '

                    'pendiente de revisión.'

                },

                status=status.HTTP_400_BAD_REQUEST

            )





        # Un pago rechazado puede volver a enviarse.



        if (

            not creado

            and pago.estado

            == Pago.ESTADO_RECHAZADO

        ):



            pago.estado = Pago.ESTADO_PENDIENTE



            pago.fecha_revision = None



            pago.save(

                update_fields=[

                    'estado',

                    'fecha_revision',

                ]

            )





        # No debería existir una matrícula pendiente

        # con un pago ya aprobado.



        if (

            not creado

            and pago.estado

            == Pago.ESTADO_APROBADO

        ):



            return Response(

                {

                    'detail':

                    'El pago de esta matrícula ya fue aprobado.'

                },

                status=status.HTTP_400_BAD_REQUEST

            )





        return Response(

            {

                'detail':

                'Pago enviado correctamente. '

                'Está pendiente de aprobación.',



                'pago_id':

                pago.id,



                'matricula_id':

                matricula.id,



                'estado_pago':

                pago.estado,

            },

            status=(

                status.HTTP_201_CREATED

                if creado

                else status.HTTP_200_OK

            )

        )





# ============================================================

# LISTADO DE MATRÍCULAS - COORDINADOR

# ============================================================



@extend_schema(

    summary='Listar matrículas',

    description=(

        'Permite al Coordinador Académico consultar todas '

        'las matrículas registradas en la plataforma.'

    ),

    responses={

        200: MatriculaSerializer(many=True),

    },

    tags=['Matrículas'],

)

class GestionMatriculasView(ListAPIView):

    """

    Permite al Coordinador consultar todas las matrículas

    registradas en la plataforma.

    """



    serializer_class = MatriculaConPagoSerializer



    permission_classes = [

        IsAuthenticated,

        EsCoordinador,

    ]



    def get_queryset(self):



        return Matricula.objects.select_related(

            'usuario'

        ).prefetch_related(

            'detalles__curso'

        ).order_by(

            '-fecha_creacion'

        )





# ============================================================

# CAMBIO DE ESTADO - COORDINADOR

# ============================================================



class CambiarEstadoMatriculaView(APIView):

    """

    Permite al Coordinador cambiar el estado de una matrícula.



    PENDIENTE -> PAGADO:

    requiere un pago pendiente de revisión, valida los cupos,

    descuenta un cupo por curso y aprueba el pago.



    PAGADO -> CANCELADO:

    restaura los cupos utilizados.



    PAGADO -> COMPLETADO:

    finaliza académicamente la matrícula.

    """



    permission_classes = [

        IsAuthenticated,

        EsCoordinador,

    ]



    @extend_schema(

        summary='Cambiar estado de una matrícula',

        description=(

            'Permite al Coordinador Académico cambiar el estado '

            'de una matrícula. Para pasar de PENDIENTE a PAGADO '

            'debe existir un pago pendiente de revisión. '

            'Al aprobar se descuentan los cupos de manera atómica. '

            'Al pasar de PAGADO a CANCELADO se restauran.'

        ),

        request=CambiarEstadoMatriculaRequestSerializer,

        responses={

            200: MatriculaSerializer,

            400: MensajeSerializer,

            404: MensajeSerializer,

        },

        tags=['Matrículas'],

    )

    @transaction.atomic

    def patch(self, request, pk):



        try:



            matricula = (

                Matricula.objects

                .select_for_update()

                .get(

                    pk=pk

                )

            )



        except Matricula.DoesNotExist:



            return Response(

                {

                    'detail':

                    'Matrícula no encontrada.'

                },

                status=status.HTTP_404_NOT_FOUND

            )



        nuevo_estado = request.data.get(

            'estado'

        )



        estados_validos = [

            opcion[0]

            for opcion

            in Matricula.ESTADO_CHOICES

        ]



        if nuevo_estado not in estados_validos:



            return Response(

                {

                    'detail':

                    'Estado no válido.'

                },

                status=status.HTTP_400_BAD_REQUEST

            )



        estado_anterior = matricula.estado



        # ----------------------------------------------------

        # MISMO ESTADO

        # ----------------------------------------------------



        if estado_anterior == nuevo_estado:



            return Response(

                {

                    'detail':

                    'La matrícula ya posee ese estado.'

                },

                status=status.HTTP_400_BAD_REQUEST

            )



        # ----------------------------------------------------

        # PENDIENTE -> PAGADO

        # ----------------------------------------------------



        if (

            estado_anterior

            == Matricula.ESTADO_PENDIENTE

            and nuevo_estado

            == Matricula.ESTADO_PAGADO

        ):



            # Debe existir un pago enviado por el estudiante.



            try:



                pago = (

                    Pago.objects

                    .select_for_update()

                    .get(

                        matricula=matricula

                    )

                )



            except Pago.DoesNotExist:



                return Response(

                    {

                        'detail':

                        'La matrícula todavía no posee un pago '

                        'para revisar.'

                    },

                    status=status.HTTP_400_BAD_REQUEST

                )



            # Solo un pago pendiente puede aprobarse.



            if pago.estado != Pago.ESTADO_PENDIENTE:



                return Response(

                    {

                        'detail':

                        'El pago de esta matrícula no se encuentra '

                        'pendiente de revisión.'

                    },

                    status=status.HTTP_400_BAD_REQUEST

                )



            detalles = matricula.detalles.all()



            cursos_bloqueados = []



            # Primero se bloquean y validan todos los cursos.

            # Si uno no tiene cupos, no se modifica ninguno.



            for detalle in detalles:



                curso = (

                    Curso.objects

                    .select_for_update()

                    .get(

                        pk=detalle.curso_id

                    )

                )



                if curso.cupos_disponibles < 1:



                    transaction.set_rollback(

                        True

                    )



                    return Response(

                        {

                            'detail':

                            f'No hay cupos disponibles para '

                            f'{curso.titulo}.'

                        },

                        status=status.HTTP_400_BAD_REQUEST

                    )



                cursos_bloqueados.append(

                    curso

                )



            # Después de validar todos los cursos,

            # se descuenta un cupo por cada uno.



            for curso in cursos_bloqueados:



                curso.cupos_disponibles -= 1



                curso.save(

                    update_fields=[

                        'cupos_disponibles'

                    ]

                )



            # El pago queda aprobado en la misma transacción.



            pago.estado = Pago.ESTADO_APROBADO



            pago.fecha_revision = timezone.now()



            pago.save(

                update_fields=[

                    'estado',

                    'fecha_revision',

                ]

            )



        # ----------------------------------------------------

        # PAGADO -> CANCELADO

        # ----------------------------------------------------



        elif (

            estado_anterior

            == Matricula.ESTADO_PAGADO

            and nuevo_estado

            == Matricula.ESTADO_CANCELADO

        ):



            # Al cancelar una matrícula pagada,

            # los cupos utilizados se restauran.



            for detalle in matricula.detalles.all():



                curso = (

                    Curso.objects

                    .select_for_update()

                    .get(

                        pk=detalle.curso_id

                    )

                )



                curso.cupos_disponibles += 1



                curso.save(

                    update_fields=[

                        'cupos_disponibles'

                    ]

                )



        # ----------------------------------------------------

        # PAGADO -> COMPLETADO

        # ----------------------------------------------------



        elif (

            estado_anterior

            == Matricula.ESTADO_PAGADO

            and nuevo_estado

            == Matricula.ESTADO_COMPLETADO

        ):



            # No se modifican cupos.

            # La matrícula solamente cambia su estado académico.



            pass



        # ----------------------------------------------------

        # CUALQUIER OTRA TRANSICIÓN

        # ----------------------------------------------------



        else:



            return Response(

                {

                    'detail':

                    'La transición de estado no está permitida.'

                },

                status=status.HTTP_400_BAD_REQUEST

            )



        # ----------------------------------------------------

        # GUARDAR NUEVO ESTADO

        # ----------------------------------------------------



        matricula.estado = nuevo_estado



        matricula.save(

            update_fields=[

                'estado'

            ]

        )



        return Response(

            MatriculaSerializer(

                matricula

            ).data

        )





class RechazarPagoMatriculaView(APIView):

    """

    EXTENSIÓN ADICIONAL.



    Permite al Coordinador Académico rechazar

    un pago pendiente de revisión.



    La matrícula permanece en estado PENDIENTE

    y no se modifican los cupos de los cursos.

    """



    permission_classes = [

        IsAuthenticated,

        EsCoordinador,

    ]



    @extend_schema(

        summary='Rechazar pago de una matrícula',

        description=(

            'Permite al Coordinador Académico rechazar '

            'un pago que se encuentra pendiente de revisión. '

            'La matrícula permanece PENDIENTE y no se '

            'modifican los cupos.'

        ),

        request=None,

        responses={

            200: MensajeSerializer,

            400: MensajeSerializer,

            404: MensajeSerializer,

        },

        tags=['Pagos'],

    )

    @transaction.atomic

    def patch(self, request, pk):



        # ----------------------------------------------------

        # BUSCAR MATRÍCULA

        # ----------------------------------------------------



        try:



            matricula = (

                Matricula.objects

                .select_for_update()

                .get(

                    pk=pk

                )

            )



        except Matricula.DoesNotExist:



            return Response(

                {

                    'detail':

                    'Matrícula no encontrada.'

                },

                status=status.HTTP_404_NOT_FOUND

            )



        # ----------------------------------------------------

        # VALIDAR ESTADO DE MATRÍCULA

        # ----------------------------------------------------



        if (

            matricula.estado

            != Matricula.ESTADO_PENDIENTE

        ):



            return Response(

                {

                    'detail':

                    'Solo se puede rechazar el pago de una '

                    'matrícula pendiente.'

                },

                status=status.HTTP_400_BAD_REQUEST

            )



        # ----------------------------------------------------

        # BUSCAR PAGO

        # ----------------------------------------------------



        try:



            pago = (

                Pago.objects

                .select_for_update()

                .get(

                    matricula=matricula

                )

            )



        except Pago.DoesNotExist:



            return Response(

                {

                    'detail':

                    'La matrícula todavía no posee un pago '

                    'para revisar.'

                },

                status=status.HTTP_404_NOT_FOUND

            )



        # ----------------------------------------------------

        # VALIDAR PAGO

        # ----------------------------------------------------



        if pago.estado != Pago.ESTADO_PENDIENTE:



            return Response(

                {

                    'detail':

                    'El pago no se encuentra pendiente '

                    'de revisión.'

                },

                status=status.HTTP_400_BAD_REQUEST

            )



        # ----------------------------------------------------

        # RECHAZAR PAGO

        # ----------------------------------------------------



        pago.estado = Pago.ESTADO_RECHAZADO



        pago.fecha_revision = timezone.now()



        pago.save(

            update_fields=[

                'estado',

                'fecha_revision',

            ]

        )



        return Response(

            {

                'detail':

                'Pago rechazado correctamente.'

            },

            status=status.HTTP_200_OK

        )





# ============================================================

# EXTENSIÓN ADICIONAL - GESTIÓN DE COORDINADORES

# ============================================================



class GestionCoordinadoresView(APIView):

    """

    Extensión adicional para que el Administrador pueda

    consultar y crear Coordinadores Académicos.



    El rol COORDINADOR se asigna automáticamente y no puede

    ser seleccionado desde el cliente.

    """



    permission_classes = [

        IsAuthenticated,

        EsAdmin,

    ]



    @extend_schema(

        summary='Listar coordinadores',

        description=(

            'Permite al Administrador consultar los '

            'Coordinadores Académicos registrados.'

        ),

        responses={

            200: CoordinadorSerializer(many=True),

        },

        tags=['Administrador'],

    )

    def get(self, request):



        coordinadores = (

            User.objects

            .filter(

                perfil__rol=Perfil.ROL_COORDINADOR

            )

            .select_related(

                'perfil'

            )

            .order_by(

                'first_name',

                'last_name',

                'username'

            )

        )



        return Response(

            CoordinadorSerializer(

                coordinadores,

                many=True

            ).data

        )



    @extend_schema(

        summary='Crear coordinador',

        description=(

            'Permite al Administrador crear una cuenta '

            'de Coordinador Académico.'

        ),

        request=CoordinadorSerializer,

        responses={

            201: CoordinadorSerializer,

            400: CoordinadorSerializer,

        },

        tags=['Administrador'],

    )

    @transaction.atomic

    def post(self, request):



        serializer = CoordinadorSerializer(

            data=request.data

        )



        if serializer.is_valid():



            coordinador = serializer.save()



            return Response(

                CoordinadorSerializer(

                    coordinador

                ).data,

                status=status.HTTP_201_CREATED

            )



        return Response(

            serializer.errors,

            status=status.HTTP_400_BAD_REQUEST

        )





# ============================================================

# EXTENSIÓN ADICIONAL - EDICIÓN DE COORDINADORES

# ============================================================



class GestionCoordinadorDetalleView(APIView):

    """

    Permite al Administrador modificar los datos básicos,

    inactivar o reactivar un Coordinador Académico.



    La cuenta no se elimina físicamente para conservar

    su relación con los registros históricos.

    """



    permission_classes = [

        IsAuthenticated,

        EsAdmin,

    ]



    def obtener_coordinador(self, pk):



        try:



            return (

                User.objects

                .select_related(

                    'perfil'

                )

                .get(

                    pk=pk,

                    perfil__rol=Perfil.ROL_COORDINADOR

                )

            )



        except User.DoesNotExist:



            return None



    @extend_schema(

        summary='Actualizar coordinador',

        description=(

            'Permite al Administrador modificar los datos '

            'de un Coordinador Académico.'

        ),

        request=CoordinadorSerializer,

        responses={

            200: CoordinadorSerializer,

            400: CoordinadorSerializer,

            404: MensajeSerializer,

        },

        tags=['Administrador'],

    )

    def put(self, request, pk):
        """
        Actualiza los datos del Coordinador.

        Si se proporciona una nueva contraseña, se valida antes
        de guardar cualquier modificación.
        """

        coordinador = self.obtener_coordinador(
            pk
        )

        if not coordinador:

            return Response(
                {
                    'detail':
                    'Coordinador no encontrado.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # La contraseña no es obligatoria al editar.
        datos = request.data.copy()

        password = datos.pop(
            'password',
            None
        )

        if isinstance(
            password,
            list
        ):
            password = (
                password[0]
                if password
                else None
            )

        # La contraseña se valida ANTES de guardar
        # cualquier otro cambio del coordinador.
        if (
            password
            and len(password) < 8
        ):

            return Response(
                {
                    'password':
                    'La contraseña debe tener al menos '
                    '8 caracteres.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CoordinadorSerializer(
            coordinador,
            data=datos,
            partial=True
        )

        if serializer.is_valid():

            coordinador = serializer.save()

            # Solo se modifica la contraseña si se envió una nueva.
            if password:

                coordinador.set_password(
                    password
                )

                coordinador.save(
                    update_fields=[
                        'password'
                    ]
                )

            return Response(
                CoordinadorSerializer(
                    coordinador
                ).data
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )



    @extend_schema(

        summary='Inactivar coordinador',

        description=(

            'Inactiva la cuenta del Coordinador sin eliminar '

            'su información histórica.'

        ),

        request=None,

        responses={

            200: MensajeSerializer,

            404: MensajeSerializer,

        },

        tags=['Administrador'],

    )

    def delete(self, request, pk):



        coordinador = self.obtener_coordinador(

            pk

        )



        if not coordinador:



            return Response(

                {

                    'detail':

                    'Coordinador no encontrado.'

                },

                status=status.HTTP_404_NOT_FOUND

            )



        if not coordinador.is_active:



            return Response(

                {

                    'detail':

                    'El Coordinador ya se encuentra inactivo.'

                },

                status=status.HTTP_400_BAD_REQUEST

            )



        coordinador.is_active = False



        coordinador.save(

            update_fields=[

                'is_active'

            ]

        )



        return Response(

            {

                'detail':

                'Coordinador inactivado correctamente.'

            }

        )



    @extend_schema(

        summary='Reactivar coordinador',

        description=(

            'Reactiva una cuenta de Coordinador Académico '

            'previamente inactivada.'

        ),

        request=None,

        responses={

            200: CoordinadorSerializer,

            404: MensajeSerializer,

        },

        tags=['Administrador'],

    )

    def patch(self, request, pk):



        coordinador = self.obtener_coordinador(

            pk

        )



        if not coordinador:



            return Response(

                {

                    'detail':

                    'Coordinador no encontrado.'

                },

                status=status.HTTP_404_NOT_FOUND

            )



        coordinador.is_active = True



        coordinador.save(

            update_fields=[

                'is_active'

            ]

        )



        return Response(

            CoordinadorSerializer(

                coordinador

            ).data

        )





# ============================================================

# EXTENSIÓN ADICIONAL - DASHBOARD DEL ADMINISTRADOR

# ============================================================



class DashboardAdminView(APIView):

    """

    Entrega información general de la plataforma para el

    dashboard del administrador.



    Todos los datos se obtienen directamente desde la base

    de datos PostgreSQL.

    """



    permission_classes = [

        IsAuthenticated,

        EsAdmin

    ]





    @extend_schema(
        summary='Consultar dashboard del administrador',
        description=(
            'Devuelve las métricas generales de la plataforma, '
            'incluyendo estudiantes, coordinadores, cursos, '
            'matrículas, cursos populares y áreas de mayor interés.'
        ),
        tags=['Administrador'],
    )
    def get(self, request):



        # ====================================================

        # CONTADORES GENERALES

        # ====================================================



        total_estudiantes = User.objects.filter(

            perfil__rol=Perfil.ROL_ESTUDIANTE,

            is_active=True

        ).count()



        total_coordinadores = User.objects.filter(

            perfil__rol=Perfil.ROL_COORDINADOR,

            is_active=True

        ).count()



        total_cursos = Curso.objects.filter(

            activo=True

        ).count()



        total_matriculas = Matricula.objects.count()





        # ====================================================

        # CURSOS CON MÁS MATRÍCULAS

        # ====================================================

        # Se utilizan los detalles de matrícula reales

        # almacenados en la base de datos.



        cursos_matriculados = (

            DetalleMatricula.objects

            .values(

                "curso_id",

                "curso__titulo"

            )

            .annotate(

                total_matriculas=Count("id")

            )

            .order_by(

                "-total_matriculas",

                "curso__titulo"

            )[:5]

        )





        cursos_populares = []



        for curso in cursos_matriculados:



            cursos_populares.append({

                "id": curso["curso_id"],

                "titulo": curso["curso__titulo"],

                "total_matriculas":

                    curso["total_matriculas"]

            })





        # ====================================================

        # ÁREAS DE MAYOR INTERÉS

        # ====================================================

        # El interés se calcula según la cantidad de cursos

        # presentes en las matrículas de los estudiantes.



        areas_matriculadas = (

            DetalleMatricula.objects

            .values(

                "curso__area_id",

                "curso__area__nombre"

            )

            .annotate(

                total_matriculas=Count("id")

            )

            .order_by(

                "-total_matriculas",

                "curso__area__nombre"

            )[:5]

        )





        areas_populares = []



        for area in areas_matriculadas:



            areas_populares.append({

                "id": area["curso__area_id"],

                "nombre":

                    area["curso__area__nombre"],

                "total_matriculas":

                    area["total_matriculas"]

            })





        # ====================================================

        # RESPUESTA DEL DASHBOARD

        # ====================================================



        return Response(

            {

                "resumen": {

                    "estudiantes":

                        total_estudiantes,



                    "coordinadores":

                        total_coordinadores,



                    "cursos":

                        total_cursos,



                    "matriculas":

                        total_matriculas,

                },



                "cursos_populares":

                    cursos_populares,



                "areas_populares":

                    areas_populares,

            },

            status=status.HTTP_200_OK

        )





# ============================================================

# VISTAS DE TEMPLATES

# ============================================================



def home(request):

    """

    Muestra la página principal de la plataforma.

    """



    return render(

        request,

        'home.html'

    )





def error_404(request):

    """

    Muestra una página 404 controlada para cualquier

    dirección que no corresponda a una ruta existente.

    """



    return render(

        request,

        '404.html',

        status=404

    )





def registro_page(request):

    """

    Muestra el formulario de registro para estudiantes.

    """



    return render(

        request,

        'registro.html'

    )





def login_page(request):

    """

    Muestra la página personalizada de inicio de sesión.

    """



    return render(

        request,

        'login.html'

    )





def cursos_page(request):

    """

    Muestra el catálogo público de áreas y cursos.

    """



    return render(

        request,

        'cursos.html'

    )





def coordinador_page(request):

    """

    Muestra el panel personalizado del Coordinador Académico.



    Las operaciones sensibles se protegen realmente

    mediante JWT y permisos en la API.

    """



    return render(

        request,

        'coordinador.html'

    )





def carro_page(request):

    """

    Muestra la página del carro de matrícula.



    Los datos reales del carro se obtienen posteriormente

    desde la API utilizando el JWT del estudiante.

    """



    return render(

        request,

        'carro.html'

    )





def mis_matriculas_page(request):

    """

    Muestra la página con el historial de matrículas

    del estudiante.



    Los datos se obtienen desde la API protegida mediante JWT.

    """



    return render(

        request,

        'mis_matriculas.html'

    )





def areas_page(request):

    """

    Renderiza la página pública de áreas académicas.



    Los datos se obtienen posteriormente desde la API

    mediante JavaScript.

    """

    return render(

        request,

        "areas.html"

    )





def pago_page(request, pk):

    """

    Muestra el portal de pago simulado para una matrícula.



    Los datos reales de la matrícula se obtienen desde

    la API protegida utilizando el JWT del estudiante.

    """



    return render(

        request,

        'pago.html',

        {

            'matricula_id': pk

        }

    )





# ============================================================

# EXTENSIÓN ADICIONAL - PÁGINA DEL ADMINISTRADOR

# ============================================================



def admin_plataforma_page(request):

    """

    Muestra el panel personalizado del Administrador.

    Los datos y operaciones administrativas se obtendrán

    mediante endpoints protegidos con JWT y el permiso EsAdmin.

    """



    return render(

        request,

        'admin_plataforma.html'

    )