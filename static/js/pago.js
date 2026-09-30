/*
============================================================
PORTAL DE PAGO SIMULADO - EDTECH
============================================================

Este archivo controla:

1. La validación del JWT del estudiante.
2. La carga de la matrícula seleccionada.
3. La visualización de sus cursos y total.
4. La selección del método de pago simulado.
5. El envío de la solicitud de pago.
6. La redirección al historial de matrículas.

No se solicitan ni almacenan datos bancarios reales.
============================================================
*/


document.addEventListener(
    "DOMContentLoaded",
    async function () {

        // ====================================================
        // ELEMENTOS
        // ====================================================

        const datosPago =
            document.getElementById("datos-pago");

        const contenedorDetalle =
            document.getElementById(
                "contenedor-detalle-pago"
            );

        const numeroMatricula =
            document.getElementById(
                "numero-matricula"
            );

        const totalPago =
            document.getElementById(
                "total-pago"
            );

        const botonRealizarPago =
            document.getElementById(
                "boton-realizar-pago"
            );

        const mensajePago =
            document.getElementById(
                "mensaje-pago"
            );

        const opcionesMetodo =
            document.querySelectorAll(
                'input[name="metodo-pago"]'
            );


        // ====================================================
        // DATOS DE SESIÓN
        // ====================================================

        const accessToken =
            localStorage.getItem("accessToken");

        const rol =
            localStorage.getItem("rol");

        const matriculaId =
            datosPago
                ? datosPago.dataset.matriculaId
                : null;


        // ====================================================
        // VALIDAR AUTENTICACIÓN
        // ====================================================

        if (!accessToken) {

            window.location.href = "/login/";

            return;
        }


        if (rol !== "ESTUDIANTE") {

            window.location.href = "/";

            return;
        }


        if (!matriculaId) {

            mostrarError(
                "No fue posible identificar la matrícula."
            );

            return;
        }


        // ====================================================
        // VARIABLES
        // ====================================================

        let matriculaActual = null;

        let metodoSeleccionado = null;


        // ====================================================
        // FORMATEAR MONEDA
        // ====================================================

        function formatearMoneda(valor) {

            const numero = Number(valor || 0);

            return new Intl.NumberFormat(
                "es-CL",
                {
                    style: "currency",
                    currency: "CLP",
                    maximumFractionDigits: 0
                }
            ).format(numero);
        }


        // ====================================================
        // ESCAPAR TEXTO
        // ====================================================

        function escaparHTML(texto) {

            const elemento =
                document.createElement("div");

            elemento.textContent =
                texto === null ||
                texto === undefined
                    ? ""
                    : String(texto);

            return elemento.innerHTML;
        }


        // ====================================================
        // MOSTRAR MENSAJE
        // ====================================================

        function mostrarMensaje(
            texto,
            tipo = "success"
        ) {

            mensajePago.innerHTML = `
                <div
                    class="alert alert-${tipo}"
                    role="alert"
                >
                    ${escaparHTML(texto)}
                </div>
            `;
        }


        // ====================================================
        // MOSTRAR ERROR PRINCIPAL
        // ====================================================

        function mostrarError(texto) {

            mostrarMensaje(
                texto,
                "danger"
            );

            contenedorDetalle.innerHTML = `
                <div class="pago-cargando">
                    <span>
                        ${escaparHTML(texto)}
                    </span>
                </div>
            `;

            botonRealizarPago.disabled = true;
        }


        // ====================================================
        // OBTENER DETALLES
        // ====================================================

        function obtenerDetalles(matricula) {

            if (
                Array.isArray(
                    matricula.detalles
                )
            ) {

                return matricula.detalles;
            }

            return [];
        }


        // ====================================================
        // MOSTRAR MATRÍCULA
        // ====================================================

        function mostrarMatricula(matricula) {

            matriculaActual = matricula;

            numeroMatricula.textContent =
                `Matrícula #${matricula.id}`;

            totalPago.textContent =
                formatearMoneda(
                    matricula.total
                );


            const detalles =
                obtenerDetalles(matricula);


            if (detalles.length === 0) {

                contenedorDetalle.innerHTML = `
                    <div class="pago-cargando">
                        <span>
                            Esta matrícula no posee cursos.
                        </span>
                    </div>
                `;

                botonRealizarPago.disabled = true;

                return;
            }


            let html = "";


            detalles.forEach(
                function (detalle) {

                    const titulo =
                        detalle.curso_titulo ||
                        detalle.titulo ||
                        "Curso";

                    const area =
                        detalle.area_nombre ||
                        detalle.curso_area ||
                        "";

                    const precio =
                        detalle.precio || 0;


                    html += `
                        <article class="item-detalle-pago">

                            <div class="informacion-curso-pago">

                                ${
                                    area
                                        ? `
                                            <span
                                                class="area-curso-pago"
                                            >
                                                ${escaparHTML(area)}
                                            </span>
                                        `
                                        : ""
                                }

                                <h3>
                                    ${escaparHTML(titulo)}
                                </h3>

                                <p>
                                    Incluido en esta matrícula.
                                </p>

                            </div>

                            <div class="precio-curso-pago">
                                ${formatearMoneda(precio)}
                            </div>

                        </article>
                    `;
                }
            );


            contenedorDetalle.innerHTML = html;


            // Solamente una matrícula pendiente
            // puede iniciar un pago.

            if (
                matricula.estado !==
                "PENDIENTE"
            ) {

                mostrarMensaje(
                    "Esta matrícula ya no se encuentra pendiente de pago.",
                    "info"
                );

                opcionesMetodo.forEach(
                    function (opcion) {

                        opcion.disabled = true;
                    }
                );

                botonRealizarPago.disabled = true;
            }
        }


        // ====================================================
        // CARGAR MATRÍCULA
        // ====================================================

        async function cargarMatricula() {

            try {

                const respuesta =
                    await fetch(
                        `/api/pagos/matricula/${matriculaId}/`,
                        {
                            method: "GET",

                            headers: {
                                "Authorization":
                                    `Bearer ${accessToken}`
                            }
                        }
                    );


                if (
                    respuesta.status === 401 ||
                    respuesta.status === 403
                ) {

                    localStorage.removeItem(
                        "accessToken"
                    );

                    localStorage.removeItem(
                        "refreshToken"
                    );

                    window.location.href =
                        "/login/";

                    return;
                }


                const datos =
                    await respuesta.json();


                if (!respuesta.ok) {

                    mostrarError(
                        datos.detail ||
                        "No fue posible cargar la matrícula."
                    );

                    return;
                }


                mostrarMatricula(datos);

            } catch (error) {

                mostrarError(
                    "No fue posible conectar con el servidor."
                );
            }
        }


        // ====================================================
        // SELECCIONAR MÉTODO
        // ====================================================

        opcionesMetodo.forEach(
            function (opcion) {

                opcion.addEventListener(
                    "change",
                    function () {

                        metodoSeleccionado =
                            this.value;

                        if (
                            matriculaActual &&
                            matriculaActual.estado ===
                            "PENDIENTE"
                        ) {

                            botonRealizarPago.disabled =
                                false;
                        }
                    }
                );
            }
        );


        // ====================================================
        // REALIZAR PAGO SIMULADO
        // ====================================================

        async function realizarPago() {

            if (!metodoSeleccionado) {

                mostrarMensaje(
                    "Selecciona Débito o Crédito para continuar.",
                    "warning"
                );

                return;
            }


            botonRealizarPago.disabled = true;

            botonRealizarPago.textContent =
                "Procesando...";


            try {

                const respuesta =
                    await fetch(
                        `/api/pagos/matricula/${matriculaId}/realizar/`,
                        {
                            method: "POST",

                            headers: {
                                "Authorization":
                                    `Bearer ${accessToken}`,

                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                metodo_pago:
                                    metodoSeleccionado
                            })
                        }
                    );


                const datos =
                    await respuesta.json();


                if (
                    respuesta.status === 401 ||
                    respuesta.status === 403
                ) {

                    localStorage.removeItem(
                        "accessToken"
                    );

                    localStorage.removeItem(
                        "refreshToken"
                    );

                    window.location.href =
                        "/login/";

                    return;
                }


                if (!respuesta.ok) {

                    mostrarMensaje(
                        datos.detail ||
                        "No fue posible realizar el pago.",
                        "danger"
                    );

                    botonRealizarPago.disabled =
                        false;

                    botonRealizarPago.textContent =
                        "Realizar pago";

                    return;
                }


                // Guardamos un mensaje temporal para mostrarlo
                // posteriormente en Mis Matrículas.

                sessionStorage.setItem(
                    "mensajeMatricula",
                    datos.detail ||
                    "Pago enviado correctamente."
                );


                window.location.href =
                    "/mis-matriculas/";

            } catch (error) {

                mostrarMensaje(
                    "No fue posible conectar con el servidor.",
                    "danger"
                );

                botonRealizarPago.disabled =
                    false;

                botonRealizarPago.textContent =
                    "Realizar pago";
            }
        }


        // ====================================================
        // EVENTO DEL BOTÓN
        // ====================================================

        botonRealizarPago.addEventListener(
            "click",
            realizarPago
        );


        // ====================================================
        // CARGA INICIAL
        // ====================================================

        await cargarMatricula();

    }
);