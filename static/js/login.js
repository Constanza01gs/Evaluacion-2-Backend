/*
============================================================
INICIO DE SESIÓN - EDTECH
============================================================

Este archivo autentica al usuario mediante JWT.

Los tokens y la información básica del usuario se almacenan
en localStorage para utilizarlos posteriormente en las
peticiones protegidas y en la interfaz.
============================================================
*/


document.addEventListener(
    "DOMContentLoaded",
    function () {

        // ====================================================
        // ELEMENTOS
        // ====================================================

        const formulario =
            document.getElementById("form-login");

        const mensaje =
            document.getElementById("mensaje-login");

        const boton =
            document.getElementById("boton-login");


        // ====================================================
        // LOGIN
        // ====================================================

        formulario.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                boton.disabled = true;
                boton.textContent = "Ingresando...";

                mensaje.className = "d-none";
                mensaje.textContent = "";


                const datos = {

                    username:
                        document.getElementById(
                            "username"
                        ).value.trim(),

                    password:
                        document.getElementById(
                            "password"
                        ).value
                };


                try {

                    const respuesta = await fetch(
                        "/api/token/",
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

                        throw new Error(
                            "Usuario o contraseña incorrectos."
                        );
                    }


                    // ========================================
                    // GUARDAR JWT E INFORMACIÓN DEL USUARIO
                    // ========================================

                    localStorage.setItem(
                        "accessToken",
                        resultado.access
                    );

                    localStorage.setItem(
                        "refreshToken",
                        resultado.refresh
                    );

                    localStorage.setItem(
                        "username",
                        resultado.username
                    );

                    localStorage.setItem(
                        "nombreCompleto",
                        resultado.nombre_completo
                    );

                    localStorage.setItem(
                        "rol",
                        resultado.rol
                    );


                    // ========================================
                    // REDIRECCIÓN SEGÚN ROL
                    // ========================================

                    if (
                        resultado.rol === "ADMIN"
                    ) {

                        // EXTENSIÓN ADICIONAL:
                        // acceso al panel del administrador.
                        window.location.href =
                            "/admin-plataforma/";

                    } else if (
                        resultado.rol === "COORDINADOR"
                    ) {

                        window.location.href =
                            "/coordinador/";

                    } else if (
                        resultado.rol === "ESTUDIANTE"
                    ) {

                        window.location.href =
                            "/cursos/";

                    } else {

                        // Si el backend devuelve un rol no
                        // reconocido, se eliminan los datos
                        // almacenados para evitar una sesión
                        // inválida.

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

                        throw new Error(
                            "El usuario no posee un rol válido."
                        );
                    }

                } catch (error) {

                    mensaje.className =
                        "alert alert-danger";

                    mensaje.textContent =
                        error.message;

                } finally {

                    boton.disabled = false;

                    boton.textContent =
                        "Iniciar sesión";
                }
            }
        );
    }
);