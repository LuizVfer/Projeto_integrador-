const Pedido = require('../models/pedidoModels.js');
const Produto = require('../models/produtoModels.js');

const pedidoController = {
  create: async (req, res) => {
    try {
      const { user_id, itens } = req.body;
      if (!user_id || !itens || !Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({ message: 'Dados inválidos para criar pedido' });
      }

      let valor_total = 0;
      for (const item of itens) {
        const results = await Produto.findById(item.produto_id);
        const [produto] = results;
        if (!produto) {
          return res.status(404).json({ message: `Produto ${item.produto_id} não encontrado` });
        }
        if (item.quantidade <= 0) {
          return res.status(400).json({ message: `Quantidade inválida para o produto ${item.produto_id}` });
        }
        valor_total += produto.preco * item.quantidade;
      }

      const pedidoResult = await new Promise((resolve, reject) => {
        Pedido.createPedido(user_id, valor_total, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      const pedido_id = pedidoResult.insertId;

      for (const item of itens) {
        await new Promise((resolve, reject) => {
          Pedido.addItem(pedido_id, item.produto_id, item.quantidade, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });
      }

      res.status(201).json({ pedido_id, user_id, itens, valor_total });
    } catch (err) {
      console.error('Erro ao criar pedido:', err);
      res.status(500).json({ message: 'Erro ao criar pedido', error: err.message });
    }
  },

  findAll: async (req, res) => {
    try {
      // Extrair filtros da query string
      const filters = {
        status: req.query.status,
        nomeCliente: req.query.nomeCliente,
        dataInicio: req.query.dataInicio,
        dataFim: req.query.dataFim,
        valorMinimo: req.query.valorMinimo ? parseFloat(req.query.valorMinimo) : null,
        valorMaximo: req.query.valorMaximo ? parseFloat(req.query.valorMaximo) : null,
      };

      const pedidos = await new Promise((resolve, reject) => {
        Pedido.findAll(filters, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
      res.status(200).json(pedidos);
    } catch (err) {
      console.error('Erro ao listar pedidos:', err);
      res.status(500).json({ message: 'Erro ao listar pedidos', error: err.message });
    }
  },

  findByUser: async (req, res) => {
    try {
      const userId = req.user.id; // Alterado de req.user.user_id para req.user.id
      if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }
  
      const filters = { userId };
  
      const pedidos = await new Promise((resolve, reject) => {
        Pedido.findAll(filters, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
  
      res.status(200).json(pedidos);
    } catch (err) {
      console.error('Erro ao listar pedidos do usuário:', err);
      res.status(500).json({ message: 'Erro ao listar pedidos do usuário', error: err.message });
    }
  },

  findById: async (req, res) => {
    try {
      const { id } = req.params;
      const pedidos = await new Promise((resolve, reject) => {
        Pedido.findById(id, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      if (!pedidos || pedidos.length === 0) {
        return res.status(404).json({ message: 'Pedido não encontrado' });
      }

      // Estruturar o pedido com itens
      const pedido = {
        pedido_id: pedidos[0].pedido_id,
        user_id: pedidos[0].user_id,
        processo_pedido: pedidos[0].processo_pedido,
        valor_total: Number(pedidos[0].valor_total),
        data_pedido: pedidos[0].data_pedido,
        itens: []
      };

      for (const row of pedidos) {
        if (row.produto_id) {
          const [produto] = await Produto.findById(row.produto_id);
          if (produto) {
            pedido.itens.push({
              produto_id: row.produto_id,
              quantidade: row.quantidade,
              titulo: produto.titulo,
              preco_unitario: Number(produto.preco)
            });
          }
        }
      }

      res.status(200).json(pedido);
    } catch (err) {
      console.error('Erro ao buscar pedido:', err);
      res.status(500).json({ message: 'Erro ao buscar pedido', error: err.message });
    }
  },

  updateStatus: async (req, res) => {
    const { id } = req.params;
    const { processo_pedido } = req.body;

    if (!['aguardando', 'concluido', 'cancelado'].includes(processo_pedido)) {
      return res.status(400).json({ message: 'Status inválido. Use: aguardando, concluido ou cancelado.' });
    }

    try {
      await new Promise((resolve, reject) => {
        Pedido.updateStatus(id, processo_pedido, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      res.status(200).json({ message: `Status do pedido #${id} atualizado para ${processo_pedido}` });
    } catch (err) {
      console.error('Erro ao atualizar status do pedido:', err);
      res.status(500).json({ message: 'Erro ao atualizar status do pedido', error: err.message });
    }
  },
};

module.exports = pedidoController;