/*
============================================================
PANEL DEL COORDINADOR - EDTECH
============================================================

Este archivo controla:

1. La validación básica de la sesión del Coordinador.
2. La navegación entre las secciones del panel.
3. El CRUD de Áreas.
4. El CRUD de Cursos.
5. La gestión de Matrículas.
6. La eliminación lógica de Áreas y Cursos.
7. El cambio de estado de las Matrículas.

La autorización real de las operaciones se realiza
en el backend mediante JWT y permisos.
============================================================
*/


document.addEventListener(
    "DOMContentLoaded",
    async function () {

        // ====================================================
        // AUTENTICACIÓN
        // ====================================================

        const accessToken =
            localStorage.getItem("accessToken");

        const rol =
            localStorage.getItem("rol");


        // Si no existe sesión, volver al login.
        if (!accessToken) {

            window.location.href =
                "/login/";

            return;
        }


        // Solo los coordinadores pueden utilizar este panel.
        if (rol !== "COORDINADOR") {

            window.location.href =
                "/";

            return;
        }


        // ====================================================
        // ELEMENTOS GENERALES
        // ====================================================

        const mensaje =
            document.getElementById(
                "mensaje-coordinador"
            );


        // ====================================================
        // ELEMENTOS DE LAS PESTAÑAS
        // ====================================================

        const tabAreas =
            document.getElementById(
                "tab-areas"
            );

        const tabCursos =
            document.getElementById(
                "tab-cursos"
            );

        const tabMatriculas =
            document.getElementById(
                "tab-matriculas"
            );


        const seccionAreas =
            document.getElementById(
                "seccion-areas"
            );

        const seccionCursos =
            document.getElementById(
                "seccion-cursos"
            );

        const seccionMatriculas =
            document.getElementById(
                "seccion-matriculas"
            );


        // ====================================================
        // ELEMENTOS DE ÁREAS
        // ====================================================

        const formulario =
            document.getElementById(
                "form-area"
            );

        const areaId =
            document.getElementById(
                "area-id"
            );

        const areaNombre =
            document.getElementById(
                "area-nombre"
            );

        const areaDescripcion =
            document.getElementById(
                "area-descripcion"
            );

        const tituloFormulario =
            document.getElementById(
                "titulo-formulario-area"
            );

        const botonGuardar =
            document.getElementById(
                "boton-guardar-area"
            );

        const botonCancelar =
            document.getElementById(
                "boton-cancelar-area"
            );

        const tablaAreas =
            document.getElementById(
                "tabla-areas"
            );


        // ====================================================
        // ELEMENTOS DE CURSOS
        // ====================================================

        const formularioCurso =
            document.getElementById(
                "form-curso"
            );

        const cursoId =
            document.getElementById(
                "curso-id"
            );

        const cursoArea =
            document.getElementById(
                "curso-area"
            );

        const cursoTitulo =
            document.getElementById(
                "curso-titulo"
            );

        const cursoDescripcion =
            document.getElementById(
                "curso-descripcion"
            );

        const cursoCosto =
            document.getElementById(
                "curso-costo"
            );

        const cursoFechaInicio =
            document.getElementById(
                "curso-fecha-inicio"
            );

        const cursoFechaTermino =
            document.getElementById(
                "curso-fecha-termino"
            );

        const cursoCupoMaximo =
            document.getElementById(
                "curso-cupo-maximo"
            );

        const cursoCupos =
            document.getElementById(
                "curso-cupos"
            );

        const tituloFormularioCurso =
            document.getElementById(
                "titulo-formulario-curso"
            );

        const botonGuardarCurso =
            document.getElementById(
                "boton-guardar-curso"
            );

        const botonCancelarCurso =
            document.getElementById(
                "boton-cancelar-curso"
            );

        const tablaCursos =
            document.getElementById(
                "tabla-cursos"
            );


        // ====================================================
        // ELEMENTOS DE MATRÍCULAS
        // ====================================================

        const tablaMatriculas =
            document.getElementById(
                "tabla-matriculas"
            );

        const totalMatriculas =
            document.getElementById(
                "total-matriculas"
            );

        const totalPendientes =
            document.getElementById(
                "total-pendientes"
            );

        const totalPagadas =
            document.getElementById(
                "total-pagadas"
            );


        // ====================================================
        // NAVEGACIÓN ENTRE PESTAÑAS
        // ====================================================

        // ÁREAS
        tabAreas.addEventListener(
            "click",
            function () {

                seccionAreas.classList.remove(
                    "d-none"
                );

                seccionCursos.classList.add(
                    "d-none"
                );

                seccionMatriculas.classList.add(
                    "d-none"
                );


                // Mantiene el estilo vertical del menú lateral.
                tabAreas.className =
                    "btn btn-primary coordinador-menu-item";

                tabCursos.className =
                    "btn btn-outline-edtech coordinador-menu-item";

                tabMatriculas.className =
                    "btn btn-outline-edtech coordinador-menu-item";


                ocultarMensaje();
            }
        );


        // CURSOS
        tabCursos.addEventListener(
            "click",
            async function () {

                seccionAreas.classList.add(
                    "d-none"
                );

                seccionCursos.classList.remove(
                    "d-none"
                );

                seccionMatriculas.classList.add(
                    "d-none"
                );


                // Mantiene el estilo vertical del menú lateral.
                tabAreas.className =
                    "btn btn-outline-edtech coordinador-menu-item";

                tabCursos.className =
                    "btn btn-primary coordinador-menu-item";

                tabMatriculas.className =
                    "btn btn-outline-edtech coordinador-menu-item";


                ocultarMensaje();

                await cargarCursos();
            }
        );


        // MATRÍCULAS
        tabMatriculas.addEventListener(
            "click",
            async function () {

                seccionAreas.classList.add(
                    "d-none"
                );

                seccionCursos.classList.add(
                    "d-none"
                );

                seccionMatriculas.classList.remove(
                    "d-none"
                );


                // Mantiene el estilo vertical del menú lateral.
                tabAreas.className =
                    "btn btn-outline-edtech coordinador-menu-item";

                tabCursos.className =
                    "btn btn-outline-edtech coordinador-menu-item";

                tabMatriculas.className =
                    "btn btn-primary coordinador-menu-item";


                ocultarMensaje();

                await cargarMatriculas();
            }
        );


        // ====================================================
        // CARGAR ÁREAS
        // ====================================================

        async function cargarAreas() {

            tablaAreas.innerHTML = `
                <tr>
                    <td
                        colspan="3"
                        class="text-muted"
                    >
                        Cargando áreas...
                    </td>
                </tr>
            `;


            try {

                /*
                El listado de áreas es público según los
                requisitos del proyecto.
                */

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


                mostrarAreas(
                    areas
                );


            } catch (error) {

                tablaAreas.innerHTML = `
                    <tr>
                        <td
                            colspan="3"
                            class="text-danger"
                        >
                            ${error.message}
                        </td>
                    </tr>
                `;
            }
        }


        // ====================================================
        // MOSTRAR ÁREAS
        // ====================================================

        function mostrarAreas(areas) {

            tablaAreas.innerHTML =
                "";


            if (areas.length === 0) {

                tablaAreas.innerHTML = `
                    <tr>
                        <td
                            colspan="3"
                            class="text-muted"
                        >
                            No existen áreas registradas.
                        </td>
                    </tr>
                `;

                return;
            }


            areas.forEach(
                function (area) {

                    const fila =
                        document.createElement(
                            "tr"
                        );


                    // Nombre.
                    const nombre =
                        document.createElement(
                            "td"
                        );

                    nombre.textContent =
                        area.nombre;


                    // Descripción.
                    const descripcion =
                        document.createElement(
                            "td"
                        );

                    descripcion.textContent =
                        area.descripcion || "-";


                    // Acciones.
                    const acciones =
                        document.createElement(
                            "td"
                        );

                    acciones.className =
                        "text-end acciones-tabla";


                    // ========================================
                    // EDITAR ÁREA
                    // ========================================

                    const botonEditar =
                        document.createElement(
                            "button"
                        );

                    botonEditar.type =
                        "button";

                    botonEditar.className =
                        "btn btn-sm " +
                        "btn-outline-edtech me-2";

                    botonEditar.textContent =
                        "Editar";


                    botonEditar.addEventListener(
                        "click",
                        function () {

                            prepararEdicion(
                                area
                            );
                        }
                    );


                    // ========================================
                    // ELIMINAR ÁREA
                    // ========================================

                    const botonEliminar =
                        document.createElement(
                            "button"
                        );

                    botonEliminar.type =
                        "button";

                    botonEliminar.className =
                        "btn btn-sm " +
                        "btn-outline-danger";

                    botonEliminar.textContent =
                        "Eliminar";


                    botonEliminar.addEventListener(
                        "click",
                        function () {

                            eliminarArea(
                                area.id,
                                area.nombre
                            );
                        }
                    );


                    acciones.appendChild(
                        botonEditar
                    );

                    acciones.appendChild(
                        botonEliminar
                    );


                    fila.appendChild(
                        nombre
                    );

                    fila.appendChild(
                        descripcion
                    );

                    fila.appendChild(
                        acciones
                    );


                    tablaAreas.appendChild(
                        fila
                    );
                }
            );
        }


        // ====================================================
        // CREAR O EDITAR ÁREA
        // ====================================================

        formulario.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const id =
                    areaId.value;


                const datos = {

                    nombre:
                        areaNombre.value.trim(),

                    descripcion:
                        areaDescripcion.value.trim()
                };


                let url =
                    "/api/areas/gestionar/";

                let metodo =
                    "POST";


                // Si existe ID, estamos editando.
                if (id) {

                    url =
                        "/api/areas/" +
                        id +
                        "/";

                    metodo =
                        "PUT";
                }


                botonGuardar.disabled =
                    true;

                botonGuardar.textContent =
                    "Guardando...";


                try {

                    const respuesta =
                        await fetch(
                            url,
                            {
                                method:
                                    metodo,

                                headers: {

                                    "Content-Type":
                                        "application/json",

                                    "Authorization":
                                        "Bearer " +
                                        accessToken
                                },

                                body:
                                    JSON.stringify(
                                        datos
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
                        id
                            ? "Área actualizada correctamente."
                            : "Área creada correctamente.",
                        "success"
                    );


                    limpiarFormulario();

                    await cargarAreas();

                    /*
                    Actualizamos también el selector de cursos
                    por si se creó una nueva área.
                    */

                    await cargarAreasCurso();


                } catch (error) {

                    mostrarMensaje(
                        error.message,
                        "danger"
                    );


                } finally {

                    botonGuardar.disabled =
                        false;

                    botonGuardar.textContent =
                        areaId.value
                            ? "Actualizar Área"
                            : "Guardar Área";
                }
            }
        );


        // ====================================================
        // PREPARAR EDICIÓN DE ÁREA
        // ====================================================

        function prepararEdicion(area) {

            areaId.value =
                area.id;

            areaNombre.value =
                area.nombre;

            areaDescripcion.value =
                area.descripcion || "";


            tituloFormulario.textContent =
                "Editar Área";

            botonGuardar.textContent =
                "Actualizar Área";

            botonCancelar.classList.remove(
                "d-none"
            );


            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }


        // ====================================================
        // CANCELAR EDICIÓN DE ÁREA
        // ====================================================

        botonCancelar.addEventListener(
            "click",
            function () {

                limpiarFormulario();
            }
        );


        function limpiarFormulario() {

            formulario.reset();

            areaId.value =
                "";

            tituloFormulario.textContent =
                "Nueva Área";

            botonGuardar.textContent =
                "Guardar Área";

            botonCancelar.classList.add(
                "d-none"
            );
        }


        // ====================================================
        // ELIMINACIÓN LÓGICA DE ÁREA
        // ====================================================

        async function eliminarArea(
            id,
            nombre
        ) {

            const confirmar =
                window.confirm(
                    "¿Deseas inactivar el área \"" +
                    nombre +
                    "\"?"
                );


            if (!confirmar) {
                return;
            }


            try {

                const respuesta =
                    await fetch(
                        "/api/areas/" +
                        id +
                        "/",
                        {
                            method:
                                "DELETE",

                            headers: {

                                "Authorization":
                                    "Bearer " +
                                    accessToken
                            }
                        }
                    );


                let resultado = {};


                if (
                    respuesta.status !== 204
                ) {

                    resultado =
                        await respuesta.json();
                }


                if (!respuesta.ok) {

                    throw new Error(
                        obtenerMensajeError(
                            resultado
                        )
                    );
                }


                mostrarMensaje(
                    "Área inactivada correctamente.",
                    "success"
                );


                limpiarFormulario();

                await cargarAreas();

                await cargarAreasCurso();


            } catch (error) {

                mostrarMensaje(
                    error.message,
                    "danger"
                );
            }
        }


        // ====================================================
        // CARGAR ÁREAS EN SELECTOR DE CURSOS
        // ====================================================

        async function cargarAreasCurso() {

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


                cursoArea.innerHTML = `
                    <option value="">
                        Selecciona un área
                    </option>
                `;


                areas.forEach(
                    function (area) {

                        const opcion =
                            document.createElement(
                                "option"
                            );

                        opcion.value =
                            area.id;

                        opcion.textContent =
                            area.nombre;


                        cursoArea.appendChild(
                            opcion
                        );
                    }
                );


            } catch (error) {

                mostrarMensaje(
                    error.message,
                    "danger"
                );
            }
        }


        // ====================================================
        // CARGAR CURSOS
        // ====================================================

        async function cargarCursos() {

            tablaCursos.innerHTML = `
                <tr>
                    <td
                        colspan="5"
                        class="text-muted"
                    >
                        Cargando cursos...
                    </td>
                </tr>
            `;


            try {

                /*
                El catálogo de cursos es público.
                */

                const respuesta =
                    await fetch(
                        "/api/cursos/"
                    );


                if (!respuesta.ok) {

                    throw new Error(
                        "No fue posible cargar los cursos."
                    );
                }


                const cursos =
                    await respuesta.json();


                mostrarCursos(
                    cursos
                );


            } catch (error) {

                tablaCursos.innerHTML = `
                    <tr>
                        <td
                            colspan="5"
                            class="text-danger"
                        >
                            ${error.message}
                        </td>
                    </tr>
                `;
            }
        }


        // ====================================================
        // MOSTRAR CURSOS
        // ====================================================

        function mostrarCursos(cursos) {

            tablaCursos.innerHTML =
                "";


            if (cursos.length === 0) {

                tablaCursos.innerHTML = `
                    <tr>
                        <td
                            colspan="5"
                            class="text-muted"
                        >
                            No existen cursos registrados.
                        </td>
                    </tr>
                `;

                return;
            }


            cursos.forEach(
                function (curso) {

                    const fila =
                        document.createElement(
                            "tr"
                        );


                    // Curso.
                    const titulo =
                        document.createElement(
                            "td"
                        );

                    titulo.textContent =
                        curso.titulo;


                    // Área.
                    const area =
                        document.createElement(
                            "td"
                        );

                    area.textContent =
                        curso.area_nombre;


                    // Costo.
                    const costo =
                        document.createElement(
                            "td"
                        );

                    costo.textContent =
                        "$" +
                        Number(
                            curso.costo
                        ).toLocaleString(
                            "es-CL"
                        );


                    // Cupos.
                    const cupos =
                        document.createElement(
                            "td"
                        );

                    cupos.textContent =
                        curso.cupos_disponibles +
                        " disponibles de " +
                        curso.cupo_maximo;


                    // Acciones.
                    const acciones =
                        document.createElement(
                            "td"
                        );

                    acciones.className =
                        "text-end acciones-tabla";


                    // ========================================
                    // EDITAR CURSO
                    // ========================================

                    const botonEditar =
                        document.createElement(
                            "button"
                        );

                    botonEditar.type =
                        "button";

                    botonEditar.className =
                        "btn btn-sm " +
                        "btn-outline-edtech me-2";

                    botonEditar.textContent =
                        "Editar";


                    botonEditar.addEventListener(
                        "click",
                        function () {

                            prepararEdicionCurso(
                                curso
                            );
                        }
                    );


                    // ========================================
                    // ELIMINAR CURSO
                    // ========================================

                    const botonEliminar =
                        document.createElement(
                            "button"
                        );

                    botonEliminar.type =
                        "button";

                    botonEliminar.className =
                        "btn btn-sm " +
                        "btn-outline-danger";

                    botonEliminar.textContent =
                        "Eliminar";


                    botonEliminar.addEventListener(
                        "click",
                        function () {

                            eliminarCurso(
                                curso.id,
                                curso.titulo
                            );
                        }
                    );


                    acciones.appendChild(
                        botonEditar
                    );

                    acciones.appendChild(
                        botonEliminar
                    );


                    fila.appendChild(
                        titulo
                    );

                    fila.appendChild(
                        area
                    );

                    fila.appendChild(
                        costo
                    );

                    fila.appendChild(
                        cupos
                    );

                    fila.appendChild(
                        acciones
                    );


                    tablaCursos.appendChild(
                        fila
                    );
                }
            );
        }


        // ====================================================
        // CREAR O EDITAR CURSO
        // ====================================================

        formularioCurso.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const id =
                    cursoId.value;


                const datos = {

                    area:
                        Number(
                            cursoArea.value
                        ),

                    titulo:
                        cursoTitulo.value.trim(),

                    descripcion:
                        cursoDescripcion.value.trim(),

                    costo:
                        cursoCosto.value,

                    fecha_inicio:
                        cursoFechaInicio.value,

                    fecha_termino:
                        cursoFechaTermino.value,

                    cupo_maximo:
                        Number(
                            cursoCupoMaximo.value
                        ),

                    cupos_disponibles:
                        Number(
                            cursoCupos.value
                        )
                };


                let url =
                    "/api/cursos/";

                let metodo =
                    "POST";


                // Si existe ID, estamos editando.
                if (id) {

                    url =
                        "/api/cursos/" +
                        id +
                        "/";

                    metodo =
                        "PUT";
                }


                botonGuardarCurso.disabled =
                    true;

                botonGuardarCurso.textContent =
                    "Guardando...";


                try {

                    const respuesta =
                        await fetch(
                            url,
                            {
                                method:
                                    metodo,

                                headers: {

                                    "Content-Type":
                                        "application/json",

                                    "Authorization":
                                        "Bearer " +
                                        accessToken
                                },

                                body:
                                    JSON.stringify(
                                        datos
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
                        id
                            ? "Curso actualizado correctamente."
                            : "Curso creado correctamente.",
                        "success"
                    );


                    limpiarFormularioCurso();

                    await cargarCursos();


                } catch (error) {

                    mostrarMensaje(
                        error.message,
                        "danger"
                    );


                } finally {

                    botonGuardarCurso.disabled =
                        false;

                    botonGuardarCurso.textContent =
                        cursoId.value
                            ? "Actualizar Curso"
                            : "Guardar Curso";
                }
            }
        );


        // ====================================================
        // PREPARAR EDICIÓN DE CURSO
        // ====================================================

        function prepararEdicionCurso(
            curso
        ) {

            cursoId.value =
                curso.id;

            cursoArea.value =
                curso.area;

            cursoTitulo.value =
                curso.titulo;

            cursoDescripcion.value =
                curso.descripcion;

            cursoCosto.value =
                curso.costo;

            cursoFechaInicio.value =
                curso.fecha_inicio;

            cursoFechaTermino.value =
                curso.fecha_termino;

            cursoCupoMaximo.value =
                curso.cupo_maximo;

            cursoCupos.value =
                curso.cupos_disponibles;


            tituloFormularioCurso.textContent =
                "Editar Curso";

            botonGuardarCurso.textContent =
                "Actualizar Curso";

            botonCancelarCurso.classList.remove(
                "d-none"
            );


            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }


        // ====================================================
        // CANCELAR EDICIÓN DE CURSO
        // ====================================================

        botonCancelarCurso.addEventListener(
            "click",
            function () {

                limpiarFormularioCurso();
            }
        );


        function limpiarFormularioCurso() {

            formularioCurso.reset();

            cursoId.value =
                "";

            tituloFormularioCurso.textContent =
                "Nuevo Curso";

            botonGuardarCurso.textContent =
                "Guardar Curso";

            botonCancelarCurso.classList.add(
                "d-none"
            );
        }


        // ====================================================
        // ELIMINACIÓN LÓGICA DE CURSO
        // ====================================================

        async function eliminarCurso(
            id,
            titulo
        ) {

            const confirmar =
                window.confirm(
                    "¿Deseas inactivar el curso \"" +
                    titulo +
                    "\"?"
                );


            if (!confirmar) {
                return;
            }


            try {

                const respuesta =
                    await fetch(
                        "/api/cursos/" +
                        id +
                        "/",
                        {
                            method:
                                "DELETE",

                            headers: {

                                "Authorization":
                                    "Bearer " +
                                    accessToken
                            }
                        }
                    );


                let resultado = {};


                if (
                    respuesta.status !== 204
                ) {

                    resultado =
                        await respuesta.json();
                }


                if (!respuesta.ok) {

                    throw new Error(
                        obtenerMensajeError(
                            resultado
                        )
                    );
                }


                mostrarMensaje(
                    "Curso inactivado correctamente.",
                    "success"
                );


                limpiarFormularioCurso();

                await cargarCursos();


            } catch (error) {

                mostrarMensaje(
                    error.message,
                    "danger"
                );
            }
        }


        // ====================================================
        // CARGAR MATRÍCULAS
        // ====================================================

        async function cargarMatriculas() {

            tablaMatriculas.innerHTML = `
                <tr>
                    <td
                        colspan="7"
                        class="text-muted"
                    >
                        Cargando matrículas...
                    </td>
                </tr>
            `;

            try {

                const respuesta =
                    await fetch(
                        "/api/matriculas/",
                        {
                            method: "GET",

                            headers: {
                                "Authorization":
                                    "Bearer " +
                                    accessToken
                            }
                        }
                    );


                if (
                    respuesta.status === 401 ||
                    respuesta.status === 403
                ) {

                    cerrarSesion();

                    return;
                }


                const matriculas =
                    await respuesta.json();


                if (!respuesta.ok) {

                    throw new Error(
                        obtenerMensajeError(
                            matriculas
                        )
                    );
                }


                mostrarMatriculas(
                    matriculas
                );


            } catch (error) {

                tablaMatriculas.innerHTML = `
                    <tr>
                        <td
                            colspan="7"
                            class="text-danger"
                        >
                            ${escaparHTML(
                                error.message
                            )}
                        </td>
                    </tr>
                `;
            }
        }


        // ====================================================
        // MOSTRAR MATRÍCULAS
        // ====================================================

        function mostrarMatriculas(
            matriculas
        ) {

            tablaMatriculas.innerHTML =
                "";


            // ------------------------------------------------
            // RESUMEN
            // ------------------------------------------------

            totalMatriculas.textContent =
                matriculas.length;


            totalPendientes.textContent =
                matriculas.filter(
                    function (matricula) {

                        return (
                            matricula.estado ===
                            "PENDIENTE"
                        );
                    }
                ).length;


            totalPagadas.textContent =
                matriculas.filter(
                    function (matricula) {

                        return (
                            matricula.estado ===
                            "PAGADO"
                        );
                    }
                ).length;


            // ------------------------------------------------
            // SIN MATRÍCULAS
            // ------------------------------------------------

            if (matriculas.length === 0) {

                tablaMatriculas.innerHTML = `
                    <tr>
                        <td
                            colspan="7"
                            class="text-muted"
                        >
                            No existen matrículas registradas.
                        </td>
                    </tr>
                `;

                return;
            }


            // ------------------------------------------------
            // CREAR FILAS
            // ------------------------------------------------

            matriculas.forEach(
                function (matricula) {

                    const fila =
                        document.createElement(
                            "tr"
                        );


                    // =========================================
                    // NÚMERO
                    // =========================================

                    const numero =
                        document.createElement(
                            "td"
                        );

                    const numeroTexto =
                        document.createElement(
                            "strong"
                        );

                    numeroTexto.textContent =
                        "#" + matricula.id;

                    numero.appendChild(
                        numeroTexto
                    );


                    // =========================================
                    // ESTUDIANTE
                    // =========================================

                    const estudiante =
                        document.createElement(
                            "td"
                        );

                    estudiante.textContent =
                        matricula.estudiante;


                    // =========================================
                    // CURSOS
                    // =========================================

                    const cursos =
                        document.createElement(
                            "td"
                        );

                    cursos.textContent =
                        matricula.detalles
                            .map(
                                function (detalle) {

                                    return (
                                        detalle.curso_titulo
                                    );
                                }
                            )
                            .join(", ");


                    // =========================================
                    // TOTAL
                    // =========================================

                    const total =
                        document.createElement(
                            "td"
                        );

                    total.textContent =
                        "$" +
                        Number(
                            matricula.total
                        ).toLocaleString(
                            "es-CL"
                        );


                    // =========================================
                    // ESTADO DE MATRÍCULA
                    // =========================================

                    const estadoMatricula =
                        document.createElement(
                            "td"
                        );

                    const badgeMatricula =
                        document.createElement(
                            "span"
                        );

                    badgeMatricula.className =
                        "estado-matricula " +
                        claseEstadoMatricula(
                            matricula.estado
                        );

                    badgeMatricula.textContent =
                        matricula.estado_nombre;

                    estadoMatricula.appendChild(
                        badgeMatricula
                    );


                    // =========================================
                    // ESTADO DEL PAGO
                    // =========================================

                    const estadoPago =
                        document.createElement(
                            "td"
                        );

                    mostrarEstadoPago(
                        estadoPago,
                        matricula
                    );


                    // =========================================
                    // ACCIONES
                    // =========================================

                    const acciones =
                        document.createElement(
                            "td"
                        );

                    acciones.className =
                        "text-end acciones-tabla";


                    crearAccionesMatricula(
                        acciones,
                        matricula
                    );


                    // =========================================
                    // AGREGAR CELDAS
                    // =========================================

                    fila.appendChild(
                        numero
                    );

                    fila.appendChild(
                        estudiante
                    );

                    fila.appendChild(
                        cursos
                    );

                    fila.appendChild(
                        total
                    );

                    fila.appendChild(
                        estadoMatricula
                    );

                    fila.appendChild(
                        estadoPago
                    );

                    fila.appendChild(
                        acciones
                    );


                    tablaMatriculas.appendChild(
                        fila
                    );
                }
            );
        }


        // ====================================================
        // MOSTRAR ESTADO DEL PAGO
        // ====================================================

        function mostrarEstadoPago(
            contenedor,
            matricula
        ) {

            const pago =
                matricula.pago;


            // ------------------------------------------------
            // SIN PAGO
            // ------------------------------------------------

            if (!pago) {

                const badge =
                    document.createElement(
                        "span"
                    );

                badge.className =
                    "estado-pago-historial " +
                    "pago-sin-realizar";

                badge.textContent =
                    "Sin realizar";

                contenedor.appendChild(
                    badge
                );

                return;
            }


            // ------------------------------------------------
            // MÉTODO DE PAGO
            // ------------------------------------------------

            if (pago.metodo_pago_nombre) {

                const metodo =
                    document.createElement(
                        "small"
                    );

                metodo.className =
                    "d-block text-muted mb-1";

                metodo.textContent =
                    pago.metodo_pago_nombre;

                contenedor.appendChild(
                    metodo
                );
            }


            // ------------------------------------------------
            // BADGE DEL PAGO
            // ------------------------------------------------

            const badge =
                document.createElement(
                    "span"
                );

            badge.className =
                "estado-pago-historial";


            if (
                pago.estado ===
                "PENDIENTE"
            ) {

                badge.classList.add(
                    "pago-en-revision"
                );

                badge.textContent =
                    "En revisión";


            } else if (
                pago.estado ===
                "APROBADO"
            ) {

                badge.classList.add(
                    "pago-aprobado"
                );

                badge.textContent =
                    "Aprobado";


            } else if (
                pago.estado ===
                "RECHAZADO"
            ) {

                badge.classList.add(
                    "pago-rechazado"
                );

                badge.textContent =
                    "Rechazado";


            } else {

                badge.textContent =
                    pago.estado_nombre ||
                    pago.estado;
            }


            contenedor.appendChild(
                badge
            );
        }


        // ====================================================
        // CREAR ACCIONES DE MATRÍCULA
        // ====================================================

        function crearAccionesMatricula(
            contenedor,
            matricula
        ) {

            const pago =
                matricula.pago;


            // ------------------------------------------------
            // MATRÍCULA PENDIENTE SIN PAGO
            // ------------------------------------------------

            if (
                matricula.estado ===
                    "PENDIENTE" &&
                !pago
            ) {

                const texto =
                    document.createElement(
                        "small"
                    );

                texto.className =
                    "text-muted";

                texto.textContent =
                    "Esperando pago";

                contenedor.appendChild(
                    texto
                );

                return;
            }


            // ------------------------------------------------
            // PAGO PENDIENTE DE REVISIÓN
            // ------------------------------------------------

            if (
                matricula.estado ===
                    "PENDIENTE" &&
                pago &&
                pago.estado ===
                    "PENDIENTE"
            ) {

                // Botón aprobar.

                const botonAprobar =
                    document.createElement(
                        "button"
                    );

                botonAprobar.type =
                    "button";

                botonAprobar.className =
                    "btn btn-sm " +
                    "btn-primary me-2";

                botonAprobar.textContent =
                    "Aprobar pago";


                botonAprobar.addEventListener(
                    "click",
                    async function () {

                        await aprobarPago(
                            matricula.id
                        );
                    }
                );


                // Botón rechazar.

                const botonRechazar =
                    document.createElement(
                        "button"
                    );

                botonRechazar.type =
                    "button";

                botonRechazar.className =
                    "btn btn-sm " +
                    "btn-outline-danger";

                botonRechazar.textContent =
                    "Rechazar pago";


                botonRechazar.addEventListener(
                    "click",
                    async function () {

                        await rechazarPago(
                            matricula.id
                        );
                    }
                );


                contenedor.appendChild(
                    botonAprobar
                );

                contenedor.appendChild(
                    botonRechazar
                );

                return;
            }


            // ------------------------------------------------
            // PAGO RECHAZADO
            // ------------------------------------------------

            if (
                matricula.estado ===
                    "PENDIENTE" &&
                pago &&
                pago.estado ===
                    "RECHAZADO"
            ) {

                const texto =
                    document.createElement(
                        "small"
                    );

                texto.className =
                    "text-muted";

                texto.textContent =
                    "Esperando nuevo pago";

                contenedor.appendChild(
                    texto
                );

                return;
            }


            // ------------------------------------------------
            // MATRÍCULA PAGADA
            // ------------------------------------------------

            if (
                matricula.estado ===
                "PAGADO"
            ) {

                const selector =
                    document.createElement(
                        "select"
                    );

                selector.className =
                    "form-select " +
                    "form-select-sm " +
                    "d-inline-block";

                selector.style.width =
                    "155px";


                agregarOpcionesEstado(
                    selector,
                    matricula.estado
                );


                selector.addEventListener(
                    "change",
                    async function () {

                        const nuevoEstado =
                            selector.value;


                        if (
                            !nuevoEstado ||
                            nuevoEstado ===
                                matricula.estado
                        ) {

                            return;
                        }


                        await cambiarEstadoMatricula(
                            matricula.id,
                            nuevoEstado
                        );
                    }
                );


                contenedor.appendChild(
                    selector
                );

                return;
            }


            // ------------------------------------------------
            // MATRÍCULA FINALIZADA
            // ------------------------------------------------

            const texto =
                document.createElement(
                    "small"
                );

            texto.className =
                "text-muted";

            texto.textContent =
                "Sin acciones";

            contenedor.appendChild(
                texto
            );
        }


        // ====================================================
        // APROBAR PAGO
        // ====================================================

        async function aprobarPago(
            id
        ) {

            const confirmar =
                window.confirm(
                    "¿Deseas aprobar el pago de la matrícula #" +
                    id +
                    "?\n\n" +
                    "Al aprobarlo se validarán y descontarán " +
                    "los cupos de los cursos."
                );


            if (!confirmar) {

                return;
            }


            try {

                const respuesta =
                    await fetch(
                        "/api/matriculas/" +
                        id +
                        "/estado/",
                        {
                            method: "PATCH",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    "Bearer " +
                                    accessToken
                            },

                            body:
                                JSON.stringify({
                                    estado:
                                        "PAGADO"
                                })
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
                    "Pago aprobado y matrícula confirmada correctamente.",
                    "success"
                );


                await cargarMatriculas();


            } catch (error) {

                mostrarMensaje(
                    error.message,
                    "danger"
                );

                await cargarMatriculas();
            }
        }


        // ====================================================
        // RECHAZAR PAGO
        // ====================================================

        async function rechazarPago(
            id
        ) {

            const confirmar =
                window.confirm(
                    "¿Deseas rechazar el pago de la matrícula #" +
                    id +
                    "?\n\n" +
                    "La matrícula continuará pendiente y el " +
                    "estudiante podrá intentar pagar nuevamente."
                );


            if (!confirmar) {

                return;
            }


            try {

                const respuesta =
                    await fetch(
                        "/api/pagos/matricula/" +
                        id +
                        "/rechazar/",
                        {
                            method: "PATCH",

                            headers: {
                                "Authorization":
                                    "Bearer " +
                                    accessToken
                            }
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
                    "Pago rechazado correctamente.",
                    "success"
                );


                await cargarMatriculas();


            } catch (error) {

                mostrarMensaje(
                    error.message,
                    "danger"
                );

                await cargarMatriculas();
            }
        }


        // ====================================================
        // OPCIONES DE ESTADO ACADÉMICO
        // ====================================================

        function agregarOpcionesEstado(
            selector,
            estadoActual
        ) {

            selector.innerHTML =
                "";


            const actual =
                document.createElement(
                    "option"
                );

            actual.value =
                estadoActual;

            actual.textContent =
                obtenerNombreEstado(
                    estadoActual
                );

            selector.appendChild(
                actual
            );


            /*
            El pago ya fue aprobado cuando la matrícula
            está PAGADO. Desde ese punto solamente se
            permiten las transiciones académicas.
            */

            let opciones = [];


            if (
                estadoActual ===
                "PAGADO"
            ) {

                opciones = [
                    "COMPLETADO",
                    "CANCELADO"
                ];
            }


            opciones.forEach(
                function (estado) {

                    const opcion =
                        document.createElement(
                            "option"
                        );

                    opcion.value =
                        estado;

                    opcion.textContent =
                        obtenerNombreEstado(
                            estado
                        );

                    selector.appendChild(
                        opcion
                    );
                }
            );


            if (
                opciones.length === 0
            ) {

                selector.disabled =
                    true;
            }
        }


        // ====================================================
        // CAMBIAR ESTADO ACADÉMICO
        // ====================================================

        async function cambiarEstadoMatricula(
            id,
            nuevoEstado
        ) {

            const confirmar =
                window.confirm(
                    "¿Deseas cambiar la matrícula #" +
                    id +
                    " al estado " +
                    obtenerNombreEstado(
                        nuevoEstado
                    ) +
                    "?"
                );


            if (!confirmar) {

                await cargarMatriculas();

                return;
            }


            try {

                const respuesta =
                    await fetch(
                        "/api/matriculas/" +
                        id +
                        "/estado/",
                        {
                            method: "PATCH",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    "Bearer " +
                                    accessToken
                            },

                            body:
                                JSON.stringify({
                                    estado:
                                        nuevoEstado
                                })
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
                    "Estado de la matrícula actualizado correctamente.",
                    "success"
                );


                await cargarMatriculas();


            } catch (error) {

                mostrarMensaje(
                    error.message,
                    "danger"
                );

                await cargarMatriculas();
            }
        }


        // ====================================================
        // NOMBRE DEL ESTADO
        // ====================================================

        function obtenerNombreEstado(
            estado
        ) {

            const nombres = {

                PENDIENTE:
                    "Pendiente",

                PAGADO:
                    "Pagado",

                COMPLETADO:
                    "Completado",

                CANCELADO:
                    "Cancelado"

            };


            return (
                nombres[estado] ||
                estado
            );
        }


        // ====================================================
        // CLASE VISUAL DEL ESTADO
        // ====================================================

        function claseEstadoMatricula(
            estado
        ) {

            if (
                estado === "PAGADO"
            ) {

                return "estado-pagado";
            }


            if (
                estado === "CANCELADO"
            ) {

                return "estado-cancelado";
            }


            if (
                estado === "COMPLETADO"
            ) {

                return "estado-completado";
            }


            return "estado-pendiente";
        }


        // ====================================================
        // ESCAPAR HTML
        // ====================================================

        function escaparHTML(
            texto
        ) {

            const elemento =
                document.createElement(
                    "div"
                );

            elemento.textContent =
                texto === null ||
                texto === undefined
                    ? ""
                    : String(texto);

            return elemento.innerHTML;
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
                tipo;

            mensaje.textContent =
                texto;


            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }


        function ocultarMensaje() {

            mensaje.className =
                "d-none";

            mensaje.textContent =
                "";
        }


        // ====================================================
        // OBTENER MENSAJE DE ERROR DE LA API
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


            /*
            DRF puede devolver errores por campo.
            Mostramos el primer error encontrado.
            */

            if (
                resultado &&
                typeof resultado ===
                    "object"
            ) {

                const campos =
                    Object.keys(
                        resultado
                    );


                if (
                    campos.length > 0
                ) {

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
                "No fue posible completar " +
                "la operación."
            );
        }


        // ====================================================
        // CERRAR SESIÓN SI EL TOKEN EXPIRÓ
        // ====================================================

        function cerrarSesion() {

            localStorage.removeItem(
                "accessToken"
            );

            localStorage.removeItem(
                "refreshToken"
            );

            localStorage.removeItem(
                "username"
            );

            localStorage.removeItem(
                "nombreCompleto"
            );

            localStorage.removeItem(
                "rol"
            );


            window.location.href =
                "/login/";
        }


        // ====================================================
        // CARGA INICIAL
        // ====================================================

        await Promise.all([
            cargarAreas(),
            cargarAreasCurso()
        ]);


        /*
        EXTENSIÓN ADICIONAL.

        Si el coordinador llega desde una notificación
        de pago, se abre automáticamente la sección
        de Matrículas.
        */

        const parametros =
            new URLSearchParams(
                window.location.search
            );


        const seccionSolicitada =
            parametros.get(
                "seccion"
            );


        if (
            seccionSolicitada ===
            "matriculas"
        ) {

            /*
            Simulamos el mismo clic que utiliza normalmente
            el coordinador para abrir la pestaña Matrículas.

            De esta manera reutilizamos la funcionalidad
            existente y evitamos duplicar código.
            */

            tabMatriculas.click();
        }
    }
);