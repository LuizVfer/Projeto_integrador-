// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db.js');
require('dotenv').config();

const secretKey = process.env.JWT_SECRET;

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
  const { email, password } = req.body;

  try {
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

    const token = jwt.sign({ id: user.user_id, role: user.role }, secretKey, { expiresIn: '8h' });
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
  const { email, newPassword, confirmPassword } = req.body;

  try {
    // Verificar se as senhas coincidem
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'As senhas não coincidem' });
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

    res.status(200).json({ message: 'Senha redefinida com sucesso!' });
  } catch (err) {
    console.error('Erro ao redefinir senha:', err);
    res.status(500).json({ message: 'Erro ao redefinir senha', error: err.message });
  }
};

module.exports = {
  register,
  login,
  verificarAdmin,
  resetPassword
};