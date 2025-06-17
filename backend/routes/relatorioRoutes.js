// routes/relatorioRoutes.js
const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController.js');
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware.js');

router.get('/vendas', authMiddleware, isAdmin, relatorioController.getVendasPorPeriodo);
router.get('/produtos', authMiddleware, isAdmin, relatorioController.getProdutosMaisVendidos);
router.get('/usuarios', authMiddleware, isAdmin, relatorioController.getUsuariosMaisCompraram);
router.get('/categorias', authMiddleware, isAdmin, relatorioController.getDesempenhoCategoria);
router.get('/taxa-cancelamento', authMiddleware, isAdmin, relatorioController.getTaxaCancelamento);

module.exports = router;