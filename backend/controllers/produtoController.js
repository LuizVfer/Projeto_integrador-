const Produto = require('../models/produtoModels.js');
const fs = require('fs').promises;
const path = require('path');
const db = require('../config/db.js');
const Joi = require('joi');

const CATEGORIAS_VALIDAS = ['bebidas', 'alimentos', 'outros'];

const produtoSchema = Joi.object({
  titulo: Joi.string().min(3).max(100).required(),
  preco: Joi.number().positive().required(),
  categoria: Joi.string().valid(...CATEGORIAS_VALIDAS).required(),
});

const checkPedidos = (produto_id) => {
  return new Promise((resolve, reject) => {
    db.query('SELECT COUNT(*) as count FROM itens_pedido WHERE produto_id = ?', [produto_id], (err, results) => {
      if (err) {
        console.error('Erro na query checkPedidos:', err);
        reject(err);
      } else {
        resolve(results[0].count);
      }
    });
  });
};

const produtoController = {
  findAll: async (req, res) => {
    try {
      const produtos = await Produto.findAll();
      res.status(200).json(produtos);
    } catch (err) {
      res.status(500).json({ message: 'Erro ao listar produtos', error: err.message });
    }
  },

  create: async (req, res) => {
    try {
      const { titulo, preco, categoria } = req.body;
      const imagem = req.file ? req.file.filename : null;

      if (!titulo || typeof titulo !== 'string' || titulo.length > 100) {
        return res.status(400).json({ message: 'Título deve ser uma string até 100 caracteres' });
      }
      if (!preco || isNaN(preco) || parseFloat(preco) <= 0) {
        return res.status(400).json({ message: 'Preço deve ser um número positivo' });
      }
      if (!categoria || !CATEGORIAS_VALIDAS.includes(categoria)) {
        return res.status(400).json({ message: 'Categoria inválida. Use: bebidas, alimentos, outros' });
      }
      if (!imagem) {
        return res.status(400).json({ message: 'Imagem é obrigatória' });
      }

      const result = await Produto.create(titulo, parseFloat(preco), imagem, categoria);
      res.status(201).json({ id: result.insertId, titulo, preco, imagem, categoria });
    } catch (err) {
      res.status(500).json({ message: 'Erro ao criar produto', error: err.message });
    }
  },

  findAllActive: async (req, res) => {
    try {
      const produtos = await Produto.findAllActive();
      res.status(200).json(produtos);
    } catch (err) {
      res.status(500).json({ message: 'Erro ao listar produtos ativos', error: err.message });
    }
  },

alterarStatus: async (req, res) => {
  try {
    const { id } = req.params;
    let { ativo } = req.body;

    ativo = parseInt(ativo);
    if (isNaN(ativo) || (ativo !== 0 && ativo !== 1)) {
      return res.status(400).json({ message: 'O campo ativo deve ser 0 ou 1' });
    }

    const [produto] = await Produto.findById(id);
    if (!produto) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    await Produto.toggleActive(id, ativo);
    res.status(200).json({ message: `Produto ${ativo ? 'ativado' : 'desativado'} com sucesso` });
  } catch (err) {
    console.error('Erro no alterarStatus:', err);
    res.status(500).json({ message: 'Erro ao alterar status do produto', error: err.message });
  }
},

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = produtoSchema.validate(req.body);
      if (error) return res.status(400).json({ message: error.details[0].message });

      const { titulo, preco, categoria } = req.body;
      const imagem = req.file ? req.file.filename : null;

      const [produto] = await Produto.findById(id);
      if (!produto) return res.status(404).json({ message: 'Produto não encontrado' });

      const imagemAntiga = produto.imagem;
      if (imagem && imagemAntiga) {
        const caminhoImagemAntiga = path.join(__dirname, '../../Uploads', imagemAntiga);
        if (await fs.stat(caminhoImagemAntiga).catch(() => false)) {
          await fs.unlink(caminhoImagemAntiga);
        }
      }

      await Produto.update(id, titulo, parseFloat(preco), imagem || imagemAntiga, categoria);
      res.status(200).json({ id, titulo, preco, imagem: imagem || imagemAntiga, categoria });
    } catch (err) {
      res.status(500).json({ message: 'Erro ao atualizar produto', error: err.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const [produto] = await Produto.findById(id);
      if (!produto) return res.status(404).json({ message: 'Produto não encontrado' });

      const pedidoCount = await checkPedidos(id);
      if (pedidoCount > 0) {
        return res.status(400).json({
          message: 'Não é possível deletar o produto porque ele já possui um pedido associado.'
        });
      }

      const caminhoImagem = path.join(__dirname, '../../Uploads', produto.imagem);
      await Produto.delete(id);

      if (await fs.stat(caminhoImagem).catch(() => false)) {
        await fs.unlink(caminhoImagem);
      }

      res.status(200).json({ message: 'Produto deletado com sucesso' });
    } catch (err) {
      res.status(500).json({ message: 'Erro ao deletar produto', error: err.message });
    }
  },
};

module.exports = produtoController;