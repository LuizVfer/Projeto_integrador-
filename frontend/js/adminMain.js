// js/main.js
const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', ready);

function ready() {
    displayUserGreeting();
    setupMenu();
    carregarProdutos();

    const formAdicionarProduto = document.getElementById('form-adicionar-produto');
    formAdicionarProduto.addEventListener('submit', adicionarProduto);

    const buscaInput = document.getElementById('busca-produto');
    const filtroSelect = document.getElementById('filtro-categoria');
    const btnBuscar = document.getElementById('btn-buscar');

    if (buscaInput && filtroSelect && btnBuscar) {
        btnBuscar.addEventListener('click', filtrarProdutos);
        buscaInput.addEventListener('input', filtrarProdutos);
        filtroSelect.addEventListener('change', filtrarProdutos);
    }

    carregarPerfil();
    carregarPedidos();
    setupFiltrosPedidos();
}

function displayUserGreeting() {
    const username = localStorage.getItem('username');
    const greetingElement = document.getElementById('userGreeting');
    if (username && greetingElement) {
        greetingElement.textContent = `Olá, ${username}`;
    } else if (greetingElement) {
        greetingElement.textContent = 'Olá, Administrador';
    }
}

function setupMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const menuLinks = sidebar.querySelectorAll('a[data-section]');

    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        document.querySelector('main').classList.toggle('sidebar-open');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.querySelector('main').classList.remove('sidebar-open');
    });

    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            menuLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const sectionId = link.getAttribute('data-section');
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(sectionId).classList.add('active');

            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.querySelector('main').classList.remove('sidebar-open');
        });
    });
}