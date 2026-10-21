
 // ==========================================
 // 1. ELEMENTOS HTML
 // ==========================================

 // Contraseña
 const passwordInput = document.getElementById("password");
 const togglePassword = document.getElementById("togglePassword");
 const passwordRules = document.getElementById("password-rules");

 // Confirmar contraseña
 const confirmPasswordInput = document.getElementById("confirm-password");
 const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");
 const confirmStatus = document.getElementById("confirm-status");
 const confirmIcon = document.getElementById("confirm-icon");

 // Formulario
 const registerForm = document.getElementById("register-form");
 const message = document.getElementById("form-message");

 // Reglas de contraseña
 const reglaMayuscula = document.getElementById("rule-upper");
 const reglaMinuscula = document.getElementById("rule-lower");
 const reglaNumero = document.getElementById("rule-number");
 const reglaCarEspecial = document.getElementById("rule-special");
 const reglaCaracteres = document.getElementById("rule-length");

 // Iconos
 const iconoMayuscula = reglaMayuscula.querySelector("i");
 const iconoMinuscula = reglaMinuscula.querySelector("i");
 const iconoNumero = reglaNumero.querySelector("i");
 const iconoCarEspecial = reglaCarEspecial.querySelector("i");
 const iconoCaracteres = reglaCaracteres.querySelector("i");


 // ==========================================
 // 2. MOSTRAR Y OCULTAR CONTRASEÑAS
 // ==========================================

 function configurarVisibilidad(input, boton) {

   boton.addEventListener("click", () => {

     const icono = boton.querySelector("i");

     if (input.type === "password") {
       input.type = "text";
       icono.className = "bi bi-eye-slash";

       boton.setAttribute("aria-label", "Ocultar contraseña");
       boton.setAttribute("aria-pressed", "true");

     } else {
       ocultarPassword(input, boton);
     }

   });
 }

 function ocultarPassword(input, boton) {

   input.type = "password";

   const icono = boton.querySelector("i");
   icono.className = "bi bi-eye";

   boton.setAttribute("aria-label", "Mostrar contraseña");
   boton.setAttribute("aria-pressed", "false");
 }

 configurarVisibilidad(passwordInput, togglePassword);
 configurarVisibilidad(confirmPasswordInput, toggleConfirmPassword);


 // ==========================================
 // 3. VALIDACIONES VISUALES
 // ==========================================

 function actualizarValidacion(icono, cumple) {

   if (cumple) {
     icono.className = "bi bi-check-circle-fill text-success";
   } else {
     icono.className = "bi bi-x-circle-fill text-danger";
   }

 }

 function validacionPasswordVisual() {

   const password = passwordInput.value;

   const regexMayuscula = /[A-Z]/;
   const regexMinuscula = /[a-z]/;
   const regexNumero = /[0-9]/;
   const regexCarEspecial = /[!@#$%^&*?_-]/;

   actualizarValidacion(
     iconoMayuscula,
     regexMayuscula.test(password)
   );

   actualizarValidacion(
     iconoMinuscula,
     regexMinuscula.test(password)
   );

   actualizarValidacion(
     iconoNumero,
     regexNumero.test(password)
   );

   actualizarValidacion(
     iconoCarEspecial,
     regexCarEspecial.test(password)
   );

   actualizarValidacion(
     iconoCaracteres,
     password.length >= 8
   );
 }


 // ==========================================
 // 4. CONFIRMAR CONTRASEÑA
 // ==========================================

 function validarConfirmacion() {

   const password = passwordInput.value;
   const confirmPassword = confirmPasswordInput.value;

   // No mostrar iconos si la confirmación está vacía
   if (confirmPassword.length === 0) {
     confirmStatus.classList.add("d-none");
     return;
   }

   confirmStatus.classList.remove("d-none");

   if (password === confirmPassword) {
     confirmIcon.className = "bi bi-check-circle-fill text-success";
   } else {
     confirmIcon.className = "bi bi-x-circle-fill text-danger";
   }

 }


 // ==========================================
 // 5. EVENTOS
 // ==========================================

 // Mostrar globo
 passwordInput.addEventListener("focus", () => {
   passwordRules.classList.add("show");
 });

 // Ocultar globo
 passwordInput.addEventListener("blur", () => {
   passwordRules.classList.remove("show");
 });

 // Validaciones mientras se escribe
 passwordInput.addEventListener("input", validacionPasswordVisual);

 // Comparar contraseñas mientras se escribe
 passwordInput.addEventListener("input", validarConfirmacion);
 confirmPasswordInput.addEventListener("input", validarConfirmacion);


 // ==========================================
 // 6. REGISTRO DE USUARIO
 // ==========================================

 registerForm.addEventListener("submit", (event) => {

   event.preventDefault();
   message.className = "alert d-none";

   const password = passwordInput.value;
   const confirmPassword = confirmPasswordInput.value;

   // Comprobar coincidencia
   if (password !== confirmPassword) {

     message.textContent = "Las contraseñas no coinciden.";
     message.className = "alert alert-danger";

     return;
   }

   try {

     registerUser({
       name: registerForm.elements.namedItem("name").value,
       telefono: registerForm.elements.namedItem("telefono").value,
       email: registerForm.elements.namedItem("email").value,
       password
     });

     // Registro exitoso
     message.textContent =
       "Cuenta creada. Ahora inicia sesión con tu correo y contraseña.";

     message.className = "alert alert-success";

     // Limpiar formulario
     registerForm.reset();

     // Reiniciar validaciones
     validacionPasswordVisual();
     validarConfirmacion();

     // Ocultar globo
     passwordRules.classList.remove("show");

     // Restaurar los dos ojos
     ocultarPassword(passwordInput, togglePassword);
     ocultarPassword(confirmPasswordInput, toggleConfirmPassword);

   } catch (error) {

     message.textContent = error.message;
     message.className = "alert alert-danger";

   }

 });
