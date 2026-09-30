/*
============================================================
NAVEGACIÓN GENERAL - EDTECH
============================================================

Este archivo controla:

1. La navegación según el estado de autenticación.
2. La navegación según el rol del usuario.
3. El nombre del usuario autenticado.
4. La página activa del menú.
5. El contador del carro del estudiante.
6. Las notificaciones de pagos del coordinador.
7. El cierre de sesión.

La seguridad real permanece controlada por el backend.
============================================================
*/


document.addEventListener(
    "DOMContentLoaded",
    async function () {

        // ====================================================
        // DATOS DE AUTENTICACIÓN
        // ====================================================

        const accessToken =
            localStorage.getItem(
                "accessToken"
            );

        const username =
            localStorage.getItem(
                "username"
            );

        const nombreCompleto =
            localStorage.getItem(
                "nombreCompleto"
            );

        const rol =
            localStorage.getItem(
                "rol"
            );


        // ====================================================
        // ELEMENTOS
        // ====================================================

        const navLogin =
            document.getElementById(
                "nav-login"
            );

        const navRegistro =
            document.getElementById(
                "nav-registro"
            );

        const navUsuario =
            document.getElementById(
                "nav-usuario"
            );

        const nombreUsuario =
            document.getElementById(
                "nombre-usuario"
            );

        const navCarro =
            document.getElementById(
                "nav-carro"
            );

        const contadorCarro =
            document.getElementById(
                "contador-carro"
            );

        const navMatriculas =
            document.getElementById(
                "nav-matriculas"
            );

        const navCoordinador =
            document.getElementById(
                "nav-coordinador"
            );

        const navNotificaciones =
            document.getElementById(
                "nav-notificaciones"
            );

        const contadorNotificaciones =
            document.getElementById(
                "contador-notificaciones"
            );

        const contenidoNotificaciones =
            document.getElementById(
                "contenido-notificaciones"
            );

        const navInicio =
            document.getElementById(
                "nav-inicio"
            );

        const navCursos =
            document.getElementById(
                "nav-cursos"
            );

        const navAreas =
            document.getElementById(
                "nav-areas"
            );

        const botonLogout =
            document.getElementById(
                "boton-logout"
            );


        // ====================================================
        // MARCAR PÁGINA ACTIVA
        // ====================================================

        function marcarPaginaActiva() {

            const ruta =
                window.location.pathname;

            const elementos = [
                navInicio,
                navCursos,
                navAreas,
                navMatriculas,
                navCoordinador
            ];


            elementos.forEach(
                function (elemento) {

                    if (elemento) {

                        elemento.classList.remove(
                            "pagina-activa"
                        );
                    }
                }
            );


            if (
                ruta === "/" &&
                navInicio
            ) {

                navInicio.classList.add(
                    "pagina-activa"
                );

                return;
            }


            if (
                ruta.startsWith(
                    "/cursos/"
                ) &&
                navCursos
            ) {

                navCursos.classList.add(
                    "pagina-activa"
                );

                return;
            }


            if (
                ruta.startsWith(
                    "/areas/"
                ) &&
                navAreas
            ) {

                navAreas.classList.add(
                    "pagina-activa"
                );

                return;
            }


            if (
                ruta.startsWith(
                    "/mis-matriculas/"
                ) &&
                navMatriculas
            ) {

                navMatriculas.classList.add(
                    "pagina-activa"
                );

                return;
            }


            if (
                ruta.startsWith(
                    "/coordinador/"
                ) &&
                navCoordinador
            ) {

                navCoordinador.classList.add(
                    "pagina-activa"
                );
            }
        }


        // ====================================================
        // USUARIO AUTENTICADO
        // ====================================================

        if (
            accessToken &&
            username &&
            rol
        ) {

            navLogin.classList.add(
                "d-none"
            );

            navRegistro.classList.add(
                "d-none"
            );

            navUsuario.classList.remove(
                "d-none"
            );


            /*
            Mostramos el nombre completo.

            Si no existe, utilizamos el username
            como respaldo.
            */

            nombreUsuario.textContent =
                nombreCompleto ||
                username;


            // =================================================
            // ESTUDIANTE
            // =================================================

            if (
                rol === "ESTUDIANTE"
            ) {

                /*
                El estudiante puede navegar por la oferta
                académica y utilizar su carro de matrícula.
                */

                navInicio.classList.remove(
                    "d-none"
                );

                navCursos.classList.remove(
                    "d-none"
                );

                navAreas.classList.remove(
                    "d-none"
                );

                navCarro.classList.remove(
                    "d-none"
                );

                navMatriculas.classList.remove(
                    "d-none"
                );


                await cargarContadorCarro();
            }


            // =================================================
            // COORDINADOR
            // =================================================

            if (
                rol === "COORDINADOR"
            ) {

                /*
                El coordinador trabaja principalmente
                desde su panel de gestión.
                */

                navInicio.classList.add(
                    "d-none"
                );

                navCursos.classList.add(
                    "d-none"
                );

                navAreas.classList.add(
                    "d-none"
                );

                navCarro.classList.add(
                    "d-none"
                );

                navMatriculas.classList.add(
                    "d-none"
                );

                navCoordinador.classList.remove(
                    "d-none"
                );


                /*
                EXTENSIÓN ADICIONAL.

                Se muestra la campana únicamente al
                Coordinador Académico.
                */

                if (navNotificaciones) {

                    navNotificaciones.classList.remove(
                        "d-none"
                    );
                }


                await cargarNotificacionesCoordinador();
            }


            // =================================================
            // ADMINISTRADOR
            // EXTENSIÓN ADICIONAL
            // =================================================

            if (
                rol === "ADMIN"
            ) {

                /*
                El administrador utiliza su propio panel.

                Esta funcionalidad complementa los roles
                principales definidos para la plataforma.
                */

                navInicio.classList.add(
                    "d-none"
                );

                navCursos.classList.add(
                    "d-none"
                );

                navAreas.classList.add(
                    "d-none"
                );

                navCarro.classList.add(
                    "d-none"
                );

                navMatriculas.classList.add(
                    "d-none"
                );

                navCoordinador.classList.add(
                    "d-none"
                );

                if (navNotificaciones) {

                    navNotificaciones.classList.add(
                        "d-none"
                    );
                }
            }
        }


        // ====================================================
        // CONTADOR DEL CARRO
        // ====================================================

        async function cargarContadorCarro() {

            if (
                !accessToken ||
                rol !== "ESTUDIANTE" ||
                !contadorCarro
            ) {

                return;
            }


            try {

                const respuesta =
                    await fetch(
                        "/api/carro-matricula/",
                        {
                            headers: {

                                "Authorization":
                                    "Bearer " +
                                    accessToken
                            }
                        }
                    );


                if (!respuesta.ok) {

                    return;
                }


                const carro =
                    await respuesta.json();


                /*
                El serializer del carro devuelve sus
                elementos en una colección.

                Se consideran únicamente los elementos
                activos si el campo está disponible.
                */

                let items = [];


                if (
                    Array.isArray(
                        carro.items
                    )
                ) {

                    items =
                        carro.items;
                }


                const cantidad =
                    items.filter(
                        function (item) {

                            return (
                                item.activo ===
                                    undefined ||
                                item.activo === true
                            );
                        }
                    ).length;


                contadorCarro.textContent =
                    cantidad;


                /*
                El indicador solamente aparece cuando
                existe al menos un curso en el carro.
                */

                if (cantidad > 0) {

                    contadorCarro.classList.remove(
                        "d-none"
                    );

                } else {

                    contadorCarro.classList.add(
                        "d-none"
                    );
                }


            } catch (error) {

                /*
                Un error en el contador no debe impedir
                utilizar el resto de la navegación.
                */

                contadorCarro.classList.add(
                    "d-none"
                );
            }
        }


        // ====================================================
        // NOTIFICACIONES DEL COORDINADOR
        // EXTENSIÓN ADICIONAL
        // ====================================================

        async function cargarNotificacionesCoordinador() {

            if (
                !accessToken ||
                rol !== "COORDINADOR" ||
                !contadorNotificaciones ||
                !contenidoNotificaciones
            ) {

                return;
            }


            try {

                /*
                Se utilizan las matrículas que el coordinador
                ya tiene autorización para consultar.

                No se crea un segundo sistema de datos:
                las notificaciones se calculan desde los
                pagos reales almacenados en PostgreSQL.
                */

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

                    return;
                }


                const matriculas =
                    await respuesta.json();


                if (
                    !respuesta.ok ||
                    !Array.isArray(
                        matriculas
                    )
                ) {

                    return;
                }


                /*
                Solamente requieren revisión los pagos
                que se encuentran en estado PENDIENTE.
                */

                const pagosPendientes =
                    matriculas.filter(
                        function (matricula) {

                            return (
                                matricula.pago &&
                                matricula.pago.estado ===
                                    "PENDIENTE" &&
                                matricula.estado ===
                                    "PENDIENTE"
                            );
                        }
                    );


                const cantidad =
                    pagosPendientes.length;


                contadorNotificaciones.textContent =
                    cantidad;


                // ------------------------------------------------
                // EXISTEN PAGOS PENDIENTES
                // ------------------------------------------------

                if (cantidad > 0) {

                    contadorNotificaciones.classList.remove(
                        "d-none"
                    );


                    if (cantidad === 1) {

                        contenidoNotificaciones.textContent =
                            "Tienes 1 pago pendiente de revisión.";

                    } else {

                        contenidoNotificaciones.textContent =
                            "Tienes " +
                            cantidad +
                            " pagos pendientes de revisión.";
                    }


                    return;
                }


                // ------------------------------------------------
                // NO EXISTEN PAGOS PENDIENTES
                // ------------------------------------------------

                contadorNotificaciones.classList.add(
                    "d-none"
                );

                contenidoNotificaciones.textContent =
                    "No tienes pagos pendientes de revisión.";


            } catch (error) {

                /*
                Si la consulta de notificaciones falla,
                no bloqueamos el resto de la navegación.
                */

                contadorNotificaciones.classList.add(
                    "d-none"
                );

                contenidoNotificaciones.textContent =
                    "No fue posible consultar las notificaciones.";
            }
        }


        // ====================================================
        // CERRAR SESIÓN
        // ====================================================

        if (botonLogout) {

            botonLogout.addEventListener(
                "click",
                function () {

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
                        "/";
                }
            );
        }


        // ====================================================
        // CARGA INICIAL
        // ====================================================

        marcarPaginaActiva();

    }
);