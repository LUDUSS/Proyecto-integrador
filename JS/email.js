emailjs.init({
    publicKey: "yDN5F2nQ1z8xdgDF-"
});

const formulario = document.getElementById("formularioContacto");
const mensajeEstado = document.getElementById("mensajeEstado");



formulario.addEventListener("submit", function(event) {

    event.preventDefault();

    if (!formulario.checkValidity()){

        formulario.classList.add("was-validated");

        const primerError = formulario.querySelector(":Invalid");
        if (primerError) primerError.focus();

        mensajeEstado.innerHTML= `
        <p class= "text-danger mb-0">
            Por favor corrige los campos marcados en rojo.
            </p>`;
            return;
    }

    const botonEnviar = formulario.querySelector('button[type="submit"]');
    if (botonEnviar) {
        botonEnviar.disabled= true; 
        botonEnviar.textContent= "Enviando..."

    }

    emailjs.sendForm(
        "service_8j495qm",
        "template_9f07x4w",
        formulario
    )
    .then(function() {

        mensajeEstado.innerHTML = `
            <p class="text-success">
                ¡Mensaje enviado correctamente!
            </p>`;

        formulario.reset();
        formulario.classList.remove("was-validated");

        if (botonEnviar){
            botonEnviar.disabled=false;
            botonEnviar.textContent="Enviar mensaje";
        }
    })
    .catch(function(error) {

        console.log(error);

        mensajeEstado.innerHTML = `
            <p class="text-danger">
                Ocurrió un error al enviar el mensaje.
            </p>
        `;

        if (botonEnviar){
            botonEnviar.disabled=false; 
            botonEnviar.textContent="Enviar mensaje";
        }

    });

});