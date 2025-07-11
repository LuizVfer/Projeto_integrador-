const Produto = require('../models/produtoModels.js');
const fs = require('fs').promises;
const path = require('path');
const db = require('../config/db.js');
const Joi = require('joi');
const xml2js = require('xml2js');

const CATEGORIAS_VALIDAS = ['bebidas', 'alimentos', 'outros'];

const isValidEAN13 = (barcode) => {
  if (!/^\d{13}$/.test(barcode)) return false;
  const digits = barcode.split('').map(Number);
  const checksum = digits.pop();
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }
  const calculatedChecksum = (10 - (sum % 10)) % 10;
  return checksum === calculatedChecksum;
};

const produtoSchema = Joi.object({
  titulo: Joi.string().min(3).max(100).required(),
  preco: Joi.number().positive().required(),
  categoria: Joi.string().valid(...CATEGORIAS_VALIDAS).required(),
  barcode: Joi.string().max(50).pattern(/^\d{13}$/).required()
    .custom((value, helpers) => {
      if (!isValidEAN13(value)) {
        return helpers.error('string.invalidEAN13');
      }
      return value;
    })
    .messages({
      'string.pattern.base': 'Código de barras EAN-13 deve ter 13 dígitos numéricos',
      'string.invalidEAN13': 'Código de barras EAN-13 inválido. O checksum está incorreto.',
      'any.required': 'Código de barras é obrigatório',
    }),
  quantidade_estoque: Joi.number().integer().min(0).required()
    .messages({
      'number.base': 'Quantidade em estoque deve ser um número',
      'number.integer': 'Quantidade em estoque deve ser um número inteiro',
      'number.min': 'Quantidade em estoque não pode ser negativa',
      'any.required': 'Quantidade em estoque é obrigatória',
    }),
});

const produtoController = {
  findAll: async (req, res) => {
    try {
      const produtos = await Produto.findAll();
      res.status(200).json(produtos);
    } catch (err) {
      res.status(500).json({ message: 'Erro ao listar produtos', error: err.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const [produto] = await Produto.findById(id);
      if (!produto) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }
      res.status(200).json(produto);
    } catch (err) {
      res.status(500).json({ message: 'Erro ao buscar produto', error: err.message });
    }
  },

  create: async (req, res) => {
    try {
      const { titulo, preco, categoria, barcode, quantidade_estoque } = req.body;
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
      if (quantidade_estoque === undefined || isNaN(quantidade_estoque) || parseInt(quantidade_estoque) < 0) {
        return res.status(400).json({ message: 'Quantidade em estoque deve ser um número inteiro não negativo' });
      }
      const [existing] = await Produto.findByBarcode(barcode);
      if (existing) {
        return res.status(400).json({ message: 'Código de barras já cadastrado' });
      }
      if (barcode && !/^\d{13}$/.test(barcode)) {
        return res.status(400).json({ message: 'Código de barras EAN-13 deve ter 13 dígitos numéricos' });
      }
      const result = await Produto.create(titulo, parseFloat(preco), imagem, categoria, barcode, parseInt(quantidade_estoque));
      res.status(201).json({ id: result.insertId, titulo, preco, imagem, categoria, barcode, quantidade_estoque });
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
        return res.status(400).json({ message: 'O funerativo deve ser 0 ou 1' });
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

      const { titulo, preco, categoria, barcode, quantidade_estoque } = req.body;
      const imagem = req.file ? req.file.filename : null;

      const [produto] = await Produto.findById(id);
      if (!produto) return res.status(404).json({ message: 'Produto não encontrado' });

      const [existing] = await Produto.findByBarcode(barcode);
      if (existing && existing.produto_id !== parseInt(id)) {
        return res.status(400).json({ message: 'Código de barras já cadastrado' });
      }

      const imagemAntiga = produto.imagem;
      if (imagem && imagemAntiga) {
        const caminhoImagemAntiga = path.join(__dirname, '../../Uploads', imagemAntiga);
        if (await fs.stat(caminhoImagemAntiga).catch(() => false)) {
          await fs.unlink(caminhoImagemAntiga);
        }
      }

      await Produto.update(id, titulo, parseFloat(preco), imagem || imagemAntiga, categoria, barcode, parseInt(quantidade_estoque));
      res.status(200).json({ id, titulo, preco, imagem: imagem || imagemAntiga, categoria, quantidade_estoque });
    } catch (err) {
      res.status(500).json({ message: 'Erro ao atualizar produto', error: err.message });
    }
  },

  incrementStock: async (req, res) => {
    try {
      const { barcode, quantidade } = req.body;

      const schema = Joi.object({
        barcode: Joi.string().max(50).pattern(/^\d{13}$/).required()
          .custom((value, helpers) => {
            if (!isValidEAN13(value)) {
              return helpers.error('string.invalidEAN13');
            }
            return value;
          })
          .messages({
            'string.pattern.base': 'Código de barras EAN-13 deve ter 13 dígitos numéricos',
            'string.invalidEAN13': 'Código de barras EAN-13 inválido. O checksum está incorreto.',
            'any.required': 'Código de barras é obrigatório',
          }),
        quantidade: Joi.number().integer().min(1).required()
          .messages({
            'number.base': 'Quantidade deve ser um número',
            'number.integer': 'Quantidade deve ser um número inteiro',
            'number.min': 'Quantidade deve ser um número inteiro positivo',
            'any.required': 'Quantidade é obrigatória',
          }),
      });

      const { error } = schema.validate({ barcode, quantidade });
      if (error) return res.status(400).json({ message: error.details[0].message });

      const [produto] = await Produto.findByBarcode(barcode);
      if (!produto) {
        return res.status(404).json({ message: 'Produto não encontrado' });
      }

      await Produto.incrementStock(barcode, parseInt(quantidade));
      res.status(200).json({ message: 'Estoque atualizado com sucesso' });
    } catch (err) {
      console.error('Erro ao incrementar estoque:', err);
      res.status(500).json({ message: 'Erro ao atualizar estoque', error: err.message });
    }
  },

  importNFe: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Arquivo XML da NF-e é obrigatório' });
      }

      const xmlPath = path.join(__dirname, '../../Uploads', req.file.filename);
      const xmlContent = await fs.readFile(xmlPath, 'utf-8');

      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(xmlContent);

      const nfe = result.nfeProc?.NFe?.infNFe;
      if (!nfe || !nfe.det) {
        await fs.unlink(xmlPath);
        return res.status(400).json({ message: 'Estrutura do XML inválida ou sem itens' });
      }

      const itens = Array.isArray(nfe.det) ? nfe.det : [nfe.det];
      const resultados = [];
      let erros = [];

      for (const item of itens) {
        const produtoNFe = item.prod;
        const barcode = produtoNFe.cEAN || produtoNFe.cProd;
        const quantidade = parseInt(produtoNFe.qCom);
        const nome = produtoNFe.xProd;
        const valorUnitario = parseFloat(produtoNFe.vUnCom);

        if (!barcode) {
          erros.push(`Código de barras ausente para o produto ${nome}`);
          console.error(`Código de barras ausente para ${nome}`);
          continue;
        }

        if (isNaN(quantidade) || quantidade <= 0) {
          erros.push(`Quantidade inválida para o produto ${nome} (${quantidade})`);
          console.error(`Quantidade inválida: ${quantidade} para ${nome}`);
          continue;
        }

        const [produto] = await Produto.findByBarcode(barcode);

        if (!produto) {
          try {
            await Produto.createTempProduct(nome, barcode, valorUnitario, quantidade);
            resultados.push(`Produto com código de barras ${barcode} (${nome}) não encontrado no sistema e adicionado à tabela temporária`);
          } catch (tempErr) {
            erros.push(`Erro ao adicionar produto ${nome} (barcode: ${barcode}) à tabela temporária: ${tempErr.message}`);
            console.error(`Erro ao adicionar produto temporário: ${tempErr.message}`);
          }
          continue;
        }

        try {
          await Produto.incrementStock(barcode, quantidade);
          resultados.push({
            barcode,
            nome,
            quantidade,
            message: `Estoque do produto ${nome} atualizado com sucesso`,
          });
        } catch (stockErr) {
          erros.push(`Erro ao incrementar estoque do produto ${nome} (barcode: ${barcode}): ${stockErr.message}`);
          console.error(`Erro ao incrementar estoque: ${stockErr.message}`);
        }
      }

      await fs.unlink(xmlPath);

      res.status(200).json({
        message: 'Processamento da NF-e concluído',
        resultados,
        erros: erros.length > 0 ? erros : undefined,
      });
    } catch (err) {
      console.error('Erro ao processar NF-e:', err);
      if (req.file) {
        const xmlPath = path.join(__dirname, '../../Uploads', req.file.filename);
        await fs.unlink(xmlPath).catch((unlinkErr) => console.error('Erro ao excluir arquivo XML:', unlinkErr));
      }
      res.status(500).json({ message: 'Erro ao processar NF-e', error: err.message });
    }
  },

  findAllTempProducts: async (req, res) => {
    try {
      const produtos = await Produto.findAllTempProducts();
      res.status(200).json(produtos);
    } catch (err) {
      res.status(500).json({ message: 'Erro ao listar produtos temporários', error: err.message });
    }
  },

  deleteTempProduct: async (req, res) => {
    try {
      const { id } = req.params;
      await Produto.deleteTempProduct(id);
      res.status(200).json({ message: 'Produto temporário excluído com sucesso' });
    } catch (err) {
      res.status(500).json({ message: 'Erro ao excluir produto temporário', error: err.message });
    }
  },
};

module.exports = produtoController;