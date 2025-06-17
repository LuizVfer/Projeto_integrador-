const db = require('../config/db.js');

const Produto = {
  create: (titulo, preco, imagem, categoria) => {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO produtos (titulo, preco, imagem, categoria, data_produto) VALUES (?, ?, ?, ?, NOW())';
      db.query(query, [titulo, preco, imagem, categoria], (err, results) => {
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

  update: (id, titulo, preco, imagem, categoria) => {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE produtos SET titulo = ?, preco = ?, imagem = ?, categoria = ? WHERE produto_id = ?';
      db.query(query, [titulo, preco, imagem, categoria, id], (err, results) => {
        err ? reject(err) : resolve(results);
      });
    });
  },

  delete: (id) => {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM produtos WHERE produto_id = ?';
      db.query(query, [id], (err, results) => {
        err ? reject(err) : resolve(results);
      });
    });
  },
};

module.exports = Produto;