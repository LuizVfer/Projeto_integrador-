// controllers/perfilController.js
const PerfilModel = require('../models/perfilModel');

class PerfilController {
  static getPerfil(req, res) {
    const userId = req.user.id;

    PerfilModel.findByUserId(userId, (err, perfil) => {
      if (err) {
        console.error('Erro ao buscar perfil:', err);
        return res.status(500).json({ message: 'Erro ao buscar perfil', error: err.message });
      }

      PerfilModel.findUsuarioById(userId, (err, usuario) => {
        if (err) {
          console.error('Erro ao buscar usuário:', err);
          return res.status(500).json({ message: 'Erro ao buscar usuário', error: err.message });
        }

        if (!usuario) {
          return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        res.status(200).json({
          perfil: perfil || {},
          email: usuario.email
        });
      });
    });
  }

  static updatePerfil(req, res) {
    const userId = req.user.id;
    const { nome, data_nascimento, cpf, contato1, contato2, nome_rua, numero_casa, bairro, cidade, UF, email } = req.body;

    // Validações obrigatórias
    if (!cpf) return res.status(400).json({ message: 'CPF é obrigatório' });
    if (!nome) return res.status(400).json({ message: 'Nome é obrigatório' });
    if (!data_nascimento) return res.status(400).json({ message: 'Data de nascimento é obrigatória' });
    if (!nome_rua) return res.status(400).json({ message: 'Nome da rua é obrigatório' });
    if (numero_casa === undefined || numero_casa === null) return res.status(400).json({ message: 'Número da casa é obrigatório' });
    if (!bairro) return res.status(400).json({ message: 'Bairro é obrigatório' });
    if (!cidade) return res.status(400).json({ message: 'Cidade é obrigatória' });
    if (!UF) return res.status(400).json({ message: 'UF é obrigatório' });
    if (!contato1) return res.status(400).json({ message: 'Contato 1 é obrigatório' });

    // Validação do formato do CPF
    if (!/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf)) {
      return res.status(400).json({ message: 'CPF deve estar no formato xxx.xxx.xxx-xx' });
    }

    // Validação de idade mínima (18 anos)
    const birthDate = new Date(data_nascimento);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    if (age < 18) return res.status(400).json({ message: 'Usuário deve ter pelo menos 18 anos' });

    // Dados para atualização
    const perfilData = {
      nome,
      data_nascimento,
      cpf,
      nome_rua,
      numero_casa,
      bairro,
      cidade,
      UF,
      contato1,
      contato2: contato2 || null, // contato2 é opcional
    };

    PerfilModel.upsert(userId, perfilData, (err) => {
      if (err) {
        console.error('Erro ao atualizar perfil:', err);
        return res.status(500).json({ message: 'Erro ao atualizar perfil', error: err.message });
      }

      if (email) {
        PerfilModel.updateUsuarioEmail(userId, email, (err) => {
          if (err) {
            console.error('Erro ao atualizar email:', err);
            return res.status(500).json({ message: 'Erro ao atualizar email', error: err.message });
          }
          res.status(200).json({ message: 'Perfil atualizado com sucesso' });
        });
      } else {
        res.status(200).json({ message: 'Perfil atualizado com sucesso' });
      }
    });
  }
}

module.exports = PerfilController;