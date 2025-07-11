// backend/server.js
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes.js");
const produtosRouter = require("./routes/produtosRoutes.js");
const perfilRouter = require("./routes/perfilRoutes.js");
const pedidoRouter = require("./routes/pedidoRoutes.js");
const relatorioRoutes = require("./routes/relatorioRoutes.js");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();

app.use(express.json());
// Atualize o CORS para permitir a origem do frontend
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:5500"], // Permite múltiplas origens
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use("/uploads", express.static("uploads"));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

app.use("/api", authRoutes); // Auth vem depois
app.use("/api", pedidoRouter); // Prioridade para pedidos
app.use("/produtos", produtosRouter);
app.use("/perfil", perfilRouter);
app.use("/relatorios", relatorioRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ message: "Erro interno no servidor", error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
