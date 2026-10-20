$(function() {
	
	$(document).on({
		mouseover: function(event) {
			$(this).find('.far').addClass('star-over');
			$(this).prevAll().find('.far').addClass('star-over');
		},
		mouseleave: function(event) {
			$(this).find('.far').removeClass('star-over');
			$(this).prevAll().find('.far').removeClass('star-over');
		}
	}, '#formulario-resenia .rate');

  // #formulario-resenias ayudaa que solo se puede modificar en el formulariuo de creación y no después de crearla
	$(document).on('click', '#formulario-resenia .rate', function() {
		if ( !$(this).find('.star').hasClass('rate-active') ) {
			$(this).siblings().find('.star').addClass('far').removeClass('fas rate-active');
			$(this).find('.star').addClass('rate-active fas').removeClass('far star-over');
			$(this).prevAll().find('.star').addClass('fas').removeClass('far star-over');
		} else {
			console.log('has');
		}
	});
	
});

document.addEventListener("DOMContentLoaded", () => {
    const menuLateralElement = document.getElementById('menuLateral');
    
    // Verificamos si Bootstrap y el offcanvas están disponibles
    if (menuLateralElement && typeof bootstrap !== 'undefined') {
        const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(menuLateralElement);

        // Seleccionar todos los enlaces dentro del menú lateral
        const navLinks = menuLateralElement.querySelectorAll('.nav-link');

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                // Solo cerramos el offcanvas si estamos en vista de dispositivo móvil (pantallas menores a 768px)
                if (window.innerWidth < 768) {
                    bsOffcanvas.hide();
                }
            });
        });
    }
});
