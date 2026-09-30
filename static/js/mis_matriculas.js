/*
============================================================
MIS MATRÍCULAS - EDTECH
============================================================

Este archivo controla:

1. La validación del JWT del estudiante.
2. La consulta de sus matrículas históricas.
3. La visualización de cursos, estados y totales.
4. La información del pago simulado asociado.
5. La continuación o reintento de pagos pendientes.

Cada estudiante visualiza únicamente sus propias matrículas.
============================================================
*/


document.addEventListener(
    "DOMContentLoaded",
    async function () {

        // ====================================================
        // ELEMENTOS
        // ====================================================

        const contenedor =
            document.getElementById(
                "contenedor-matriculas"
            );

        const mensaje =
            document.getElementById(
                "mensaje-matriculas"
            );

        const cantidadMatriculas =
            document.getElementById(
                "cantidad-matriculas"
            );


        // ====================================================
        // AUTENTICACIÓN
        // ====================================================

        const token =
            localStorage.getItem(
                "accessToken"
            );

        const rol =
            localStorage.getItem(
                "rol"
            );


        if (!token) {

            window.location.href =
                "/login/";

            return;
        }


        if (rol !== "ESTUDIANTE") {

            window.location.href =
                "/";

            return;
        }


        // ====================================================
        // CARGAR MATRÍCULAS
        // ====================================================

        async function cargarMatriculas() {

            try {

                const respuesta =
                    await fetch(
                        "/api/mis-matriculas/",
                        {
                            method: "GET",

                            headers: {
                                "Authorization":
                                    "Bearer " +
                                    token
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


                const resultado =
                    await respuesta.json();


                if (!respuesta.ok) {

                    throw new Error(
                        obtenerMensajeError(
                            resultado
                        )
                    );
                }


                mostrarMatriculas(
                    resultado
                );


            } catch (error) {

                mostrarMensaje(
                    error.message,
                    "danger"
                );

                contenedor.innerHTML = "";
            }
        }


        // ====================================================
        // MOSTRAR MATRÍCULAS
        // ====================================================

        function mostrarMatriculas(
            matriculas
        ) {

            contenedor.innerHTML = "";


            // Actualizar cantidad.

            cantidadMatriculas.textContent =
                matriculas.length === 1
                    ? "1 matrícula"
                    : `${matriculas.length} matrículas`;


            // =================================================
            // SIN MATRÍCULAS
            // =================================================

            if (matriculas.length === 0) {

                contenedor.innerHTML = `

                    <div class="matriculas-vacias">

                        <h3>
                            Aún no tienes matrículas
                        </h3>

                        <p>
                            Cuando confirmes una matrícula,
                            aparecerá en este historial.
                        </p>

                        <a
                            href="/cursos/"
                            class="btn btn-primary"
                        >
                            Explorar cursos
                        </a>

                    </div>
                `;

                return;
            }


            // =================================================
            // MOSTRAR CADA MATRÍCULA
            // =================================================

            matriculas.forEach(
                function (matricula) {

                    const tarjeta =
                        document.createElement(
                            "article"
                        );

                    tarjeta.className =
                        "tarjeta-matricula";


                    // =========================================
                    // CURSOS
                    // =========================================

                    let cursosHTML = "";


                    matricula.detalles.forEach(
                        function (detalle) {

                            cursosHTML += `

                                <div class="curso-matriculado">

                                    <div>
                                        <strong>
                                            ${escaparHTML(
                                                detalle.curso_titulo
                                            )}
                                        </strong>
                                    </div>

                                    <span>
                                        $${formatearNumero(
                                            detalle.precio
                                        )}
                                    </span>

                                </div>
                            `;
                        }
                    );


                    // =========================================
                    // INFORMACIÓN DEL PAGO
                    // =========================================

                    const informacionPago =
                        obtenerInformacionPago(
                            matricula
                        );


                    // =========================================
                    // TARJETA
                    // =========================================

                    tarjeta.innerHTML = `

                        <div class="matricula-encabezado">

                            <div>

                                <span class="etiqueta-seccion">
                                    MATRÍCULA
                                </span>

                                <h3>
                                    Matrícula #${matricula.id}
                                </h3>

                                <span class="fecha-matricula">
                                    ${formatearFechaHora(
                                        matricula.fecha_creacion
                                    )}
                                </span>

                            </div>


                            <span class="
                                estado-matricula
                                ${claseEstado(
                                    matricula.estado
                                )}
                            ">
                                ${escaparHTML(
                                    matricula.estado_nombre
                                )}
                            </span>

                        </div>


                        <div class="matricula-cursos">

                            ${cursosHTML}

                        </div>


                        <div class="matricula-pie">

                            <div class="informacion-pago-matricula">

                                <strong>
                                    Pago
                                </strong>

                                ${informacionPago.descripcion}

                            </div>


                            <div class="matricula-acciones">

                                ${informacionPago.boton}

                                <div class="matricula-total">

                                    <span>
                                        Total
                                    </span>

                                    <strong>
                                        $${formatearNumero(
                                            matricula.total
                                        )}
                                    </strong>

                                </div>

                            </div>

                        </div>
                    `;


                    contenedor.appendChild(
                        tarjeta
                    );
                }
            );
        }


        // ====================================================
        // INFORMACIÓN DEL PAGO
        // ====================================================

        function obtenerInformacionPago(
            matricula
        ) {

            const pago =
                matricula.pago;


            // =================================================
            // MATRÍCULA CANCELADA
            // =================================================

            if (
                matricula.estado ===
                "CANCELADO"
            ) {

                return {

                    descripcion: `
                        <span
                            class="
                                estado-pago-historial
                                pago-rechazado
                            "
                        >
                            Matrícula cancelada
                        </span>
                    `,

                    boton: ""
                };
            }


            // =================================================
            // MATRÍCULA COMPLETADA
            // =================================================

            if (
                matricula.estado ===
                "COMPLETADO"
            ) {

                const metodo =
                    pago &&
                    pago.metodo_pago_nombre
                        ? escaparHTML(
                            pago.metodo_pago_nombre
                        )
                        : null;


                return {

                    descripcion: `
                        <span
                            class="
                                estado-pago-historial
                                pago-aprobado
                            "
                        >
                            ${
                                metodo
                                    ? `${metodo} · Pago aprobado · Curso completado`
                                    : "Pago aprobado · Curso completado"
                            }
                        </span>
                    `,

                    boton: ""
                };
            }


            // =================================================
            // MATRÍCULA PAGADA
            // =================================================

            if (
                matricula.estado ===
                "PAGADO"
            ) {

                const metodo =
                    pago &&
                    pago.metodo_pago_nombre
                        ? escaparHTML(
                            pago.metodo_pago_nombre
                        )
                        : null;


                return {

                    descripcion: `
                        <span
                            class="
                                estado-pago-historial
                                pago-aprobado
                            "
                        >
                            ${
                                metodo
                                    ? `${metodo} · Pago aprobado`
                                    : "Pago aprobado"
                            }
                        </span>
                    `,

                    boton: ""
                };
            }


            // =================================================
            // PENDIENTE SIN PAGO
            // =================================================

            if (!pago) {

                return {

                    descripcion: `
                        <span
                            class="
                                estado-pago-historial
                                pago-sin-realizar
                            "
                        >
                            Aún no has realizado el pago
                        </span>
                    `,

                    boton: `
                        <a
                            href="/pago/${matricula.id}/"
                            class="btn btn-primary btn-sm"
                        >
                            Realizar pago
                        </a>
                    `
                };
            }


            // =================================================
            // PAGO EN REVISIÓN
            // =================================================

            if (
                pago.estado ===
                "PENDIENTE"
            ) {

                const metodo =
                    pago.metodo_pago_nombre
                        ? escaparHTML(
                            pago.metodo_pago_nombre
                        )
                        : "Método registrado";


                return {

                    descripcion: `
                        <span
                            class="
                                estado-pago-historial
                                pago-en-revision
                            "
                        >
                            ${metodo} · En revisión
                        </span>
                    `,

                    boton: ""
                };
            }


            // =================================================
            // PAGO RECHAZADO
            // =================================================

            if (
                pago.estado ===
                "RECHAZADO"
            ) {

                const metodo =
                    pago.metodo_pago_nombre
                        ? escaparHTML(
                            pago.metodo_pago_nombre
                        )
                        : null;


                return {

                    descripcion: `
                        <span
                            class="
                                estado-pago-historial
                                pago-rechazado
                            "
                        >
                            ${
                                metodo
                                    ? `${metodo} · Pago rechazado`
                                    : "Pago rechazado"
                            }
                        </span>
                    `,

                    boton: `
                        <a
                            href="/pago/${matricula.id}/"
                            class="btn btn-outline-primary btn-sm"
                        >
                            Reintentar pago
                        </a>
                    `
                };
            }


            // =================================================
            // PAGO APROBADO
            // =================================================

            if (
                pago.estado ===
                "APROBADO"
            ) {

                const metodo =
                    pago.metodo_pago_nombre
                        ? escaparHTML(
                            pago.metodo_pago_nombre
                        )
                        : null;


                return {

                    descripcion: `
                        <span
                            class="
                                estado-pago-historial
                                pago-aprobado
                            "
                        >
                            ${
                                metodo
                                    ? `${metodo} · Pago aprobado`
                                    : "Pago aprobado"
                            }
                        </span>
                    `,

                    boton: ""
                };
            }


            // =================================================
            // RESPALDO
            // =================================================

            return {

                descripcion: `
                    <span>
                        Estado de pago no disponible
                    </span>
                `,

                boton: ""
            };
        }


        // ====================================================
        // CLASE SEGÚN ESTADO DE MATRÍCULA
        // ====================================================

        function claseEstado(
            estado
        ) {

            if (estado === "PAGADO") {

                return "estado-pagado";
            }


            if (estado === "CANCELADO") {

                return "estado-cancelado";
            }


            if (estado === "COMPLETADO") {

                return "estado-completado";
            }


            return "estado-pendiente";
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
        }


        // ====================================================
        // MENSAJE PROCEDENTE DEL PORTAL DE PAGO
        // ====================================================

        function mostrarMensajePago() {

            const mensajePago =
                sessionStorage.getItem(
                    "mensajeMatricula"
                );


            if (!mensajePago) {

                return;
            }


            mostrarMensaje(
                mensajePago,
                "success"
            );


            // Se elimina para evitar mostrarlo nuevamente
            // al recargar la página.

            sessionStorage.removeItem(
                "mensajeMatricula"
            );
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


            return (
                "No fue posible cargar " +
                "las matrículas."
            );
        }


        // ====================================================
        // ESCAPAR TEXTO
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
        // FORMATO DE FECHA Y HORA
        // ====================================================

        function formatearFechaHora(
            fecha
        ) {

            if (!fecha) {

                return "-";
            }


            const objetoFecha =
                new Date(fecha);


            return objetoFecha.toLocaleString(
                "es-CL",
                {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );
        }


        // ====================================================
        // CERRAR SESIÓN
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

        mostrarMensajePago();

        await cargarMatriculas();

    }
);