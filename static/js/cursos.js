/*
============================================================
CATÁLOGO DE CURSOS - EDTECH
============================================================

Este archivo controla:

1. La carga pública de áreas.
2. La carga pública de cursos.
3. Los filtros mediante django-filter.
4. La búsqueda local por nombre.
5. La visualización de cursos en tarjetas.
6. El agregado de cursos al carro del estudiante.

Los visitantes pueden consultar el catálogo.
Solo los estudiantes autenticados pueden agregar cursos.
============================================================
*/


document.addEventListener(
    "DOMContentLoaded",
    async function () {

        // ====================================================
        // ELEMENTOS
        // ====================================================

        const contenedorAreas =
            document.getElementById(
                "contenedor-areas"
            );

        const contenedorCursos =
            document.getElementById(
                "contenedor-cursos"
            );

        const mensaje =
            document.getElementById(
                "mensaje-cursos"
            );

        const formularioFiltros =
            document.getElementById(
                "form-filtros"
            );

        const filtroBusqueda =
            document.getElementById(
                "filtro-busqueda"
            );

        const filtroArea =
            document.getElementById(
                "filtro-area"
            );

        const botonLimpiar =
            document.getElementById(
                "boton-limpiar-filtros"
            );


        // Cursos obtenidos desde la API.
        // Se conservan para aplicar la búsqueda local.
        let cursosActuales = [];


        // ====================================================
        // CARGAR ÁREAS
        // ====================================================

        async function cargarAreas() {

            try {

                const respuesta =
                    await fetch(
                        "/api/areas/"
                    );


                if (!respuesta.ok) {

                    throw new Error(
                        "No fue posible cargar las áreas."
                    );
                }


                const areas =
                    await respuesta.json();


                contenedorAreas.innerHTML =
                    "";


                filtroArea.innerHTML = `
                    <option value="">
                        Todas las áreas
                    </option>
                `;


                // ============================================
                // OPCIÓN TODAS LAS ÁREAS
                // ============================================

                const botonTodas =
                    document.createElement(
                        "button"
                    );

                botonTodas.type =
                    "button";

                botonTodas.className =
                    "area-lateral activa";

                botonTodas.dataset.areaId =
                    "";

                botonTodas.innerHTML = `
                    <span class="area-lateral-icono">
                        ◫
                    </span>

                    <span>
                        Todas las áreas
                    </span>
                `;


                botonTodas.addEventListener(
                    "click",
                    async function () {

                        filtroArea.value =
                            "";

                        marcarAreaActiva(
                            ""
                        );

                        ocultarMensaje();

                        await cargarCursos();
                    }
                );


                contenedorAreas.appendChild(
                    botonTodas
                );


                // ============================================
                // ÁREAS REALES DE LA API
                // ============================================

                areas.forEach(
                    function (area) {

                        const boton =
                            document.createElement(
                                "button"
                            );

                        boton.type =
                            "button";

                        boton.className =
                            "area-lateral";

                        boton.dataset.areaId =
                            String(area.id);

                        boton.innerHTML = `
                            <span class="area-lateral-icono">
                                ◇
                            </span>

                            <span>
                                ${area.nombre}
                            </span>
                        `;


                        boton.addEventListener(
                            "click",
                            async function () {

                                filtroArea.value =
                                    area.id;

                                marcarAreaActiva(
                                    String(area.id)
                                );

                                ocultarMensaje();

                                await cargarCursos();
                            }
                        );


                        contenedorAreas.appendChild(
                            boton
                        );


                        // ====================================
                        // OPCIÓN DEL SELECTOR SUPERIOR
                        // ====================================

                        const opcion =
                            document.createElement(
                                "option"
                            );

                        opcion.value =
                            area.id;

                        opcion.textContent =
                            area.nombre;

                        filtroArea.appendChild(
                            opcion
                        );
                    }
                );


                if (areas.length === 0) {

                    const aviso =
                        document.createElement(
                            "span"
                        );

                    aviso.className =
                        "text-muted small";

                    aviso.textContent =
                        "No existen áreas disponibles.";

                    contenedorAreas.appendChild(
                        aviso
                    );
                }


            } catch (error) {

                contenedorAreas.innerHTML = `
                    <span class="text-danger">
                        ${error.message}
                    </span>
                `;
            }
        }


        // ====================================================
        // MARCAR ÁREA ACTIVA
        // ====================================================

        function marcarAreaActiva(
            areaId
        ) {

            const botones =
                document.querySelectorAll(
                    ".area-lateral"
                );


            botones.forEach(
                function (boton) {

                    boton.classList.toggle(
                        "activa",
                        boton.dataset.areaId ===
                            String(areaId)
                    );
                }
            );
        }


        // ====================================================
        // CARGAR CURSOS
        // ====================================================

        async function cargarCursos() {

            contenedorCursos.innerHTML = `
                <p class="text-muted">
                    Cargando cursos...
                </p>
            `;


            try {

                /*
                El área y el costo se filtran mediante
                django-filter en el backend.
                */

                const parametros =
                    new URLSearchParams();


                // Filtro por área.

                if (filtroArea.value) {

                    parametros.append(
                        "area",
                        filtroArea.value
                    );
                }


                let url =
                    "/api/cursos/";


                const consulta =
                    parametros.toString();


                if (consulta) {

                    url +=
                        "?" +
                        consulta;
                }


                const respuesta =
                    await fetch(
                        url
                    );


                if (!respuesta.ok) {

                    throw new Error(
                        "No fue posible cargar los cursos."
                    );
                }


                cursosActuales =
                    await respuesta.json();


                aplicarBusqueda();


            } catch (error) {

                contenedorCursos.innerHTML = `
                    <div class="alert alert-danger">
                        ${error.message}
                    </div>
                `;
            }
        }


        // ====================================================
        // BÚSQUEDA LOCAL
        // ====================================================

        function aplicarBusqueda() {

            const texto =
                filtroBusqueda.value
                    .trim()
                    .toLowerCase();


            if (!texto) {

                mostrarCursos(
                    cursosActuales
                );

                return;
            }


            const cursosFiltrados =
                cursosActuales.filter(
                    function (curso) {

                        const titulo =
                            String(
                                curso.titulo || ""
                            ).toLowerCase();

                        const descripcion =
                            String(
                                curso.descripcion || ""
                            ).toLowerCase();

                        const area =
                            String(
                                curso.area_nombre || ""
                            ).toLowerCase();


                        return (
                            titulo.includes(texto) ||
                            descripcion.includes(texto) ||
                            area.includes(texto)
                        );
                    }
                );


            mostrarCursos(
                cursosFiltrados
            );
        }


        // ====================================================
        // IMAGEN DEL CURSO
        // ====================================================

        /*
        Asigna una imagen a los cursos actuales según
        el área académica a la que pertenecen.

        Si el área no tiene una imagen asignada,
        se conserva el diseño predeterminado </>.
        */

        function obtenerImagenCurso(areaNombre) {

            if (!areaNombre) {
                return null;
            }

            const areaNormalizada =
                areaNombre
                    .trim()
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "");

            const imagenes = {

                "bases de datos":
                    "/static/img/curso-bases-datos.png",

                "ciencia de datos":
                    "/static/img/curso-analisis-datos.png",

                "diseno":
                    "/static/img/curso-diseno.png",

                "programacion":
                    "/static/img/curso-programacion.png",

                "tecnologia":
                    "/static/img/curso-tecnologia.png"
            };

            return imagenes[areaNormalizada] || null;
        }


        // ====================================================
        // MOSTRAR CURSOS EN TARJETAS
        // ====================================================

        function mostrarCursos(
            cursos
        ) {

            contenedorCursos.innerHTML =
                "";


            if (cursos.length === 0) {

                contenedorCursos.innerHTML = `
                    <div class="catalogo-vacio">
                        <h3>
                            No encontramos cursos
                        </h3>

                        <p>
                            No existen cursos disponibles
                            para los filtros seleccionados.
                        </p>
                    </div>
                `;

                return;
            }


            const fila =
                document.createElement(
                    "div"
                );

            fila.className =
                "row g-4";


            cursos.forEach(
                function (curso) {

                    const imagenCurso =
                        obtenerImagenCurso(
                            curso.area_nombre
                        );

                    const columna =
                        document.createElement(
                            "div"
                        );

                    columna.className =
                        "col-xl-4 col-md-6";


                    columna.innerHTML = `

                        <article class="tarjeta-curso">

                            <!-- Franja visual -->

                            <div class="curso-visual">

                                ${
                                    imagenCurso
                                        ? `
                                            <img
                                                src="${imagenCurso}"
                                                alt="${curso.titulo}"
                                                class="curso-imagen"
                                            >
                                        `
                                        : `
                                            <span class="curso-visual-simbolo">
                                                &lt;/&gt;
                                            </span>
                                        `
                                }

                            </div>


                            <!-- Contenido -->

                            <div class="tarjeta-curso-cuerpo">

                                <span class="curso-area-etiqueta">
                                    ${curso.area_nombre}
                                </span>


                                <h3>
                                    ${curso.titulo}
                                </h3>


                                <p class="descripcion-curso">
                                    ${curso.descripcion}
                                </p>


                                <!-- Fechas -->

                                <div class="curso-fechas-compactas">

                                    <span>
                                        Inicio
                                        <strong>
                                            ${formatearFecha(
                                                curso.fecha_inicio
                                            )}
                                        </strong>
                                    </span>

                                    <span>
                                        Término
                                        <strong>
                                            ${formatearFecha(
                                                curso.fecha_termino
                                            )}
                                        </strong>
                                    </span>

                                </div>


                                <!-- Precio y cupos -->

                                <div class="curso-resumen">

                                    <div>

                                        <span>
                                            Matrícula
                                        </span>

                                        <strong class="curso-precio">
                                            $${formatearNumero(
                                                curso.costo
                                            )}
                                        </strong>

                                    </div>


                                    <div class="curso-cupos">

                                        <span>
                                            Cupos
                                        </span>

                                        <strong>
                                            ${curso.cupos_disponibles}/${curso.cupo_maximo}
                                        </strong>

                                    </div>

                                </div>

                            </div>


                            <!-- Acción -->

                            <div class="tarjeta-curso-footer">

                                <button
                                    type="button"
                                    class="btn btn-primary w-100
                                           boton-agregar-carro"
                                    data-curso-id="${curso.id}"
                                >
                                    Agregar al carro
                                </button>

                            </div>

                        </article>
                    `;


                    fila.appendChild(
                        columna
                    );
                }
            );


            contenedorCursos.appendChild(
                fila
            );


            /*
            Los botones se generan dinámicamente,
            por eso sus eventos se configuran después.
            */

            configurarBotonesCarro();
        }


        // ====================================================
        // SELECTOR SUPERIOR DE ÁREA
        // ====================================================

        filtroArea.addEventListener(
            "change",
            async function () {

                marcarAreaActiva(
                    filtroArea.value
                );

                ocultarMensaje();

                await cargarCursos();
            }
        );


        // ====================================================
        // BÚSQUEDA EN TIEMPO REAL
        // ====================================================

        filtroBusqueda.addEventListener(
            "input",
            function () {

                aplicarBusqueda();
            }
        );


        // ====================================================
        // FORMULARIO DE FILTROS
        // ====================================================

        formularioFiltros.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                ocultarMensaje();

                await cargarCursos();
            }
        );


        // ====================================================
        // LIMPIAR FILTROS
        // ====================================================

        botonLimpiar.addEventListener(
            "click",
            async function () {

                filtroArea.value =
                    "";

                filtroBusqueda.value =
                    "";

                marcarAreaActiva(
                    ""
                );

                ocultarMensaje();

                await cargarCursos();
            }
        );


        // ====================================================
        // CONFIGURAR BOTONES DEL CARRO
        // ====================================================

        function configurarBotonesCarro() {

            const botones =
                document.querySelectorAll(
                    ".boton-agregar-carro"
                );


            botones.forEach(
                function (boton) {

                    boton.addEventListener(
                        "click",
                        async function () {

                            const token =
                                localStorage.getItem(
                                    "accessToken"
                                );

                            const rol =
                                localStorage.getItem(
                                    "rol"
                                );


                            // Visitante sin autenticación.

                            if (!token) {

                                window.location.href =
                                    "/login/";

                                return;
                            }


                            // Solo estudiantes usan el carro.

                            if (
                                rol !== "ESTUDIANTE"
                            ) {

                                mostrarMensaje(
                                    "El carro de matrícula " +
                                    "está disponible solo " +
                                    "para estudiantes.",
                                    "danger"
                                );

                                return;
                            }


                            await agregarAlCarro(
                                boton.dataset.cursoId
                            );
                        }
                    );
                }
            );
        }


        // ====================================================
        // AGREGAR CURSO AL CARRO
        // ====================================================

        async function agregarAlCarro(
            cursoId
        ) {

            const token =
                localStorage.getItem(
                    "accessToken"
                );


            try {

                const respuesta =
                    await fetch(
                        "/api/carro-matricula/",
                        {
                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    "Bearer " +
                                    token
                            },

                            body:
                                JSON.stringify(
                                    {
                                        curso:
                                            Number(
                                                cursoId
                                            )
                                    }
                                )
                        }
                    );


                const resultado =
                    await respuesta.json();


                if (!respuesta.ok) {

                    throw new Error(
                        obtenerMensajeError(
                            resultado
                        )
                    );
                }


                mostrarMensaje(
                    "Curso agregado al carro correctamente.",
                    "success"
                );


            } catch (error) {

                mostrarMensaje(
                    error.message,
                    "danger"
                );
            }
        }


        // ====================================================
        // MENSAJES
        // ====================================================

        function mostrarMensaje(
            texto,
            tipo
        ) {

            mensaje.className =
                "alert alert-" +
                tipo +
                " mb-4";

            mensaje.textContent =
                texto;


            mensaje.scrollIntoView({
                behavior:
                    "smooth",

                block:
                    "center"
            });
        }


        function ocultarMensaje() {

            mensaje.className =
                "d-none";

            mensaje.textContent =
                "";
        }


        // ====================================================
        // OBTENER MENSAJE DE ERROR
        // ====================================================

        function obtenerMensajeError(
            resultado
        ) {

            if (
                resultado &&
                resultado.detail
            ) {

                return resultado.detail;
            }


            if (
                resultado &&
                typeof resultado === "object"
            ) {

                const campos =
                    Object.keys(
                        resultado
                    );


                if (campos.length > 0) {

                    const error =
                        resultado[
                            campos[0]
                        ];


                    if (
                        Array.isArray(
                            error
                        )
                    ) {

                        return error[0];
                    }


                    return String(
                        error
                    );
                }
            }


            return (
                "No fue posible agregar " +
                "el curso al carro."
            );
        }


        // ====================================================
        // FORMATO DE NÚMEROS
        // ====================================================

        function formatearNumero(
            numero
        ) {

            return Number(
                numero
            ).toLocaleString(
                "es-CL"
            );
        }


        // ====================================================
        // FORMATO DE FECHAS
        // ====================================================

        function formatearFecha(
            fecha
        ) {

            if (!fecha) {

                return "-";
            }


            const partes =
                fecha.split("-");


            return (
                partes[2] +
                "/" +
                partes[1] +
                "/" +
                partes[0]
            );
        }


        // ====================================================
        // APLICAR ÁREA RECIBIDA DESDE LA URL
        // ====================================================

        function aplicarAreaDesdeURL() {

            /*
            Permite ingresar al catálogo desde la página
            de áreas utilizando una URL como:

            /cursos/?area=1
            */

            const parametrosURL =
                new URLSearchParams(
                    window.location.search
                );


            const areaId =
                parametrosURL.get(
                    "area"
                );


            // Si no existe un área en la URL,
            // se mantiene el catálogo completo.

            if (!areaId) {

                return;
            }


            /*
            Comprobamos que el área recibida exista realmente
            entre las opciones cargadas desde la API.
            */

            const opcionExiste =
                Array.from(
                    filtroArea.options
                ).some(
                    function (opcion) {

                        return (
                            opcion.value ===
                            String(areaId)
                        );
                    }
                );


            if (!opcionExiste) {

                return;
            }


            // Sincronizamos el selector superior.

            filtroArea.value =
                areaId;


            // Sincronizamos el panel lateral.

            marcarAreaActiva(
                areaId
            );
        }


        // ====================================================
        // CARGA INICIAL
        // ====================================================

        /*
        Primero cargamos las áreas para construir el selector
        y el panel lateral.
        */

        await cargarAreas();


        /*
        Si el usuario llegó desde la página de Áreas,
        aplicamos automáticamente el filtro recibido por URL.
        */

        aplicarAreaDesdeURL();


        /*
        Finalmente cargamos los cursos utilizando el área
        seleccionada.
        */

        await cargarCursos();
    }
);