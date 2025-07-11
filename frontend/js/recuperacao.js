const API_URL = 'http://localhost:3000';

// Função para exibir notificações toast
function showToast(message, type = 'error', stepId) {
  const toastContainer = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.classList.add('toast', type);
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
  // Exibir mensagem apenas no campo de erro se for tipo 'error'
  if (type === 'error' && stepId) {
    const errorMessage = document.getElementById(`error-message-${stepId}`);
    errorMessage.textContent = message;
  } else if (stepId) {
    // Limpar o campo de erro para mensagens de sucesso
    const errorMessage = document.getElementById(`error-message-${stepId}`);
    errorMessage.textContent = '';
  }
}

// Função para mostrar/esconder etapas
function showStep(stepId) {
  document.querySelectorAll('.step').forEach(step => {
    step.style.display = 'none';
  });
  document.getElementById(stepId).style.display = 'block';
}

// Função para solicitar código de verificação
function requestVerificationCode() {
  const email = document.getElementById('email').value.trim();

  if (!email) {
    showToast('Por favor, insira um e-mail.', 'error', 'email');
    return;
  }

  fetch(`${API_URL}/api/solicitar-recuperacao`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => { throw new Error(err.message || 'Erro desconhecido no servidor'); });
      }
      return response.json();
    })
    .then(data => {
      showToast(data.message, 'success', 'email');
      showStep('code-step');
      document.getElementById('code').focus();
    })
    .catch(error => {
      console.error('Erro ao solicitar código:', error);
      showToast(error.message, 'error', 'email');
    });
}

// Função para verificar o código
function verifyCode() {
  const email = document.getElementById('email').value.trim();
  const code = document.getElementById('code').value.trim();

  if (!code) {
    showToast('Por favor, insira o código.', 'error', 'code');
    return;
  }

  fetch(`${API_URL}/api/verificar-codigo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, code }),
  })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => { throw new Error(err.message || 'Erro desconhecido no servidor'); });
      }
      return response.json();
    })
    .then(data => {
      showToast(data.message, 'success', 'code');
      showStep('password-step');
      document.getElementById('new-password').focus();
      // Configurar eventos dos ícones de olho após exibir a etapa de senha
      setupEyeEvents();
    })
    .catch(error => {
      console.error('Erro ao verificar código:', error);
      showToast(error.message, 'error', 'code');
    });
}

// Função para redefinir a senha
function resetPassword(event) {
  event.preventDefault();

  const email = document.getElementById('email').value.trim();
  const code = document.getElementById('code').value.trim();
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (!newPassword || !confirmPassword) {
    showToast('Por favor, preencha os campos de senha.', 'error', 'password');
    return;
  }

  if (newPassword !== confirmPassword) {
    showToast('As senhas não coincidem.', 'error', 'password');
    return;
  }

  fetch(`${API_URL}/api/recuperar-senha`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, code, newPassword, confirmPassword }),
  })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => { throw new Error(err.message || 'Erro desconhecido no servidor'); });
      }
      return response.json();
    })
    .then(data => {
      showToast(data.message, 'success', 'password');
      setTimeout(() => {
        window.location.href = './login.html';
      }, 2000);
    })
    .catch(error => {
      console.error('Erro ao redefinir senha:', error);
      showToast(error.message, 'error', 'password');
    });
}

// Função para alternar visibilidade da senha
function togglePasswordVisibility(inputId, eyeId, eyeSlashId) {
  const passwordInput = document.getElementById(inputId);
  const eye = document.getElementById(eyeId);
  const eyeSlash = document.getElementById(eyeSlashId);

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    eye.style.opacity = '0';
    eyeSlash.style.opacity = '1';
  } else {
    passwordInput.type = 'password';
    eye.style.opacity = '1';
    eyeSlash.style.opacity = '0';
  }
}

// Função para configurar eventos dos ícones de olho
function setupEyeEvents() {
  const passwordFields = [
    { inputId: 'new-password', eyeId: 'eye-1', eyeSlashId: 'eye-slash-1', eyeBox: document.querySelector('#password-step .input-field:nth-child(1) .eye-box') },
    { inputId: 'confirm-password', eyeId: 'eye-2', eyeSlashId: 'eye-slash-2', eyeBox: document.querySelector('#password-step .input-field:nth-child(2) .eye-box') }
  ];

  passwordFields.forEach((field, index) => {
    if (field.eyeBox) {
      // Remover eventos anteriores clonando o elemento
      field.eyeBox.replaceWith(field.eyeBox.cloneNode(true));
      // Reobter o elemento após clonagem
      const newEyeBox = document.querySelector(`#password-step .input-field:nth-child(${index + 1}) .eye-box`);
      newEyeBox.addEventListener('click', () => {
        togglePasswordVisibility(field.inputId, field.eyeId, field.eyeSlashId);
      });
    } else {
      console.error(`Erro: eye-box não encontrado para o campo ${index + 1}`);
    }
  });
}

// Configurar eventos
document.addEventListener('DOMContentLoaded', () => {
  // Mostrar apenas a etapa de e-mail inicialmente
  showStep('email-step');

  // Botão para solicitar código
  document.getElementById('btn-request-code').addEventListener('click', requestVerificationCode);

  // Botão para verificar código
  document.getElementById('btn-verify-code').addEventListener('click', verifyCode);

  // Formulário para redefinir senha
  document.getElementById('form-recuperacao').addEventListener('submit', resetPassword);
});