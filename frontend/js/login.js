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

// Função para mostrar o popup do reCAPTCHA
function showRecaptchaModal() {
  const modal = document.getElementById('recaptchaModal');
  const recaptchaContainer = document.getElementById('recaptchaContainer');
  if (!modal || !recaptchaContainer) {
    console.error('Modal ou recaptchaContainer não encontrado.');
    return;
  }
  recaptchaContainer.innerHTML = ''; // Limpa o contêiner
  modal.classList.add('active'); // Adiciona classe active para exibir o modal

  // Verifica se o grecaptcha está carregado
  if (typeof grecaptcha !== 'undefined' && !recaptchaContainer.dataset.rendered) {
    grecaptcha.render('recaptchaContainer', {
      sitekey: '6LcIb30rAAAAABSsBm5gWIXrEN-AOpITdwnTv-g0', // Sua chave de site
      callback: verifyCallback // Callback chamado após verificação do reCAPTCHA
    });
    recaptchaContainer.dataset.rendered = 'true';
  } else if (!recaptchaContainer.dataset.rendered) {
    // Aguarda o carregamento do script do reCAPTCHA
    const waitForGrecaptcha = setInterval(() => {
      if (typeof grecaptcha !== 'undefined') {
        clearInterval(waitForGrecaptcha);
        grecaptcha.render('recaptchaContainer', {
          sitekey: '6LcIb30rAAAAABSsBm5gWIXrEN-AOpITdwnTv-g0',
          callback: verifyCallback
        });
        recaptchaContainer.dataset.rendered = 'true';
      }
    }, 100);
  }
}

// Função para fechar o popup
function closeRecaptchaModal() {
  const modal = document.getElementById('recaptchaModal');
  const recaptchaContainer = document.getElementById('recaptchaContainer');
  if (modal && recaptchaContainer) {
    modal.classList.remove('active'); // Remove classe active para ocultar o modal
    recaptchaContainer.innerHTML = ''; // Limpa o contêiner
    recaptchaContainer.dataset.rendered = ''; // Permite nova renderização
  }
}

// Callback do reCAPTCHA para enviar a requisição de login
function verifyCallback(recaptchaToken) {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const rememberMe = document.getElementById('rememberMe').checked;
  const recaptchaError = document.getElementById('recaptchaModalError');

  recaptchaError.textContent = '';

  fetch(`${API_URL}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password, recaptchaToken })
  })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => { throw new Error(err.message); });
      }
      return response.json();
    })
    .then(data => {
      closeRecaptchaModal(); // Fecha o popup
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('user_id', data.user_id);
      localStorage.setItem('username', data.username);
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      showToast('Login realizado com sucesso!', 'success');
      setTimeout(() => {
        if (data.role === 'admin') {
          window.location.href = '../html/adminPerfil.html';
        } else {
          window.location.href = '../html/Catalogo.html';
        }
      }, 2000);
    })
    .catch(error => {
      console.error('Erro ao fazer login:', error);
      recaptchaError.textContent = error.message || 'Erro ao fazer login. Verifique suas credenciais.';
      grecaptcha.reset(); // Reseta o reCAPTCHA após erro
    });
}

document.addEventListener('DOMContentLoaded', async () => {
  // Verifica se há um token válido no localStorage para restaurar a sessão
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (token) {
    try {
      const response = await fetch(`${API_URL}/api/verificar-admin`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        showToast('Sessão restaurada com sucesso!', 'success');
        setTimeout(() => {
          if (role === 'admin') {
            window.location.href = '../html/adminPerfil.html';
          } else {
            window.location.href = '../html/Catalogo.html';
          }
        }, 2000);
      } else {
        // Remove dados do localStorage se o token for inválido
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user_id');
        localStorage.removeItem('username');
      }
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user_id');
      localStorage.removeItem('username');
    }
  }

  // Garante que o modal esteja oculto na inicialização
  const modal = document.getElementById('recaptchaModal');
  if (modal) {
    modal.classList.remove('active');
  }

  document.querySelector('.box-login form').addEventListener('submit', validateLogin);
  document.querySelector('.box-register form').addEventListener('submit', validateRegistration);
  // Adiciona evento para o botão de fechar o popup
  const closeButton = document.querySelector('.modal .close');
  if (closeButton) {
    closeButton.addEventListener('click', closeRecaptchaModal);
  } else {
    console.error('Botão de fechar do modal não encontrado.');
  }
  loadRememberedCredentials();
});

function myLogPassword() {
  const passwordInput = document.getElementById('loginPassword');
  const eye = document.getElementById('eye');
  const eyeSlash = document.getElementById('eye-slash');
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

function myRegPassword() {
  const passwordInput = document.getElementById('regPassword');
  const eye = document.getElementById('eye-2');
  const eyeSlash = document.getElementById('eye-slash-2');
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

function myRegConfirmPassword() {
  const passwordInput = document.getElementById('regConfirmPassword');
  const eye = document.getElementById('eye-3');
  const eyeSlash = document.getElementById('eye-slash-3');
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

function loadRememberedCredentials() {
  const rememberedEmail = localStorage.getItem('rememberedEmail');
  const rememberMeCheckbox = document.getElementById('rememberMe');

  if (rememberedEmail) {
    document.getElementById('loginEmail').value = rememberedEmail;
    rememberMeCheckbox.checked = true;
  }
}

function validateLogin(event) {
  event.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const emailError = document.getElementById('loginEmailError');
  const passwordError = document.getElementById('loginPasswordError');
  const recaptchaError = document.getElementById('recaptchaModalError');

  emailError.textContent = '';
  passwordError.textContent = '';
  recaptchaError.textContent = '';

  if (!email) {
    emailError.textContent = 'Por favor, insira um email.';
    return;
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    emailError.textContent = 'Por favor, insira um email válido.';
    return;
  }
  if (password.length < 8) {
    passwordError.textContent = 'A senha deve ter pelo menos 8 caracteres.';
    return;
  }
  if (!/[A-Z]/.test(password)) {
    passwordError.textContent = 'A senha deve conter pelo menos uma letra maiúscula.';
    return;
  }
  if (!/[0-9]/.test(password)) {
    passwordError.textContent = 'A senha deve conter pelo menos um número.';
    return;
  }
  if (!/[!@#$%^&*]/.test(password)) {
    passwordError.textContent = 'A senha deve conter pelo menos um caractere especial (!@#$%^&*).';
    return;
  }

  // Exibe o popup do reCAPTCHA
  showRecaptchaModal();
}

function validateRegistration(event) {
  event.preventDefault();

  const username = document.getElementById('regUsername').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirmPassword = document.getElementById('regConfirmPassword').value;
  const usernameError = document.getElementById('regUsernameError');
  const emailError = document.getElementById('regEmailError');
  const passwordError = document.getElementById('regPasswordError');
  const confirmPasswordError = document.getElementById('regConfirmPasswordError');

  usernameError.textContent = '';
  emailError.textContent = '';
  passwordError.textContent = '';
  confirmPasswordError.textContent = '';

  if (!username) {
    usernameError.textContent = 'Por favor, insira um nome de usuário.';
    return;
  }
  if (username.length < 3) {
    usernameError.textContent = 'O nome de usuário deve ter pelo menos 3 caracteres.';
    return;
  }
  if (!email) {
    emailError.textContent = 'Por favor, insira um email.';
    return;
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    emailError.textContent = 'Por favor, insira um email válido.';
    return;
  }
  if (!password) {
    passwordError.textContent = 'Por favor, insira uma senha.';
    return;
  }
  if (password.length < 8) {
    passwordError.textContent = 'A senha deve ter pelo menos 8 caracteres.';
    return;
  }
  if (!/[A-Z]/.test(password)) {
    passwordError.textContent = 'A senha deve conter pelo menos uma letra maiúscula.';
    return;
  }
  if (!/[0-9]/.test(password)) {
    passwordError.textContent = 'A senha deve conter pelo menos um número.';
    return;
  }
  if (!/[!@#$%^&*]/.test(password)) {
    passwordError.textContent = 'A senha deve conter pelo menos um caractere especial (!@#$%^&*).';
    return;
  }
  if (password !== confirmPassword) {
    confirmPasswordError.textContent = 'As senhas não coincidem.';
    return;
  }

  fetch(`${API_URL}/api/registro`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, email, password })
  })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => { throw new Error(err.message); });
      }
      return response.json();
    })
    .then(() => {
      showToast('Cadastro realizado com sucesso! Faça login para continuar.', 'success');
      login();
    })
    .catch(error => {
      console.error('Erro ao cadastrar:', error);
      emailError.textContent = error.message || 'Erro ao cadastrar. Tente novamente.';
    });
}

function login() {
  document.querySelector('.box-login').style.left = '27px';
  document.querySelector('.box-register').style.right = '-350px';
  document.querySelector('.btn-active').style.left = '0px';
  document.querySelector('.login').classList.add('active');
  document.querySelector('.register').classList.remove('active');
  closeRecaptchaModal(); // Fecha o popup ao mudar para login
}

function register() {
  document.querySelector('.box-login').style.left = '-350px';
  document.querySelector('.box-register').style.right = '25px';
  document.querySelector('.btn-active').style.left = '175px';
  document.querySelector('.login').classList.remove('active');
  document.querySelector('.register').classList.add('active');
  closeRecaptchaModal(); // Fecha o popup ao mudar para cadastro
}