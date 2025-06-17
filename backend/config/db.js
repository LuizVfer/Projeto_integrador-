// config/db.js
const mysql = require("mysql2");
require("dotenv").config();

const pool = mysql.createPool({
  connectionLimit: 10, // Limite de conexões simultâneas
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "19091992",
  database: process.env.DB_NAME || "qrup",
  port: process.env.DB_PORT || 3306,
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error("Erro ao conectar ao MySQL:", err);
  } else {
    console.log("Conectado ao MySQL com pool!");
    connection.release();
  }
});

module.exports = pool;
