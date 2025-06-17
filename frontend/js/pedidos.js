// js/pedidos.js
const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    setupMenu();
    verificarAdmin();
    carregarPedidosUsuario();
});

function setupMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const menuLinks = sidebar.querySelectorAll('a[data-section]');

    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            menuLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            if (section === 'catalogo') {
                window.location.href = './catalogo.html';
            } else if (section === 'perfil') {
                window.location.href = './perfil.html';
            } else if (section === 'pedidos') {
                window.location.href = './pedidos.html';
            } else if (section === 'logout') {
                localStorage.clear();
                window.location.href = './login.html';
            } else if (section === 'admin') {
                window.location.href = './AdminDashboard.html';
            }
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    });
}

function verificarAdmin() {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_URL}/api/verificar-admin`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) throw new Error('Erro ao verificar admin');
            return response.json();
        })
        .then(data => {
            if (data.role === 'admin') {
                document.getElementById('admin-link').style.display = 'block';
            }
        })
        .catch(error => console.error('Erro ao verificar admin:', error));
}

function carregarPedidosUsuario() {
    const token = localStorage.getItem('token');
  
    if (!token) {
      window.location.href = './login.html';
      return;
    }
    
    fetch(`${API_URL}/api/pedidos/usuario`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((err) => {
            throw new Error(err.message || 'Erro ao carregar pedidos');
          });
        }
        return response.json();
      })
      .then((pedidos) => {
        renderizarPedidos(pedidos);
      })
      .catch((error) => {
        console.error('Erro ao carregar pedidos:', error);
        document.getElementById('pedidos-lista').innerHTML = `<p>${
          error.message || 'Erro ao carregar seus pedidos'
        }</p>`;
      });
  }

function renderizarPedidos(pedidos) {
    const pedidosLista = document.getElementById('pedidos-lista');
    pedidosLista.innerHTML = '';
    const fragment = document.createDocumentFragment();

    if (pedidos.length === 0) {
        pedidosLista.innerHTML = '<p>Você ainda não tem pedidos.</p>';
        return;
    }

    const statusMap = {
        aguardando: 'Aguardando',
        concluido: 'Concluída',
        cancelado: 'Cancelada'
    };

    pedidos.forEach(pedido => {
        const item = document.createElement('div');
        item.classList.add('pedido-item');
        const dataFormatada = new Date(pedido.data_pedido).toLocaleDateString('pt-BR');
        const valorTotal = pedido.valor_total.toFixed(2).replace('.', ',');
        const statusDisplay = statusMap[pedido.processo_pedido.toLowerCase()] || pedido.processo_pedido;

        item.innerHTML = `
            <span>#${pedido.pedido_id}</span>
            <span>${dataFormatada}</span>
            <span class="pedido-status ${pedido.processo_pedido.toLowerCase()}">${statusDisplay}</span>
            <span>R$ ${valorTotal}</span>
            <button class="btn-detalhes" data-pedido-id="${pedido.pedido_id}">Ver Detalhes</button>
        `;
        fragment.appendChild(item);
    });

    pedidosLista.appendChild(fragment);

    document.querySelectorAll('.btn-detalhes').forEach(button => {
        button.addEventListener('click', () => {
            const pedidoId = button.getAttribute('data-pedido-id');
            carregarDetalhesPedido(pedidoId);
        });
    });
}

function carregarDetalhesPedido(pedidoId) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = './login.html';
        return;
    }

    fetch(`${API_URL}/api/pedidos/${pedidoId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.message || `Erro ${response.status}: Detalhes do pedido não encontrados`);
                });
            }
            return response.json();
        })
        .then(detalhes => {
            renderizarDetalhesPedido(detalhes);
            document.getElementById('modal-detalhes').classList.add('active');
        })
        .catch(error => {
            console.error('Erro ao carregar detalhes:', error);
            alert(`Erro ao carregar detalhes do pedido: ${error.message}`);
        });
}

function renderizarDetalhesPedido(detalhes) {
    const modalItens = document.getElementById('modal-itens');
    modalItens.innerHTML = '';
    const fragment = document.createDocumentFragment();
  
    // Verificar se detalhes.itens existe e é uma array
    if (!detalhes.itens || !Array.isArray(detalhes.itens)) {
      modalItens.innerHTML = '<p>Nenhum item encontrado para este pedido.</p>';
      return;
    }
  
    detalhes.itens.forEach(item => {
      const modalItem = document.createElement('div');
      modalItem.classList.add('modal-item');
      // Garantir que preco_unitario seja um número válido
      const preco = Number(item.preco_unitario) || 0;
      modalItem.innerHTML = `
        <span>${item.titulo || 'Produto sem nome'}</span>
        <span>${item.quantidade || 0}</span>
      `;
      fragment.appendChild(modalItem);
    });
  
    modalItens.appendChild(fragment);
  
    // Garantir que valor_total seja um número válido
    const valorTotal = Number(detalhes.valor_total) || 0;
    document.getElementById('modal-valor-total').textContent = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;
  
    // Fechar modal
    document.querySelector('.modal-close').addEventListener('click', () => {
      document.getElementById('modal-detalhes').classList.remove('active');
    });
  }