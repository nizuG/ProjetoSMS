fetch('/assets/menu/menu.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('menu-container').innerHTML = html;
    lucide.createIcons(); // necessário para renderizar os ícones inseridos dinamicamente
  });
