const db = require('../config/db.js');

const Produto = {
  create: (titulo, preco, imagem, categoria, barcode, quantidade_estoque) => {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO produtos (titulo, preco, imagem, categoria, barcode, quantidade_estoque, data_produto) VALUES (?, ?, ?, ?, ?, ?, NOW())';
      db.query(query, [titulo, preco, imagem, categoria, barcode, quantidade_estoque], (err, results) => {
        err ? reject(err) : resolve(results);
      });
    });
  },

  findAll: () => {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM produtos';
      db.query(query, [], (err, results) => {
        err ? reject(err) : resolve(results);
      });
    });
  },

  findById: (id) => {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM produtos WHERE produto_id = ?';
      db.query(query, [id], (err, results) => {
        err ? reject(err) : resolve(results);
      });
    });
  },

  findByBarcode: (barcode) => {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM produtos WHERE barcode = ?';
      db.query(query, [barcode], (err, results) => {
        err ? reject(err) : resolve(results);
      });
    });
  },

  findAllActive: () => {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM produtos WHERE ativo = 1';
      db.query(query, [], (err, results) => {
        err ? reject(err) : resolve(results);
      });
    });
  },

  toggleActive: (id, ativo) => {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE produtos SET ativo = ? WHERE produto_id = ?';
      db.query(query, [ativo, id], (err, results) => {
        if (err) {
          console.error(`Erro ao executar toggleActive para produto ${id}:`, err);
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  },

  update: (id, titulo, preco, imagem, categoria, barcode, quantidade_estoque) => {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE produtos SET titulo = ?, preco = ?, imagem = ?, categoria = ?, barcode = ?, quantidade_estoque = ? WHERE produto_id = ?';
      db.query(query, [titulo, preco, imagem, categoria, barcode, quantidade_estoque, id], (err, results) => {
        err ? reject(err) : resolve(results);
      });
    });
  },

  incrementStock: (barcode, quantidade) => {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE produtos SET quantidade_estoque = quantidade_estoque + ? WHERE barcode = ?';
      db.query(query, [quantidade, barcode], (err, results) => {
        if (err) {
          reject(err);
        } else if (results.affectedRows === 0) {
          reject(new Error('Produto não encontrado'));
        } else {
          resolve(results);
        }
      });
    });
  },

  createTempProduct: (nome, barcode, valor_unitario, quantidade) => {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO produtos_temporarios (nome, barcode, valor_unitario, quantidade) VALUES (?, ?, ?, ?)';
      db.query(query, [nome, barcode, valor_unitario, quantidade], (err, results) => {
        err ? reject(err) : resolve(results);
      });
    });
  },

  findAllTempProducts: () => {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM produtos_temporarios';
      db.query(query, [], (err, results) => {
        err ? reject(err) : resolve(results);
      });
    });
  },

  deleteTempProduct: (id) => {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM produtos_temporarios WHERE id = ?';
      db.query(query, [id], (err, results) => {
        err ? reject(err) : resolve(results);
      });
    });
  },
};

module.exports = Produto;