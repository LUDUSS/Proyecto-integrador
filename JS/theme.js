document.addEventListener('DOMContentLoaded', () => {
  const themeToggleBtn = document.getElementById('theme-toggle');
  const htmlElement = document.documentElement;

  // 1. Cargar el tema guardado
  const savedTheme = localStorage.getItem('theme') || 'light';
  htmlElement.setAttribute('data-bs-theme', savedTheme);
  updateButton(savedTheme);

  // 2. Evento para alternar tema
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = htmlElement.getAttribute('data-bs-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

      htmlElement.setAttribute('data-bs-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateButton(newTheme);
    });
  }

  // 3. Cambiar texto del botón según el modo activo
  function updateButton(theme) {
    if (!themeToggleBtn) return;
    
    if (theme === 'dark') {
      themeToggleBtn.innerHTML = '<i class="bi bi-sun-fill" aria-hidden="true"></i> <span></span>';
    } else {
      themeToggleBtn.innerHTML = '<i class="bi bi-moon-stars-fill" aria-hidden="true"></i> <span></span>';
    }
  }
});