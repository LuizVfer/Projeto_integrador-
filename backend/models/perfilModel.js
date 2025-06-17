// models/perfilModel.js
const db = require('../config/db');

class PerfilModel {
  static findByUserId(userId, callback) {
    db.query(
      `SELECT p.*, c.contato1, c.contato2 
       FROM perfil p
       LEFT JOIN contatos c ON p.cpf = c.cpf
       WHERE p.user_id = ?`,
      [userId],
      (err, rows) => {
        if (err) return callback(err);
        callback(null, rows[0]);
      }
    );
  }

  static upsert(userId, perfilData, callback) {
    const { nome, data_nascimento, cpf, nome_rua, numero_casa, bairro, cidade, UF, contato1, contato2 } = perfilData;
    db.query(
      `INSERT INTO perfil (cpf, user_id, nome, data_nascimento, nome_rua, numero_casa, bairro, cidade, UF)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       user_id = VALUES(user_id), nome = VALUES(nome), data_nascimento = VALUES(data_nascimento),
       nome_rua = VALUES(nome_rua), numero_casa = VALUES(numero_casa), bairro = VALUES(bairro),
       cidade = VALUES(cidade), UF = VALUES(UF)`,
      [cpf, userId, nome, data_nascimento, nome_rua, numero_casa, bairro, cidade, UF],
      (err, result) => {
        if (err) return callback(err);
        // Atualizar contatos separadamente
        db.query(
          `INSERT INTO contatos (cpf, contato1, contato2)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE
           contato1 = VALUES(contato1), contato2 = VALUES(contato2)`,
          [cpf, contato1, contato2 || null],
          (err) => {
            if (err) return callback(err);
            callback(null, result);
          }
        );
      }
    );
  }

  static findUsuarioById(userId, callback) {
    db.query('SELECT email FROM usuarios WHERE user_id = ?', [userId], (err, rows) => {
      if (err) return callback(err);
      callback(null, rows[0]);
    });
  }

  static updateUsuarioEmail(userId, email, callback) {
    db.query('UPDATE usuarios SET email = ? WHERE user_id = ?', [email, userId], (err, result) => {
      if (err) return callback(err);
      callback(null, result);
    });
  }
}

module.exports = PerfilModel;