/*
============================================================
ÁREAS ACADÉMICAS - EDTECH
============================================================

Este archivo controla:

1. La carga de áreas desde la API.
2. La carga de cursos públicos.
3. El cálculo de cursos disponibles por cada área.
4. La búsqueda local de áreas.
5. La navegación al catálogo filtrado por área.

Toda la información mostrada proviene del backend.
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
                "contenedor-areas-pagina"
            );

        const buscarArea =
            document.getElementById(
                "buscar-area"
            );

        const mensajeAreas =
            document.getElementById(
                "mensaje-areas"
            );


        // ====================================================
        // DATOS
        // ====================================================

        let areas = [];
        let cursos = [];


        // ====================================================
        // MOSTRAR MENSAJE
        // ====================================================

        function mostrarMensaje(
            texto,
            tipo = "danger"
        ) {

            mensajeAreas.textContent =
                texto;

            mensajeAreas.className =
                `alert alert-${tipo}`;
        }


        // ====================================================
        // OCULTAR MENSAJE
        // ====================================================

        function ocultarMensaje() {

            mensajeAreas.textContent =
                "";

            mensajeAreas.className =
                "alert d-none";
        }


        // ====================================================
        // ESCAPAR TEXTO
        // ====================================================

        function escaparHTML(texto) {

            const elemento =
                document.createElement(
                    "div"
                );

            elemento.textContent =
                texto ?? "";

            return elemento.innerHTML;
        }


        // ====================================================
        // OBTENER LISTA DESDE LA API
        // ====================================================

        /*
        Esta función permite trabajar tanto con una respuesta
        directa en formato lista como con una respuesta
        paginada de Django REST Framework.
        */

        function obtenerLista(datos) {

            if (Array.isArray(datos)) {

                return datos;
            }


            if (
                datos &&
                Array.isArray(datos.results)
            ) {

                return datos.results;
            }


            return [];
        }


        // ====================================================
        // CARGAR DATOS
        // ====================================================

        async function cargarDatos() {

            ocultarMensaje();


            try {

                /*
                Áreas y cursos son públicos, por lo que
                no se necesita JWT para consultarlos.
                */

                const [
                    respuestaAreas,
                    respuestaCursos
                ] = await Promise.all([
                    fetch("/api/areas/"),
                    fetch("/api/cursos/")
                ]);


                if (
                    !respuestaAreas.ok ||
                    !respuestaCursos.ok
                ) {

                    throw new Error(
                        "No fue posible cargar la información."
                    );
                }


                const datosAreas =
                    await respuestaAreas.json();

                const datosCursos =
                    await respuestaCursos.json();


                areas =
                    obtenerLista(
                        datosAreas
                    );

                cursos =
                    obtenerLista(
                        datosCursos
                    );


                renderizarAreas(
                    areas
                );


            } catch (error) {

                contenedorAreas.innerHTML =
                    "";

                mostrarMensaje(
                    "No fue posible cargar las áreas en este momento."
                );
            }
        }


        // ====================================================
        // CONTAR CURSOS POR ÁREA
        // ====================================================

        function contarCursosArea(
            areaId
        ) {

            return cursos.filter(
                function (curso) {

                    /*
                    La comparación se realiza como texto para
                    evitar diferencias entre valores numéricos
                    y valores recibidos como cadena.
                    */

                    return (
                        String(curso.area) ===
                        String(areaId)
                    );
                }
            ).length;
        }


        // ====================================================
        // IMAGEN DEL ÁREA
        // ====================================================

        /*
        Asigna una imagen según el nombre del área.

        Si se crea una nueva área que no tiene una imagen
        asignada, retorna null y se utiliza automáticamente
        el diseño predeterminado de la tarjeta.
        */

        function obtenerImagenArea(nombre) {

            if (!nombre) {
                return null;
            }

            const nombreNormalizado =
                nombre
                    .trim()
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "");

            const imagenes = {
                "bases de datos":
                    "/static/img/area-bases-datos.png",

                "ciencia de datos":
                    "/static/img/area-ciencia-datos.png",

                "diseno":
                    "/static/img/area-diseno.png",

                "programacion":
                    "/static/img/area-programacion.png",

                "tecnologia":
                    "/static/img/area-tecnologia.png"
            };

            return imagenes[nombreNormalizado] || null;
        }


        // ====================================================
        // RENDERIZAR ÁREAS
        // ====================================================

        function renderizarAreas(
            listaAreas
        ) {

            contenedorAreas.innerHTML =
                "";


            // Sin resultados.

            if (
                listaAreas.length === 0
            ) {

                contenedorAreas.innerHTML = `
                    <div class="areas-vacias">
                        <h3>
                            No se encontraron áreas
                        </h3>

                        <p>
                            Intenta realizar otra búsqueda.
                        </p>
                    </div>
                `;

                return;
            }


            listaAreas.forEach(
                function (area) {

                    const imagenArea =
                        obtenerImagenArea(
                            area.nombre
                        );

                    const cantidadCursos =
                        contarCursosArea(
                            area.id
                        );


                    const textoCursos =
                        cantidadCursos === 1
                            ? "1 curso disponible"
                            : `${cantidadCursos} cursos disponibles`;


                    const tarjeta =
                        document.createElement(
                            "article"
                        );


                    tarjeta.className =
                        "tarjeta-area";


                    tarjeta.innerHTML = `

                        <div class="tarjeta-area-superior">

                            ${
                                imagenArea
                                    ? `
                                        <div class="area-imagen-contenedor">
                                            <img
                                                src="${imagenArea}"
                                                alt="${escaparHTML(area.nombre)}"
                                                class="area-imagen"
                                            >
                                        </div>
                                    `
                                    : `
                                        <div class="area-icono">
                                            ${obtenerInicial(area.nombre)}
                                        </div>
                                    `
                            }

                            <span class="area-cantidad">
                                ${textoCursos}
                            </span>

                        </div>


                        <div class="tarjeta-area-contenido">

                            <span class="area-etiqueta">
                                ÁREA ACADÉMICA
                            </span>

                            <h3>
                                ${escaparHTML(area.nombre)}
                            </h3>

                            <p>
                                ${obtenerDescripcion(area.descripcion)}
                            </p>

                        </div>


                        <div class="tarjeta-area-footer">

                            <a
                                href="/cursos/?area=${encodeURIComponent(area.id)}"
                                class="enlace-area"
                            >
                                Explorar cursos
                                <span aria-hidden="true">
                                    →
                                </span>
                            </a>

                        </div>
                    `;


                    contenedorAreas.appendChild(
                        tarjeta
                    );
                }
            );
        }


        // ====================================================
        // INICIAL DEL ÁREA
        // ====================================================

        function obtenerInicial(
            nombre
        ) {

            if (!nombre) {

                return "A";
            }


            return escaparHTML(
                nombre
                    .trim()
                    .charAt(0)
                    .toUpperCase()
            );
        }


        // ====================================================
        // DESCRIPCIÓN DEL ÁREA
        // ====================================================

        function obtenerDescripcion(
            descripcion
        ) {

            if (
                !descripcion ||
                descripcion.trim() === ""
            ) {

                return (
                    "Área académica disponible " +
                    "en la plataforma."
                );
            }


            return escaparHTML(
                descripcion
            );
        }


        // ====================================================
        // BUSCAR ÁREAS
        // ====================================================

        function filtrarAreas() {

            const busqueda =
                buscarArea.value
                    .trim()
                    .toLowerCase();


            if (!busqueda) {

                renderizarAreas(
                    areas
                );

                return;
            }


            const resultados =
                areas.filter(
                    function (area) {

                        const nombre =
                            (
                                area.nombre ||
                                ""
                            ).toLowerCase();


                        const descripcion =
                            (
                                area.descripcion ||
                                ""
                            ).toLowerCase();


                        return (
                            nombre.includes(
                                busqueda
                            ) ||
                            descripcion.includes(
                                busqueda
                            )
                        );
                    }
                );


            renderizarAreas(
                resultados
            );
        }


        // ====================================================
        // EVENTO DE BÚSQUEDA
        // ====================================================

        buscarArea.addEventListener(
            "input",
            filtrarAreas
        );


        // ====================================================
        // CARGA INICIAL
        // ====================================================

        await cargarDatos();
    }
);