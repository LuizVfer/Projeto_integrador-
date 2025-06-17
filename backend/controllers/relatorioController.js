// controllers/relatorioController.js
const Relatorio = require('../models/relatorioModels.js');

const relatorioController = {
  getVendasPorPeriodo: async (req, res) => {
    try {
      const { periodo, dataInicio, dataFim, status, valorMin } = req.query;
      if (!['diario', 'mensal', 'anual'].includes(periodo)) {
        return res.status(400).json({ message: 'Período inválido. Use: diario, mensal, anual.' });
      }
      if (!dataInicio || !dataFim) {
        return res.status(400).json({ message: 'dataInicio e dataFim são obrigatórios.' });
      }

      const vendas = await new Promise((resolve, reject) => {
        Relatorio.getVendasPorPeriodo(periodo, dataInicio, dataFim, status, valorMin, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      res.status(200).json(vendas);
    } catch (err) {
      console.error('Erro ao buscar vendas:', err);
      res.status(500).json({ message: 'Erro ao buscar vendas', error: err.message });
    }
  },

  getProdutosMaisVendidos: async (req, res) => {
    try {
      const { dataInicio, dataFim, categoria } = req.query;
      if (!dataInicio || !dataFim) {
        return res.status(400).json({ message: 'dataInicio e dataFim são obrigatórios.' });
      }

      const produtos = await new Promise((resolve, reject) => {
        Relatorio.getProdutosMaisVendidos(dataInicio, dataFim, categoria, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      res.status(200).json(produtos);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      res.status(500).json({ message: 'Erro ao buscar produtos', error: err.message });
    }
  },

  getUsuariosMaisCompraram: async (req, res) => {
    try {
      const { dataInicio, dataFim } = req.query;
      if (!dataInicio || !dataFim) {
        return res.status(400).json({ message: 'dataInicio e dataFim são obrigatórios.' });
      }

      const usuarios = await new Promise((resolve, reject) => {
        Relatorio.getUsuariosMaisCompraram(dataInicio, dataFim, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      res.status(200).json(usuarios);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      res.status(500).json({ message: 'Erro ao buscar usuários', error: err.message });
    }
  },

  getDesempenhoCategoria: async (req, res) => {
    try {
      const { dataInicio, dataFim } = req.query;
      if (!dataInicio || !dataFim) {
        return res.status(400).json({ message: 'dataInicio e dataFim são obrigatórios.' });
      }

      const categorias = await new Promise((resolve, reject) => {
        Relatorio.getDesempenhoCategoria(dataInicio, dataFim, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      res.status(200).json(categorias);
    } catch (err) {
      console.error('Erro ao buscar categorias:', err);
      res.status(500).json({ message: 'Erro ao buscar categorias', error: err.message });
    }
  },

  getTaxaCancelamento: async (req, res) => {
    try {
      const { dataInicio, dataFim } = req.query;

      if (!dataInicio || !dataFim) {
        return res.status(400).json({ message: 'dataInicio e dataFim são obrigatórios.' });
      }

      const taxa = await new Promise((resolve, reject) => {
        Relatorio.getTaxaCancelamento(dataInicio, dataFim, (err, results) => {
          if (err) reject(err);
          else {
            const result = results[0] || { taxa_cancelamento: 0, total_pedidos: 0, pedidos_cancelados: 0 };
            result.taxa_cancelamento = Number(result.taxa_cancelamento) || 0;
            result.pedidos_cancelados = Number(result.pedidos_cancelados) || 0;
            resolve(result);
          }
        });
      });

      res.status(200).json(taxa);
    } catch (err) {
      console.error('Erro ao buscar taxa de cancelamento:', err);
      res.status(500).json({ message: 'Erro ao buscar taxa', error: err.message });
    }
  },
};

module.exports = relatorioController;