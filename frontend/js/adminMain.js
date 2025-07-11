document.addEventListener('DOMContentLoaded', ready);

// Função para exibir notificações toast
function showToast(message, type = 'error') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        console.error('Contêiner de toast não encontrado.');
        return;
    }
    const toast = document.createElement('div');
    toast.classList.add('toast', type);
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function ready() {
    displayUserGreeting();
    setupMenu();
}

function displayUserGreeting() {
    const username = localStorage.getItem('username');
    const greetingElement = document.getElementById('userGreeting');
    if (username && greetingElement) {
        greetingElement.textContent = `Olá, ${username}`;
    } else if (greetingElement) {
        greetingElement.textContent = 'Olá, Administrador';
    } else {
        showToast('Elemento userGreeting não encontrado', 'error');
    }
}

function setupMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    if (menuToggle && sidebar && overlay) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
            const mainElement = document.querySelector('main');
            if (mainElement) {
                mainElement.classList.toggle('sidebar-open');
            }
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            const mainElement = document.querySelector('main');
            if (mainElement) {
                mainElement.classList.remove('sidebar-open');
            }
        });
    } else {
        showToast('Elementos do menu hamburguer não encontrados', 'error');
    }
}