// models/relatorioModels.js
const db = require('../config/db.js');

const Relatorio = {
  getVendasPorPeriodo: (periodo, dataInicio, dataFim, status, valorMin, callback) => {
    let query;
    let values = [];
    const dataFimAjustada = `${dataFim} 23:59:59`;

    if (periodo === 'diario') {
      query = `
            SELECT DATE(data_pedido) AS data, 
                   COUNT(*) AS total_pedidos, 
                   COALESCE(SUM(valor_total), 0) AS valor_total
            FROM pedidos 
            WHERE data_pedido BETWEEN ? AND ?`;
      values = [dataInicio, dataFim];
    } else if (periodo === 'mensal') {
      query = `
            SELECT DATE_FORMAT(data_pedido, '%Y-%m') AS data, 
                   COUNT(*) AS total_pedidos, 
                   COALESCE(SUM(valor_total), 0) AS valor_total
            FROM pedidos 
            WHERE data_pedido BETWEEN ? AND ?`;
      values = [dataInicio, dataFim];
    } else if (periodo === 'anual') {
      query = `
            SELECT YEAR(data_pedido) AS data, 
                   COUNT(*) AS total_pedidos, 
                   COALESCE(SUM(valor_total), 0) AS valor_total
            FROM pedidos 
            WHERE data_pedido BETWEEN ? AND ?`;
      values = [dataInicio, dataFim];
    }

    // Aplicar filtro de status
    if (status) {
      query += ` AND processo_pedido = ?`;
      values.push(status);
    } else {
      query += ` AND processo_pedido = 'concluido'`;
    }

    // Aplicar filtro de valor mínimo
    if (valorMin) {
      query += ` AND valor_total >= ?`;
      values.push(Number(valorMin));
    }

    // Completar a query com agrupamento
    if (periodo === 'diario') {
      query += ` GROUP BY DATE(data_pedido) ORDER BY data DESC`;
    } else if (periodo === 'mensal') {
      query += ` GROUP BY DATE_FORMAT(data_pedido, '%Y-%m') ORDER BY data DESC`;
    } else if (periodo === 'anual') {
      query += ` GROUP BY YEAR(data_pedido) ORDER BY data DESC`;
    }

    db.query(query, values, (err, results) => {
      callback(err, results);
    });
  },

  getProdutosMaisVendidos: (dataInicio, dataFim, categoria, callback) => {
    const dataFimAjustada = `${dataFim} 23:59:59`;
    let query = `
      SELECT p.produto_id, p.titulo, p.categoria, 
             SUM(ip.quantidade) AS quantidade_vendida, 
             COALESCE(SUM(ip.quantidade * p.preco), 0) AS valor_total
      FROM itens_pedido ip
      JOIN produtos p ON ip.produto_id = p.produto_id
      JOIN pedidos ped ON ip.pedido_id = ped.pedido_id
      WHERE ped.processo_pedido = 'concluido' 
        AND ped.data_pedido BETWEEN ? AND ?`;
    let values = [dataInicio, dataFim];

    if (categoria) {
      query += ` AND p.categoria = ?`;
      values.push(categoria);
    }

    query += `
      GROUP BY p.produto_id, p.titulo, p.categoria
      ORDER BY quantidade_vendida DESC
      LIMIT 10`;

    db.query(query, values, (err, results) => {
      callback(err, results);
    });
  },

  getUsuariosMaisCompraram: (dataInicio, dataFim, callback) => {
    const dataFimAjustada = `${dataFim} 23:59:59`;
    const query = `
      SELECT u.user_id, u.username, p.nome, 
             COUNT(ped.pedido_id) AS total_pedidos, 
             COALESCE(SUM(ped.valor_total), 0) AS valor_total
      FROM pedidos ped
      JOIN usuarios u ON ped.user_id = u.user_id
      LEFT JOIN perfil p ON u.user_id = p.user_id
      WHERE ped.processo_pedido = 'concluido' 
        AND ped.data_pedido BETWEEN ? AND ?
      GROUP BY u.user_id, u.username, p.nome
      ORDER BY valor_total DESC
      LIMIT 10`;
    db.query(query, [dataInicio, dataFim], (err, results) => {
      callback(err, results);
    });
  },

  getDesempenhoCategoria: (dataInicio, dataFim, callback) => {
    const dataFimAjustada = `${dataFim} 23:59:59`;
    const query = `
      SELECT p.categoria, 
             COUNT(ip.pedido_id) AS total_pedidos, 
             SUM(ip.quantidade) AS total_itens, 
             COALESCE(SUM(ip.quantidade * p.preco), 0) AS valor_total
      FROM itens_pedido ip
      JOIN produtos p ON ip.produto_id = p.produto_id
      JOIN pedidos ped ON ip.pedido_id = ped.pedido_id
      WHERE ped.processo_pedido = 'concluido' 
        AND ped.data_pedido BETWEEN ? AND ?
      GROUP BY p.categoria
      ORDER BY valor_total DESC`;
    db.query(query, [dataInicio, dataFim], (err, results) => {
      callback(err, results);
    });
  },

  getTaxaCancelamento: (dataInicio, dataFim, callback) => {
    const dataFimAjustada = `${dataFim} 23:59:59`;
    const query = `
      SELECT 
        CAST((SUM(CASE WHEN processo_pedido = 'cancelado' THEN 1 ELSE 0 END) / COUNT(*)) * 100 AS DECIMAL(10,2)) AS taxa_cancelamento,
        COUNT(*) AS total_pedidos,
        SUM(CASE WHEN processo_pedido = 'cancelado' THEN 1 ELSE 0 END) AS pedidos_cancelados
      FROM pedidos
      WHERE data_pedido BETWEEN ? AND ?`;
    db.query(query, [dataInicio, dataFim], (err, results) => {
      callback(err, results);
    });
  },
};

module.exports = Relatorio;