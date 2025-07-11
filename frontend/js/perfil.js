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
  loadProfile();
  setupMenu();
  verificarAdmin();
  document.getElementById('form-perfil').addEventListener('submit', updateProfile);
  document.getElementById('btn-alterar').addEventListener('click', enableEditing);
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

function getToken() {
  return localStorage.getItem('token');
}

function loadProfile() {
  const token = getToken();
  if (!token) {
    window.location.href = '../html/login.html';
    return;
  }

  fetch(`${API_URL}/perfil`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(response => {
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '../html/login.html';
        }
        return response.json().then(err => { throw new Error(err.message); });
      }
      return response.json();
    })
    .then(data => {
      document.getElementById('nome').value = data.perfil.nome || '';
      document.getElementById('data-nascimento').value = data.perfil.data_nascimento
        ? new Date(data.perfil.data_nascimento).toISOString().split('T')[0]
        : '';
      document.getElementById('cpf').value = data.perfil.cpf || '';
      document.getElementById('contato1').value = data.perfil.contato1 || '';
      document.getElementById('contato2').value = data.perfil.contato2 || '';
      document.getElementById('nome_rua').value = data.perfil.nome_rua || '';
      document.getElementById('numero_casa').value = data.perfil.numero_casa || '';
      document.getElementById('bairro').value = data.perfil.bairro || '';
      document.getElementById('cidade').value = data.perfil.cidade || '';
      document.getElementById('UF').value = data.perfil.UF || '';
      document.getElementById('email').value = data.email || '';
    })
    .catch(error => {
      console.error('Erro ao carregar perfil:', error);
      showToast(`Erro ao carregar perfil: ${error.message}`, 'error');
    });
}

function enableEditing() {
  const inputs = document.querySelectorAll('#form-perfil input');
  inputs.forEach(input => input.removeAttribute('readonly'));
  document.getElementById('btn-salvar').removeAttribute('disabled');
}

function updateProfile(event) {
  event.preventDefault();

  const token = getToken();
  if (!token) {
    window.location.href = '../html/login.html';
    return;
  }

  if (document.getElementById('btn-salvar').hasAttribute('disabled')) {
    showToast('Clique em "Alterar" para editar os dados antes de salvar.', 'error');
    return;
  }

  const nome = document.getElementById('nome').value.trim();
  const data_nascimento = document.getElementById('data-nascimento').value;
  const cpf = document.getElementById('cpf').value.trim();
  const contato1 = document.getElementById('contato1').value.trim();
  const contato2 = document.getElementById('contato2').value.trim();
  const nome_rua = document.getElementById('nome_rua').value.trim();
  const numero_casa = document.getElementById('numero_casa').value;
  const bairro = document.getElementById('bairro').value.trim();
  const cidade = document.getElementById('cidade').value.trim();
  const UF = document.getElementById('UF').value.trim();
  const email = document.getElementById('email').value.trim();

  if (!nome || !data_nascimento || !cpf || !contato1 || !nome_rua || !numero_casa || !bairro || !cidade || !UF || !email) {
    showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
    return;
  }

  if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf)) {
    showToast('CPF deve estar no formato 000.000.000-00', 'error');
    return;
  }

  if (!/^[A-Z]{2}$/.test(UF)) {
    showToast('Estado (UF) deve conter exatamente 2 letras maiúsculas.', 'error');
    return;
  }

  fetch(`${API_URL}/perfil`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ nome, data_nascimento, cpf, contato1, contato2, nome_rua, numero_casa, bairro, cidade, UF, email })
  })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => { throw new Error(err.message); });
      }
      return response.json();
    })
    .then(() => {
      showToast('Perfil atualizado com sucesso!', 'success');
      const inputs = document.querySelectorAll('#form-perfil input');
      inputs.forEach(input => input.setAttribute('readonly', 'true'));
      document.getElementById('btn-salvar').setAttribute('disabled', 'true');
      loadProfile();
    })
    .catch(error => {
      console.error('Erro ao atualizar perfil:', error);
      showToast(`Erro ao atualizar perfil: ${error.message}`, 'error');
    });
}