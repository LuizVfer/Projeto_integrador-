const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const db = require('../config/db.js');
const { sendVerificationCode } = require('../utils/email.js');
require('dotenv').config();

const secretKey = process.env.JWT_SECRET;
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const [existingUser] = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, result) => {
        err ? reject(err) : resolve(result);
      });
    });

    if (existingUser) {
      return res.status(400).json({ message: 'E-mail já cadastrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO usuarios (username, email, password, role) VALUES (?, ?, ?, "user")',
        [username, email, hashedPassword],
        (err, result) => (err ? reject(err) : resolve(result))
      );
    });

    res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
  } catch (err) {
    console.error('Erro ao cadastrar usuário:', err);
    res.status(500).json({ message: 'Erro ao cadastrar usuário', error: err.message });
  }
};

const login = async (req, res) => {
  const { email, password, recaptchaToken } = req.body;

  try {
    // Validar o token do reCAPTCHA
    const recaptchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`
    });
    const recaptchaData = await recaptchaResponse.json();

    if (!recaptchaData.success) {
      return res.status(400).json({ message: 'Falha na verificação do reCAPTCHA.' });
    }

    // Prosseguir com a validação do login
    const [user] = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, result) => {
        err ? reject(err) : resolve(result);
      });
    });

    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Senha incorreta' });
    }

    const token = jwt.sign({ id: user.user_id, role: user.role }, secretKey, { expiresIn: '24h' });
    res.status(200).json({
      message: 'Login bem-sucedido!',
      token,
      user_id: user.user_id,
      role: user.role,
      username: user.username
    });
  } catch (err) {
    console.error('Erro ao fazer login:', err);
    res.status(500).json({ message: 'Erro no servidor', error: err.message });
  }
};

const verificarAdmin = async (req, res) => {
  try {
    const userId = req.user.user_id; // Vem do authMiddleware
    const role = req.user.role; // Já está no token decodificado
    res.json({ role }); // Retorna apenas o role
  } catch (err) {
    console.error('Erro ao verificar admin:', err);
    res.status(500).json({ message: 'Erro ao verificar admin', error: err.message });
  }
};

const resetPassword = async (req, res) => {
  const { email, code, newPassword, confirmPassword } = req.body;

  try {
    // Verificar se as senhas coincidem
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'As senhas não coincidem' });
    }

    // Verificar o código
    if (!verificationCodes[email] || verificationCodes[email].code !== code || verificationCodes[email].expiresAt < Date.now()) {
      return res.status(400).json({ message: 'Código inválido ou expirado' });
    }

    // Verificar se o e-mail existe no banco de dados
    const [user] = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, result) => {
        err ? reject(err) : resolve(result);
      });
    });

    if (!user) {
      return res.status(404).json({ message: 'E-mail não encontrado' });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar a senha no banco de dados
    await new Promise((resolve, reject) => {
      db.query(
        'UPDATE usuarios SET password = ? WHERE email = ?',
        [hashedPassword, email],
        (err, result) => (err ? reject(err) : resolve(result))
      );
    });

    // Remover o código usado
    delete verificationCodes[email];

    res.status(200).json({ message: 'Senha redefinida com sucesso!' });
  } catch (err) {
    console.error('Erro ao redefinir senha:', err);
    res.status(500).json({ message: 'Erro ao redefinir senha', error: err.message });
  }
};

const verificationCodes = {};
const cleanExpiredCodes = () => {
  const now = Date.now();
  for (const email in verificationCodes) {
    if (verificationCodes[email].expiresAt < now) {
      delete verificationCodes[email];
    }
  }
};

// Executar limpeza de códigos expirados a cada 10 minutos
setInterval(cleanExpiredCodes, 10 * 60 * 1000);

// Função para gerar um código de 6 dígitos
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Solicitar código de verificação
// authController.js
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    // Verificar se o e-mail existe
    const [user] = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, result) => {
        if (err) {
          console.error('Erro na consulta ao banco de dados:', err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    if (!user) {
      return res.status(404).json({ message: 'E-mail não encontrado' });
    }

    // Gerar código de verificação
    const code = generateVerificationCode();
    const expiresAt = Date.now() + 10 * 60 * 1000; // Expira em 10 minutos

    // Armazenar código em memória
    verificationCodes[email] = { code, expiresAt };

    // Enviar e-mail com o código
    try {
      await sendVerificationCode(email, code);
    } catch (emailError) {
      console.error('Erro ao enviar e-mail:', emailError);
      throw new Error('Falha ao enviar o e-mail de verificação');
    }

    res.status(200).json({ message: 'Código de verificação enviado para o e-mail.' });
  } catch (err) {
    console.error('Erro detalhado ao solicitar recuperação de senha:', err);
    res.status(500).json({ message: 'Erro ao solicitar recuperação de senha', error: err.message });
  }
};

// Validar código de verificação
const verifyCode = async (req, res) => {
  const { email, code } = req.body;

  try {
    if (!verificationCodes[email] || verificationCodes[email].code !== code || verificationCodes[email].expiresAt < Date.now()) {
      return res.status(400).json({ message: 'Código inválido ou expirado' });
    }

    res.status(200).json({ message: 'Código válido. Você pode prosseguir com a redefinição da senha.' });
  } catch (err) {
    console.error('Erro ao verificar código:', err);
    res.status(500).json({ message: 'Erro ao verificar código', error: err.message });
  }
};

module.exports = {
  register,
  login,
  verificarAdmin,
  requestPasswordReset,
  verifyCode,
  resetPassword
};