// models/pedidoModels.js
const db = require('../config/db.js');

const Pedido = {
  createPedido: (user_id, valor_total, callback) => {
    const query = `
      INSERT INTO pedidos (user_id, valor_total, data_pedido)
      VALUES (?, ?, NOW())
    `;
    db.query(query, [user_id, valor_total], (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  },

  addItem: (pedido_id, produto_id, quantidade, callback) => {
    const query = `
      INSERT INTO itens_pedido (pedido_id, produto_id, quantidade)
      VALUES (?, ?, ?)
    `;
    db.query(query, [pedido_id, produto_id, quantidade], (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  },

  findById: (pedido_id, callback) => {
    const query = `
      SELECT p.*, ip.produto_id, ip.quantidade
      FROM pedidos p
      LEFT JOIN itens_pedido ip ON p.pedido_id = ip.pedido_id
      WHERE p.pedido_id = ?
    `;
    db.query(query, [pedido_id], (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  },

  findAll: (filters, callback) => {
    let query = `
      SELECT 
        p.pedido_id,
        p.user_id,
        u.username AS usuario_nome,
        pf.cpf AS usuario_cpf,
        p.processo_pedido,
        p.valor_total,
        p.data_pedido,
        ip.produto_id,
        ip.quantidade,
        pr.titulo AS produto_nome,
        pr.preco AS produto_preco
      FROM pedidos p
      LEFT JOIN usuarios u ON p.user_id = u.user_id
      LEFT JOIN perfil pf ON u.user_id = pf.user_id
      LEFT JOIN itens_pedido ip ON p.pedido_id = ip.pedido_id
      LEFT JOIN produtos pr ON ip.produto_id = pr.produto_id
    `;
    
    const conditions = [];
    const values = [];

    // Filtro por userId (novo)
    if (filters.userId) {
      conditions.push('p.user_id = ?');
      values.push(filters.userId);
    }

    // Filtro por status
    if (filters.status && ['aguardando', 'concluido', 'cancelado'].includes(filters.status)) {
      conditions.push('p.processo_pedido = ?');
      values.push(filters.status);
    }

    // Filtro por nome do cliente (busca parcial)
    if (filters.nomeCliente) {
      conditions.push('u.username LIKE ?');
      values.push(`%${filters.nomeCliente}%`);
    }

    // Filtro por intervalo de datas
    if (filters.dataInicio && filters.dataFim) {
      conditions.push('p.data_pedido BETWEEN ? AND ?');
      values.push(filters.dataInicio, filters.dataFim);
    } else if (filters.dataInicio) {
      conditions.push('p.data_pedido >= ?');
      values.push(filters.dataInicio);
    } else if (filters.dataFim) {
      conditions.push('p.data_pedido <= ?');
      values.push(filters.dataFim);
    }

    // Filtro por faixa de valor total
    if (filters.valorMinimo) {
      conditions.push('p.valor_total >= ?');
      values.push(filters.valorMinimo);
    }
    if (filters.valorMaximo) {
      conditions.push('p.valor_total <= ?');
      values.push(filters.valorMaximo);
    }

    // Adicionar condições à query
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Ordenar por data do pedido (mais recente primeiro)
    query += ' ORDER BY p.data_pedido DESC';

    db.query(query, values, (err, results) => {
      if (err) return callback(err);

      const pedidos = {};
      results.forEach(row => {
        if (!pedidos[row.pedido_id]) {
          pedidos[row.pedido_id] = {
            pedido_id: row.pedido_id,
            user_id: row.user_id,
            usuario_nome: row.usuario_nome,
            usuario_cpf: row.usuario_cpf,
            processo_pedido: row.processo_pedido,
            valor_total: Number(row.valor_total),
            data_pedido: row.data_pedido,
            itens: []
          };
        }
        if (row.produto_id) {
          pedidos[row.pedido_id].itens.push({
            produto_id: row.produto_id,
            quantidade: row.quantidade,
            produto_nome: row.produto_nome,
            produto_preco: Number(row.produto_preco)
          });
        }
      });
      callback(null, Object.values(pedidos));
    });
  },

  updateStatus: (pedidoId, processo_pedido, callback) => {
    const query = 'UPDATE pedidos SET processo_pedido = ? WHERE pedido_id = ?';
    db.query(query, [processo_pedido, pedidoId], (err, result) => {
      if (err) return callback(err);
      if (result.affectedRows === 0) return callback(new Error('Pedido não encontrado'));
      callback(null, result);
    });
  },
};

module.exports = Pedido;