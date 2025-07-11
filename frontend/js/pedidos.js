const API_URL = 'http://localhost:3000';

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
        window.location.href = './adminPerfil.html';
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
    showToast('Usuário não autenticado. Redirecionando para login...', 'error');
    setTimeout(() => (window.location.href = './login.html'), 2000);
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
          throw new Error(err.message || `Erro ${response.status}: Falha ao carregar pedidos`);
        });
      }
      return response.json();
    })
    .then((data) => {
      if (!data || !Array.isArray(data.pedidos)) {
        throw new Error('Resposta da API inválida: lista de pedidos não encontrada');
      }
      renderizarPedidos(data.pedidos);
    })
    .catch((error) => {
      console.error('Erro ao carregar pedidos:', error);
      showToast(`Erro: ${error.message}`, 'error');
      document.getElementById('pedidos-lista').innerHTML = `<p>${error.message}</p>`;
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
    showToast('Usuário não autenticado. Redirecionando para login...', 'error');
    setTimeout(() => (window.location.href = './login.html'), 2000);
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
      if (!detalhes || !detalhes.pedido_id) {
        throw new Error('Resposta da API inválida: detalhes do pedido não encontrados');
      }
      renderizarDetalhesPedido(detalhes);
      document.getElementById('modal-detalhes').classList.add('active');
    })
    .catch(error => {
      console.error('Erro ao carregar detalhes:', error);
      showToast(`Erro ao carregar detalhes do pedido: ${error.message}`, 'error');
    });
}

function renderizarDetalhesPedido(detalhes) {
  const modalItens = document.getElementById('modal-itens');
  const modal = document.getElementById('modal-detalhes');
  modalItens.innerHTML = '';
  const fragment = document.createDocumentFragment();

  if (!detalhes.itens || !Array.isArray(detalhes.itens)) {
    modalItens.innerHTML = '<p>Nenhum item encontrado para este pedido.</p>';
    return;
  }

  // Adicionar endereço, se disponível
  let enderecoHtml = '';
  if (detalhes.endereco) {
    enderecoHtml = `
      <div class="modal-endereco">
        <h3>Endereço de Entrega</h3>
        <p>${detalhes.endereco.nome_rua}, ${detalhes.endereco.numero_casa}, ${detalhes.endereco.bairro}, ${detalhes.endereco.cidade} - ${detalhes.endereco.UF}</p>
      </div>
    `;
  }

  // Adicionar itens do pedido
  detalhes.itens.forEach(item => {
    const modalItem = document.createElement('div');
    modalItem.classList.add('modal-item');
    const preco = Number(item.preco_unitario) || 0;
    const precoTotal = (preco * item.quantidade).toFixed(2).replace('.', ',');
    modalItem.innerHTML = `
      <span>${item.titulo || 'Produto sem nome'}</span>
      <span>Quantidade: ${item.quantidade || 0}</span>
      <span>R$ ${precoTotal}</span>
    `;
    fragment.appendChild(modalItem);
  });

  modalItens.appendChild(fragment);

  // Atualizar valor total e estrutura do modal
  const valorTotal = Number(detalhes.valor_total) || 0;
  document.getElementById('modal-valor-total').textContent = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;
  const modalHeader = modal.querySelector('.modal-content');
  modalHeader.innerHTML = `
    <h2>Detalhes do Pedido #${detalhes.pedido_id}</h2>
    ${enderecoHtml}
    <button class="modal-close"><i class="fas fa-times"></i></button>
    <div id="modal-itens">${modalItens.innerHTML}</div>
    <div class="modal-total">
      <span>Total:</span>
      <span id="modal-valor-total">R$ ${valorTotal.toFixed(2).replace('.', ',')}</span>
    </div>
  `;

  // Remover eventos anteriores para evitar duplicação
  const oldCloseButton = modal.querySelector('.modal-close');
  if (oldCloseButton) {
    oldCloseButton.replaceWith(oldCloseButton.cloneNode(true));
  }

  // Adicionar evento de fechar
  const closeButton = modal.querySelector('.modal-close');
  closeButton.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  // Fechar ao clicar fora do modal
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.classList.remove('active');
    }
  });
}