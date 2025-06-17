// login.js
const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.box-login form').addEventListener('submit', validateLogin);
  document.querySelector('.box-register form').addEventListener('submit', validateRegistration);
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

// Função para carregar credenciais salvas
function loadRememberedCredentials() {
  const rememberedEmail = localStorage.getItem('rememberedEmail');
  const rememberMeCheckbox = document.getElementById('rememberMe');

  if (rememberedEmail) {
    document.getElementById('loginEmail').value = rememberedEmail;
    rememberMeCheckbox.checked = true; // Marca o checkbox se houver email salvo
  }
}

function validateLogin(event) {
  event.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const rememberMe = document.getElementById('rememberMe').checked; // Verifica se o checkbox está marcado
  const emailError = document.getElementById('loginEmailError');
  const passwordError = document.getElementById('loginPasswordError');
  
  

  emailError.textContent = '';
  passwordError.textContent = '';

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

  fetch(`${API_URL}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => { throw new Error(err.message); });
      }
      return response.json();
    })
    .then(data => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('user_id', data.user_id);
      localStorage.setItem('username', data.username);
            // Se o checkbox "Lembrar-se" estiver marcado, salvar o email
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail'); // Remove se o checkbox não estiver marcado
      }
      alert('Login realizado com sucesso!');
      if (data.role === 'admin') {
        window.location.href = '../html/adminDashBoard.html';
      } else {
        window.location.href = '../html/Catalogo.html';
      }
    })
    .catch(error => {
      console.error('Erro ao fazer login:', error);
      passwordError.textContent = error.message || 'Erro ao fazer login. Verifique suas credenciais.';
    });
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
      alert('Cadastro realizado com sucesso! Faça login para continuar.');
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
}

function register() {
  document.querySelector('.box-login').style.left = '-350px';
  document.querySelector('.box-register').style.right = '25px';
  document.querySelector('.btn-active').style.left = '175px';
  document.querySelector('.login').classList.remove('active');
  document.querySelector('.register').classList.add('active');
}