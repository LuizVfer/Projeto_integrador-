// frontend/recuperacao.js

// Função para alternar visibilidade da senha
function myRegPassword(inputId, eyeId, eyeSlashId) {
    const passwordField = document.getElementById(inputId);
    const eyeIcon = document.getElementById(eyeId);
    const eyeSlashIcon = document.getElementById(eyeSlashId);

    if (!passwordField || !eyeIcon || !eyeSlashIcon) {
        console.error('Elementos não encontrados:', { inputId, eyeId, eyeSlashId });
        return;
    }

    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        eyeIcon.style.display = 'none';
        eyeSlashIcon.style.display = 'block';
    } else {
        passwordField.type = 'password';
        eyeIcon.style.display = 'block';
        eyeSlashIcon.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('#recuperacao-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const confirmPasswordError = document.getElementById('confirmPasswordError');
    const messageDiv = document.getElementById('message');

    // Verificar se todos os elementos existem
    if (!form || !emailInput || !passwordInput || !confirmPasswordInput || !emailError || !passwordError || !confirmPasswordError || !messageDiv) {
        console.error('Um ou mais elementos do formulário não foram encontrados:', {
            form: !!form,
            emailInput: !!emailInput,
            passwordInput: !!passwordInput,
            confirmPasswordInput: !!confirmPasswordInput,
            emailError: !!emailError,
            passwordError: !!passwordError,
            confirmPasswordError: !!confirmPasswordError,
            messageDiv: !!messageDiv
        });
        messageDiv && (messageDiv.textContent = 'Erro: Formulário não carregado corretamente.');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Limpar mensagens de erro anteriores
        emailError.textContent = '';
        passwordError.textContent = '';
        confirmPasswordError.textContent = '';
        messageDiv.textContent = '';

        const email = emailInput.value.trim();
        const newPassword = passwordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        let isValid = true;

        // Validação de Email
        if (email === '') {
            emailError.textContent = 'E-mail é obrigatório.';
            isValid = false;
        } else if (!email.includes('@') || !email.includes('.')) {
            emailError.textContent = 'E-mail inválido.';
            isValid = false;
        }

        // Validação de Senha
        if (newPassword === '') {
            passwordError.textContent = 'Senha é obrigatória.';
            isValid = false;
        } else if (newPassword.length < 8) {
            passwordError.textContent = 'A senha deve ter pelo menos 8 caracteres.';
            isValid = false;
        } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
            passwordError.textContent = 'A senha deve conter pelo menos um caractere especial.';
            isValid = false;
        }

        // Validação de Confirmação de Senha
        if (confirmPassword === '') {
            confirmPasswordError.textContent = 'Confirme a senha.';
            isValid = false;
        } else if (newPassword !== confirmPassword) {
            confirmPasswordError.textContent = 'As senhas não coincidem.';
            isValid = false;
        }

        // Se a validação passar, enviar a solicitação ao backend
        if (isValid) {
            try {
                const response = await fetch('http://localhost:3000/api/recuperar-senha', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email,
                        newPassword,
                        confirmPassword,
                    }),
                });

                const data = await response.json();

                if (response.ok) {
                    messageDiv.textContent = data.message;
                    messageDiv.style.color = 'green';
                    // Redirecionar para a página de login após 2 segundos
                    setTimeout(() => {
                        window.location.href = './login.html';
                    }, 2000);
                } else {
                    messageDiv.textContent = data.message;
                    messageDiv.style.color = 'red';
                }
            } catch (error) {
                messageDiv.textContent = 'Erro ao conectar com o servidor.';
                messageDiv.style.color = 'red';
                console.error('Erro:', error);
            }
        }
    });
});