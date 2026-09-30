/*
============================================================
CARRO DE MATRÍCULA - EDTECH
============================================================

Este archivo controla:

1. La validación del JWT del estudiante.
2. La carga del carro persistente desde la API.
3. La visualización de los cursos seleccionados.
4. La eliminación lógica de cursos del carro.
5. La confirmación de la matrícula.

El carro permanece almacenado en la base de datos y
asociado al usuario aunque cierre sesión.
============================================================
*/


document.addEventListener(
    "DOMContentLoaded",
    async function () {

        // ====================================================
        // ELEMENTOS
        // ====================================================

        const contenedorCarro =
            document.getElementById(
                "contenedor-carro"
            );

        const cantidadCursos =
            document.getElementById(
                "cantidad-cursos"
            );

        const totalCarro =
            document.getElementById(
                "total-carro"
            );

        const botonConfirmar =
            document.getElementById(
                "boton-confirmar-matricula"
            );

        const mensaje =
            document.getElementById(
                "mensaje-carro"
            );


        // ====================================================
        // OBTENER DATOS DE SESIÓN
        // ====================================================

        const token =
            localStorage.getItem(
                "accessToken"
            );

        const rol =
            localStorage.getItem(
                "rol"
            );


        // ====================================================
        // VALIDAR AUTENTICACIÓN
        // ====================================================

        if (!token) {

            window.location.href =
                "/login/";

            return;
        }


        // Solo los estudiantes utilizan el carro.
        if (rol !== "ESTUDIANTE") {

            window.location.href =
                "/";

            return;
        }


        // ====================================================
        // CARGAR CARRO
        // ====================================================

        async function cargarCarro() {

            contenedorCarro.innerHTML = `
                <p class="text-muted">
                    Cargando carro...
                </p>
            `;


            try {

                const respuesta =
                    await fetch(
                        "/api/carro-matricula/",
                        {
                            method:
                                "GET",

                            headers: {

                                "Authorization":
                                    "Bearer " +
                                    token
                            }
                        }
                    );


                // Token inválido o vencido.
                if (
                    respuesta.status === 401
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


                mostrarCarro(
                    resultado
                );


            } catch (error) {

                contenedorCarro.innerHTML = `
                    <div class="alert alert-danger">
                        ${error.message}
                    </div>
                `;
            }
        }


        // ====================================================
        // MOSTRAR CARRO
        // ====================================================

        function mostrarCarro(carro) {

            contenedorCarro.innerHTML =
                "";


            const items =
                carro.items || [];


            cantidadCursos.textContent =
                items.length;


            totalCarro.textContent =
                "$" +
                formatearNumero(
                    carro.total || 0
                );


            // Carro vacío.
            if (items.length === 0) {

                botonConfirmar.disabled =
                    true;


                contenedorCarro.innerHTML = `
                    <div class="carro-vacio">

                        <h3>
                            Tu carro está vacío
                        </h3>

                        <p>
                            Aún no has agregado cursos
                            a tu matrícula.
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


            botonConfirmar.disabled =
                false;


            // Mostrar cada curso agregado.
            items.forEach(
                function (item) {

                    const tarjeta =
                        document.createElement(
                            "article"
                        );


                    tarjeta.className =
                        "item-carro";


                    tarjeta.innerHTML = `

                        <div class="item-carro-info">

                            <span class="hero-etiqueta">
                                CURSO
                            </span>

                            <h3>
                                ${item.curso_titulo}
                            </h3>

                            <span class="text-muted">
                                Matrícula
                            </span>

                            <strong class="precio-carro">
                                $${formatearNumero(
                                    item.costo
                                )}
                            </strong>

                        </div>


                        <div class="item-carro-acciones">

                            <button
                                type="button"
                                class="btn btn-outline-danger
                                       boton-eliminar-item"
                                data-item-id="${item.id}"
                            >
                                Eliminar
                            </button>

                        </div>
                    `;


                    contenedorCarro.appendChild(
                        tarjeta
                    );
                }
            );


            configurarBotonesEliminar();
        }


        // ====================================================
        // CONFIGURAR BOTONES ELIMINAR
        // ====================================================

        function configurarBotonesEliminar() {

            const botones =
                document.querySelectorAll(
                    ".boton-eliminar-item"
                );


            botones.forEach(
                function (boton) {

                    boton.addEventListener(
                        "click",
                        async function () {

                            await eliminarItem(
                                boton.dataset.itemId
                            );
                        }
                    );
                }
            );
        }


        // ====================================================
        // ELIMINAR CURSO DEL CARRO
        // ====================================================

        async function eliminarItem(
            itemId
        ) {

            try {

                const respuesta =
                    await fetch(
                        "/api/carro-matricula/" +
                        itemId +
                        "/",
                        {
                            method:
                                "DELETE",

                            headers: {

                                "Authorization":
                                    "Bearer " +
                                    token
                            }
                        }
                    );


                if (
                    respuesta.status === 401
                ) {

                    cerrarSesion();

                    return;
                }


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
                    "Curso eliminado del carro.",
                    "success"
                );


                await cargarCarro();


            } catch (error) {

                mostrarMensaje(
                    error.message,
                    "danger"
                );
            }
        }


        // ====================================================
        // CONFIRMAR MATRÍCULA
        // ====================================================

        botonConfirmar.addEventListener(
            "click",
            async function () {

                /*
                Evita múltiples solicitudes mientras
                se procesa la confirmación.
                */

                botonConfirmar.disabled =
                    true;


                try {

                    const respuesta =
                        await fetch(
                            "/api/matriculas/confirmar/",
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
                                    JSON.stringify({})
                            }
                        );


                    if (
                        respuesta.status === 401
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


                    // ====================================================
                    // MATRÍCULA CREADA CORRECTAMENTE
                    // ====================================================

                    /*
                    El backend devuelve la matrícula recién creada.
                    Utilizamos su ID para continuar directamente
                    hacia el Portal de Pago.
                    */

                    if (!resultado.id) {

                        mostrarMensaje(
                            "La matrícula fue creada, pero no fue posible iniciar el pago.",
                            "danger"
                        );

                        botonConfirmar.disabled =
                            false;

                        return;
                    }


                    /*
                    Redirige al estudiante al Portal de Pago
                    correspondiente a la matrícula creada.
                    */

                    window.location.href =
                        `/pago/${resultado.id}/`;

                    return;


                } catch (error) {

                    mostrarMensaje(
                        error.message,
                        "danger"
                    );


                    botonConfirmar.disabled =
                        false;
                }
            }
        );


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
                "No fue posible completar " +
                "la operación."
            );
        }


        // ====================================================
        // FORMATO DE NÚMEROS
        // ====================================================

        function formatearNumero(numero) {

            return Number(
                numero
            ).toLocaleString(
                "es-CL"
            );
        }


        // ====================================================
        // CERRAR SESIÓN SI EL TOKEN NO ES VÁLIDO
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
                "rol"
            );


            window.location.href =
                "/login/";
        }


        // ====================================================
        // CARGA INICIAL
        // ====================================================

        await cargarCarro();
    }
);