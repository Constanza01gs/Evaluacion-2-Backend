/*
============================================================
PANEL DE ADMINISTRACIÓN - EDTECH
============================================================

EXTENSIÓN ADICIONAL.

Este archivo controla:

1. La validación del rol ADMIN.
2. La navegación interna del panel.
3. Las métricas generales del dashboard.
4. Los cursos con más matrículas.
5. Las áreas de mayor interés.
6. La gestión de Coordinadores Académicos.
7. La creación, edición, inactivación y reactivación.
8. El formulario desplegable de coordinadores.

La autorización real permanece controlada por el backend.
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

        const usernameAdmin =
            localStorage.getItem("username");

        const nombreCompletoAdmin =
            localStorage.getItem("nombreCompleto");


        if (
            !accessToken ||
            rol !== "ADMIN"
        ) {

            window.location.href = "/login/";
            return;
        }


        // ====================================================
        // ELEMENTOS DEL DASHBOARD
        // ====================================================

        const totalEstudiantes =
            document.getElementById(
                "total-estudiantes"
            );

        const totalCoordinadores =
            document.getElementById(
                "total-coordinadores"
            );

        const totalCursos =
            document.getElementById(
                "total-cursos"
            );

        const totalMatriculas =
            document.getElementById(
                "total-matriculas-admin"
            );

        const cursosPopulares =
            document.getElementById(
                "cursos-populares"
            );

        const areasPopulares =
            document.getElementById(
                "areas-populares"
            );


        // ====================================================
        // ELEMENTOS DE NAVEGACIÓN ADMIN
        // ====================================================

        const menuDashboard =
            document.getElementById(
                "admin-menu-dashboard"
            );

        const menuCoordinadores =
            document.getElementById(
                "admin-menu-coordinadores"
            );

        const seccionDashboard =
            document.getElementById(
                "admin-seccion-dashboard"
            );

        const seccionCoordinadores =
            document.getElementById(
                "admin-seccion-coordinadores"
            );

        const nombreUsuarioAdmin =
            document.getElementById(
                "admin-nombre-usuario"
            );

        const nombreMenuAdmin =
            document.getElementById(
                "admin-menu-nombre"
            );

        const botonLogoutAdmin =
            document.getElementById(
                "admin-boton-logout"
            );

        const botonPerfilAdmin =
            document.getElementById(
                "admin-perfil-boton"
            );

        const menuPerfilAdmin =
            document.getElementById(
                "admin-perfil-menu"
            );


        // ====================================================
        // ELEMENTOS DEL FORMULARIO
        // ====================================================

        const formulario =
            document.getElementById(
                "form-coordinador"
            );

        const coordinadorId =
            document.getElementById(
                "coordinador-id"
            );

        const firstName =
            document.getElementById(
                "coordinador-first-name"
            );

        const lastName =
            document.getElementById(
                "coordinador-last-name"
            );

        const username =
            document.getElementById(
                "coordinador-username"
            );

        const email =
            document.getElementById(
                "coordinador-email"
            );

        const password =
            document.getElementById(
                "coordinador-password"
            );

        const tituloFormulario =
            document.getElementById(
                "titulo-formulario-coordinador"
            );

        const botonGuardar =
            document.getElementById(
                "boton-guardar-coordinador"
            );

        const botonCancelar =
            document.getElementById(
                "boton-cancelar-coordinador"
            );

        const botonNuevoCoordinador =
            document.getElementById(
                "boton-nuevo-coordinador"
            );

        const botonCerrarFormulario =
            document.getElementById(
                "boton-cerrar-form-coordinador"
            );

        const contenedorFormulario =
            document.getElementById(
                "contenedor-form-coordinador"
            );

        const ayudaPassword =
            document.getElementById(
                "ayuda-password-coordinador"
            );

        const tablaCoordinadores =
            document.getElementById(
                "tabla-coordinadores"
            );

        const mensajeAdmin =
            document.getElementById(
                "mensaje-admin"
            );


        let coordinadores = [];


        // ====================================================
        // NOMBRE DEL ADMINISTRADOR
        // ====================================================

        const nombreVisibleAdmin =
            nombreCompletoAdmin ||
            usernameAdmin ||
            "Administrador";


        if (nombreUsuarioAdmin) {

            nombreUsuarioAdmin.textContent =
                nombreVisibleAdmin;
        }


        if (nombreMenuAdmin) {

            nombreMenuAdmin.textContent =
                nombreVisibleAdmin;
        }


        // ====================================================
        // NAVEGACIÓN DEL PANEL
        // ====================================================

        function mostrarSeccionAdmin(
            seccion
        ) {

            seccionDashboard.classList.add(
                "d-none"
            );

            seccionCoordinadores.classList.add(
                "d-none"
            );

            menuDashboard.classList.remove(
                "activo"
            );

            menuCoordinadores.classList.remove(
                "activo"
            );


            if (
                seccion ===
                "coordinadores"
            ) {

                seccionCoordinadores.classList.remove(
                    "d-none"
                );

                menuCoordinadores.classList.add(
                    "activo"
                );

                return;
            }


            seccionDashboard.classList.remove(
                "d-none"
            );

            menuDashboard.classList.add(
                "activo"
            );
        }


        menuDashboard.addEventListener(
            "click",
            function () {

                mostrarSeccionAdmin(
                    "dashboard"
                );
            }
        );


        menuCoordinadores.addEventListener(
            "click",
            function () {

                mostrarSeccionAdmin(
                    "coordinadores"
                );
            }
        );


        // ====================================================
        // DASHBOARD
        // ====================================================

        async function cargarDashboard() {

            try {

                const respuesta =
                    await fetch(
                        "/api/admin/dashboard/",
                        {
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


                const datos =
                    await respuesta.json();


                if (!respuesta.ok) {

                    mostrarMensaje(
                        obtenerMensajeError(
                            datos,
                            "No fue posible cargar el dashboard."
                        ),
                        "danger"
                    );

                    return;
                }


                /*
                Los contadores generales vienen agrupados
                dentro de "resumen" desde el backend.
                */

                const resumen =
                    datos.resumen || {};


                totalEstudiantes.textContent =
                    resumen.estudiantes ?? 0;


                totalCoordinadores.textContent =
                    resumen.coordinadores ?? 0;


                totalCursos.textContent =
                    resumen.cursos ?? 0;


                totalMatriculas.textContent =
                    resumen.matriculas ?? 0;


                const listaCursos =
                    obtenerValor(
                        datos,
                        [
                            "cursos_populares",
                            "cursos_mas_matriculados",
                            "top_cursos"
                        ],
                        []
                    );


                const listaAreas =
                    obtenerValor(
                        datos,
                        [
                            "areas_populares",
                            "areas_mayor_interes",
                            "top_areas"
                        ],
                        []
                    );


                mostrarCursosPopulares(
                    listaCursos
                );

                mostrarAreasPopulares(
                    listaAreas
                );


            } catch (error) {

                mostrarMensaje(
                    "No fue posible conectar con el dashboard.",
                    "danger"
                );


                cursosPopulares.innerHTML = `
                    <p class="text-muted mb-0">
                        No fue posible cargar la información.
                    </p>
                `;


                areasPopulares.innerHTML = `
                    <p class="text-muted mb-0">
                        No fue posible cargar la información.
                    </p>
                `;
            }
        }


        // ====================================================
        // CURSOS CON MÁS MATRÍCULAS
        // ====================================================

        function mostrarCursosPopulares(
            lista
        ) {

            cursosPopulares.innerHTML = "";


            if (
                !Array.isArray(lista) ||
                lista.length === 0
            ) {

                cursosPopulares.innerHTML = `
                    <p class="text-muted mb-0">
                        Todavía no existen matrículas registradas.
                    </p>
                `;

                return;
            }


            lista.forEach(
                function (
                    curso,
                    indice
                ) {

                    const nombre =
                        curso.titulo ||
                        curso.nombre ||
                        curso.curso ||
                        "Curso";


                    const cantidad =
                        curso.total_matriculas ??
                        curso.matriculas ??
                        curso.cantidad ??
                        curso.total ??
                        0;


                    const elemento =
                        document.createElement(
                            "div"
                        );


                    elemento.className =
                        "admin-ranking-item";


                    elemento.innerHTML = `
                        <div class="admin-ranking-posicion">
                            ${indice + 1}
                        </div>

                        <div class="admin-ranking-info">
                            <strong>
                                ${escaparHTML(nombre)}
                            </strong>
                        </div>

                        <div class="admin-ranking-cantidad">
                            <strong>${cantidad}</strong>
                            ${
                                Number(cantidad) === 1
                                    ? "matrícula"
                                    : "matrículas"
                            }
                        </div>
                    `;


                    cursosPopulares.appendChild(
                        elemento
                    );
                }
            );
        }


        // ====================================================
        // ÁREAS DE MAYOR INTERÉS
        // ====================================================

        function mostrarAreasPopulares(
            lista
        ) {

            areasPopulares.innerHTML = "";


            if (
                !Array.isArray(lista) ||
                lista.length === 0
            ) {

                areasPopulares.innerHTML = `
                    <p class="text-muted mb-0">
                        Todavía no existen datos suficientes.
                    </p>
                `;

                return;
            }


            lista.forEach(
                function (
                    area,
                    indice
                ) {

                    const nombre =
                        area.nombre ||
                        area.area ||
                        "Área";


                    const cantidad =
                        area.total_matriculas ??
                        area.matriculas ??
                        area.cantidad ??
                        area.total ??
                        0;


                    const elemento =
                        document.createElement(
                            "div"
                        );


                    elemento.className =
                        "admin-ranking-item";


                    elemento.innerHTML = `
                        <div class="admin-ranking-posicion">
                            ${indice + 1}
                        </div>

                        <div class="admin-ranking-info">
                            <strong>
                                ${escaparHTML(nombre)}
                            </strong>
                        </div>

                        <div class="admin-ranking-cantidad">
                            <strong>${cantidad}</strong>
                            ${
                                Number(cantidad) === 1
                                    ? "matrícula"
                                    : "matrículas"
                            }
                        </div>
                    `;


                    areasPopulares.appendChild(
                        elemento
                    );
                }
            );
        }


        // ====================================================
        // CARGAR COORDINADORES
        // ====================================================

        async function cargarCoordinadores() {

            tablaCoordinadores.innerHTML = `
                <tr>
                    <td
                        colspan="5"
                        class="text-muted"
                    >
                        Cargando coordinadores...
                    </td>
                </tr>
            `;


            try {

                const respuesta =
                    await fetch(
                        "/api/admin/coordinadores/",
                        {
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


                const datos =
                    await respuesta.json();


                if (!respuesta.ok) {

                    tablaCoordinadores.innerHTML = `
                        <tr>
                            <td
                                colspan="5"
                                class="text-danger"
                            >
                                No fue posible cargar
                                los coordinadores.
                            </td>
                        </tr>
                    `;

                    return;
                }


                coordinadores =
                    Array.isArray(datos)
                        ? datos
                        : datos.results || [];


                mostrarCoordinadores();


            } catch (error) {

                tablaCoordinadores.innerHTML = `
                    <tr>
                        <td
                            colspan="5"
                            class="text-danger"
                        >
                            No fue posible conectar
                            con el servidor.
                        </td>
                    </tr>
                `;
            }
        }


        // ====================================================
        // MOSTRAR COORDINADORES
        // ====================================================

        function mostrarCoordinadores() {

            tablaCoordinadores.innerHTML = "";


            if (
                coordinadores.length === 0
            ) {

                tablaCoordinadores.innerHTML = `
                    <tr>
                        <td
                            colspan="5"
                            class="text-muted"
                        >
                            No existen Coordinadores Académicos
                            registrados.
                        </td>
                    </tr>
                `;

                return;
            }


            coordinadores.forEach(
                function (coordinador) {

                    const fila =
                        document.createElement(
                            "tr"
                        );


                    const activo =
                        coordinador.activo !==
                        false;


                    const nombreCompleto =
                        (
                            (
                                coordinador.first_name ||
                                ""
                            ) +
                            " " +
                            (
                                coordinador.last_name ||
                                ""
                            )
                        ).trim() ||
                        coordinador.username;


                    fila.innerHTML = `
                        <td>

                            <strong>
                                ${escaparHTML(
                                    nombreCompleto
                                )}
                            </strong>

                        </td>

                        <td>
                            ${escaparHTML(
                                coordinador.username ||
                                ""
                            )}
                        </td>

                        <td>
                            ${escaparHTML(
                                coordinador.email ||
                                ""
                            )}
                        </td>

                        <td>

                            <span
                                class="
                                    admin-estado
                                    ${
                                        activo
                                            ? "admin-estado-activo"
                                            : "admin-estado-inactivo"
                                    }
                                "
                            >
                                ${
                                    activo
                                        ? "Activo"
                                        : "Inactivo"
                                }
                            </span>

                        </td>

                        <td class="text-end">

                            <div
                                class="
                                    d-flex
                                    justify-content-end
                                    gap-2
                                    flex-wrap
                                "
                            >

                                <button
                                    type="button"
                                    class="
                                        btn
                                        btn-sm
                                        btn-outline-primary
                                        boton-editar-coordinador
                                    "
                                    data-id="${coordinador.id}"
                                >
                                    Editar
                                </button>

                                <button
                                    type="button"
                                    class="
                                        btn
                                        btn-sm
                                        ${
                                            activo
                                                ? "btn-outline-danger"
                                                : "btn-outline-success"
                                        }
                                        boton-estado-coordinador
                                    "
                                    data-id="${coordinador.id}"
                                    data-activo="${activo}"
                                >
                                    ${
                                        activo
                                            ? "Inactivar"
                                            : "Reactivar"
                                    }
                                </button>

                            </div>

                        </td>
                    `;


                    tablaCoordinadores.appendChild(
                        fila
                    );
                }
            );


            agregarEventosCoordinadores();
        }


        // ====================================================
        // EVENTOS DE LA TABLA
        // ====================================================

        function agregarEventosCoordinadores() {

            const botonesEditar =
                document.querySelectorAll(
                    ".boton-editar-coordinador"
                );


            botonesEditar.forEach(
                function (boton) {

                    boton.addEventListener(
                        "click",
                        function () {

                            const id =
                                Number(
                                    boton.dataset.id
                                );


                            editarCoordinador(
                                id
                            );
                        }
                    );
                }
            );


            const botonesEstado =
                document.querySelectorAll(
                    ".boton-estado-coordinador"
                );


            botonesEstado.forEach(
                function (boton) {

                    boton.addEventListener(
                        "click",
                        async function () {

                            const id =
                                Number(
                                    boton.dataset.id
                                );


                            const activo =
                                boton.dataset.activo ===
                                "true";


                            if (activo) {

                                await inactivarCoordinador(
                                    id
                                );

                            } else {

                                await reactivarCoordinador(
                                    id
                                );
                            }
                        }
                    );
                }
            );
        }


        // ====================================================
        // ABRIR FORMULARIO NUEVO
        // ====================================================

        botonNuevoCoordinador.addEventListener(
            "click",
            function () {

                limpiarFormulario();


                contenedorFormulario.classList.remove(
                    "d-none"
                );


                firstName.focus();
            }
        );


        // ====================================================
        // CREAR / ACTUALIZAR COORDINADOR
        // ====================================================

        formulario.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const id =
                    coordinadorId.value.trim();


                const datos = {

                    first_name:
                        firstName.value.trim(),

                    last_name:
                        lastName.value.trim(),

                    username:
                        username.value.trim(),

                    email:
                        email.value.trim()
                };


                // Contraseña obligatoria al crear.

                if (!id) {

                    if (
                        !password.value.trim()
                    ) {

                        mostrarMensaje(
                            "Debes ingresar una contraseña.",
                            "warning"
                        );

                        return;
                    }


                    datos.password =
                        password.value;

                } else if (
                    password.value.trim()
                ) {

                    datos.password =
                        password.value;
                }


                botonGuardar.disabled =
                    true;


                try {

                    let url =
                        "/api/admin/coordinadores/";

                    let metodo =
                        "POST";


                    if (id) {

                        url =
                            `/api/admin/coordinadores/${id}/`;

                        metodo =
                            "PUT";
                    }


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


                    if (
                        respuesta.status === 401 ||
                        respuesta.status === 403
                    ) {

                        cerrarSesion();
                        return;
                    }


                    const resultado =
                        await respuesta.json();


                    if (!respuesta.ok) {

                        mostrarMensaje(
                            obtenerMensajeError(
                                resultado,
                                "No fue posible guardar el coordinador."
                            ),
                            "danger"
                        );

                        return;
                    }


                    mostrarMensaje(
                        id
                            ? "Coordinador actualizado correctamente."
                            : "Coordinador creado correctamente.",
                        "success"
                    );


                    cerrarFormularioCoordinador();


                    await Promise.all([
                        cargarCoordinadores(),
                        cargarDashboard()
                    ]);


                } catch (error) {

                    mostrarMensaje(
                        "No fue posible conectar con el servidor.",
                        "danger"
                    );


                } finally {

                    botonGuardar.disabled =
                        false;
                }
            }
        );


        // ====================================================
        // EDITAR COORDINADOR
        // ====================================================

        function editarCoordinador(id) {

            const coordinador =
                coordinadores.find(
                    function (item) {

                        return (
                            item.id === id
                        );
                    }
                );


            if (!coordinador) {

                return;
            }


            coordinadorId.value =
                coordinador.id;

            firstName.value =
                coordinador.first_name ||
                "";

            lastName.value =
                coordinador.last_name ||
                "";

            username.value =
                coordinador.username ||
                "";

            email.value =
                coordinador.email ||
                "";

            password.value = "";


            tituloFormulario.textContent =
                "Editar Coordinador";

            botonGuardar.textContent =
                "Guardar cambios";

            ayudaPassword.textContent =
                "Déjala vacía para mantener la contraseña actual.";


            /*
            El formulario permanece oculto normalmente
            y aparece al editar una cuenta.
            */

            contenedorFormulario.classList.remove(
                "d-none"
            );


            formulario.scrollIntoView({
                behavior:
                    "smooth",

                block:
                    "center"
            });
        }


        // ====================================================
        // CERRAR FORMULARIO
        // ====================================================

        function cerrarFormularioCoordinador() {

            limpiarFormulario();


            contenedorFormulario.classList.add(
                "d-none"
            );
        }


        botonCancelar.addEventListener(
            "click",
            cerrarFormularioCoordinador
        );


        botonCerrarFormulario.addEventListener(
            "click",
            cerrarFormularioCoordinador
        );


        // ====================================================
        // LIMPIAR FORMULARIO
        // ====================================================

        function limpiarFormulario() {

            formulario.reset();

            coordinadorId.value = "";


            tituloFormulario.textContent =
                "Nuevo Coordinador";


            botonGuardar.textContent =
                "Crear Coordinador";


            ayudaPassword.textContent =
                "Obligatoria al crear un coordinador.";
        }


        // ====================================================
        // INACTIVAR COORDINADOR
        // ====================================================

        async function inactivarCoordinador(
            id
        ) {

            const confirmar =
                window.confirm(
                    "¿Deseas inactivar este Coordinador Académico?"
                );


            if (!confirmar) {

                return;
            }


            await cambiarEstadoCoordinador(
                id,
                false
            );
        }


        // ====================================================
        // REACTIVAR COORDINADOR
        // ====================================================

        async function reactivarCoordinador(
            id
        ) {

            const confirmar =
                window.confirm(
                    "¿Deseas reactivar este Coordinador Académico?"
                );


            if (!confirmar) {

                return;
            }


            await cambiarEstadoCoordinador(
                id,
                true
            );
        }


        // ====================================================
        // CAMBIAR ESTADO DEL COORDINADOR
        // ====================================================

        async function cambiarEstadoCoordinador(
            id,
            activar
        ) {

            try {

                /*
                DELETE realiza la eliminación lógica.

                PATCH con activo=true permite reactivar
                la cuenta cuando el backend lo admite.
                */

                const metodo =
                    activar
                        ? "PATCH"
                        : "DELETE";


                const opciones = {

                    method:
                        metodo,

                    headers: {

                        "Authorization":
                            "Bearer " +
                            accessToken
                    }
                };


                if (activar) {

                    opciones.headers[
                        "Content-Type"
                    ] = "application/json";


                    opciones.body =
                        JSON.stringify({
                            activo: true
                        });
                }


                const respuesta =
                    await fetch(
                        `/api/admin/coordinadores/${id}/`,
                        opciones
                    );


                if (
                    respuesta.status === 401 ||
                    respuesta.status === 403
                ) {

                    cerrarSesion();
                    return;
                }


                let resultado = {};


                if (
                    respuesta.status !==
                    204
                ) {

                    resultado =
                        await respuesta.json();
                }


                if (!respuesta.ok) {

                    mostrarMensaje(
                        obtenerMensajeError(
                            resultado,
                            "No fue posible cambiar el estado del coordinador."
                        ),
                        "danger"
                    );

                    return;
                }


                mostrarMensaje(
                    activar
                        ? "Coordinador reactivado correctamente."
                        : "Coordinador inactivado correctamente.",
                    "success"
                );


                await Promise.all([
                    cargarCoordinadores(),
                    cargarDashboard()
                ]);


            } catch (error) {

                mostrarMensaje(
                    "No fue posible conectar con el servidor.",
                    "danger"
                );
            }
        }


        // ====================================================
        // MENSAJES
        // ====================================================

        function mostrarMensaje(
            mensaje,
            tipo
        ) {

            mensajeAdmin.className =
                `alert alert-${tipo} mb-4`;


            mensajeAdmin.textContent =
                mensaje;


            mensajeAdmin.classList.remove(
                "d-none"
            );


            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }


        // ====================================================
        // MENSAJES DE ERROR DE DRF
        // ====================================================

        function obtenerMensajeError(
            datos,
            mensajePredeterminado
        ) {

            if (!datos) {

                return mensajePredeterminado;
            }


            if (
                typeof datos.detail ===
                "string"
            ) {

                return datos.detail;
            }


            const claves =
                Object.keys(datos);


            if (
                claves.length > 0
            ) {

                const valor =
                    datos[
                        claves[0]
                    ];


                if (
                    Array.isArray(valor)
                ) {

                    return valor[0];
                }


                if (
                    typeof valor ===
                    "string"
                ) {

                    return valor;
                }
            }


            return mensajePredeterminado;
        }


        // ====================================================
        // OBTENER VALOR DEL DASHBOARD
        // ====================================================

        function obtenerValor(
            objeto,
            claves,
            valorPredeterminado
        ) {

            for (
                const clave of claves
            ) {

                if (
                    objeto[clave] !==
                    undefined
                ) {

                    return objeto[
                        clave
                    ];
                }
            }


            return valorPredeterminado;
        }


        // ====================================================
        // ESCAPAR HTML
        // ====================================================

        function escaparHTML(valor) {

            return String(
                valor ?? ""
            )
                .replaceAll(
                    "&",
                    "&amp;"
                )
                .replaceAll(
                    "<",
                    "&lt;"
                )
                .replaceAll(
                    ">",
                    "&gt;"
                )
                .replaceAll(
                    '"',
                    "&quot;"
                )
                .replaceAll(
                    "'",
                    "&#039;"
                );
        }


        // ====================================================
        // CERRAR SESIÓN INVÁLIDA
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
        // PERFIL DEL ADMINISTRADOR
        // ====================================================

        if (
            botonPerfilAdmin &&
            menuPerfilAdmin
        ) {

            botonPerfilAdmin.addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();


                    const estaOculto =
                        menuPerfilAdmin.classList.contains(
                            "d-none"
                        );


                    if (estaOculto) {

                        menuPerfilAdmin.classList.remove(
                            "d-none"
                        );

                        botonPerfilAdmin.setAttribute(
                            "aria-expanded",
                            "true"
                        );

                    } else {

                        menuPerfilAdmin.classList.add(
                            "d-none"
                        );

                        botonPerfilAdmin.setAttribute(
                            "aria-expanded",
                            "false"
                        );
                    }
                }
            );


            /*
            Cierra el menú al hacer clic fuera
            del perfil.
            */

            document.addEventListener(
                "click",
                function (event) {

                    if (
                        !menuPerfilAdmin.contains(
                            event.target
                        ) &&
                        !botonPerfilAdmin.contains(
                            event.target
                        )
                    ) {

                        menuPerfilAdmin.classList.add(
                            "d-none"
                        );

                        botonPerfilAdmin.setAttribute(
                            "aria-expanded",
                            "false"
                        );
                    }
                }
            );
        }


        // ====================================================
        // CERRAR SESIÓN DEL ADMINISTRADOR
        // ====================================================

        if (botonLogoutAdmin) {

            botonLogoutAdmin.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    cerrarSesion();
                }
            );
        }


        // ====================================================
        // CARGA INICIAL
        // ====================================================

        mostrarSeccionAdmin(
            "dashboard"
        );


        await Promise.all([
            cargarDashboard(),
            cargarCoordinadores()
        ]);

    }
);