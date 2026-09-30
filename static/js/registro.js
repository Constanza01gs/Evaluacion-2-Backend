/*
============================================================
REGISTRO DE ESTUDIANTES - EDTECH
============================================================

Este archivo envía el formulario de registro a la API
y muestra el resultado al usuario.
============================================================
*/


document.addEventListener(
    "DOMContentLoaded",
    function () {

        // ====================================================
        // ELEMENTOS
        // ====================================================

        const formulario =
            document.getElementById("form-registro");

        const mensaje =
            document.getElementById("mensaje-registro");

        const boton =
            document.getElementById("boton-registro");


        // ====================================================
        // REGISTRO
        // ====================================================

        formulario.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                boton.disabled = true;
                boton.textContent = "Creando cuenta...";

                mensaje.className = "d-none";
                mensaje.textContent = "";


                const datos = {

                    first_name:
                        document.getElementById(
                            "nombre"
                        ).value.trim(),

                    last_name:
                        document.getElementById(
                            "apellido"
                        ).value.trim(),

                    username:
                        document.getElementById(
                            "username"
                        ).value.trim(),

                    email:
                        document.getElementById(
                            "email"
                        ).value.trim(),

                    password:
                        document.getElementById(
                            "password"
                        ).value,

                    password_confirmacion:
                        document.getElementById(
                            "password-confirmacion"
                        ).value
                };


                try {

                    const respuesta = await fetch(
                        "/api/registro/",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify(datos)
                        }
                    );


                    const resultado =
                        await respuesta.json();


                    if (!respuesta.ok) {

                        let errores = [];

                        for (
                            const campo
                            in resultado
                        ) {

                            const valor =
                                resultado[campo];

                            if (Array.isArray(valor)) {
                                errores.push(
                                    valor.join(" ")
                                );
                            } else {
                                errores.push(valor);
                            }
                        }

                        throw new Error(
                            errores.join(" ")
                        );
                    }


                    mensaje.className =
                        "alert alert-success";

                    mensaje.textContent =
                        "Cuenta creada correctamente. " +
                        "Ahora puedes iniciar sesión.";

                    formulario.reset();


                    // Redirige al login después del registro.
                    setTimeout(
                        function () {
                            window.location.href =
                                "/login/";
                        },
                        1200
                    );

                } catch (error) {

                    mensaje.className =
                        "alert alert-danger";

                    mensaje.textContent =
                        error.message;

                } finally {

                    boton.disabled = false;

                    boton.textContent =
                        "Crear cuenta";
                }
            }
        );
    }
);