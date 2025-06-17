const express = require('express');
const pedidoController = require('../controllers/pedidoController.js');
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware.js');

const router = express.Router();

router.post('/pedidos', authMiddleware, pedidoController.create);
router.get('/pedidos', authMiddleware, isAdmin, pedidoController.findAll);
router.get('/pedidos/usuario', authMiddleware, pedidoController.findByUser); // Nova rota
router.put('/pedidos/:id', authMiddleware, isAdmin, pedidoController.updateStatus);
router.get('/pedidos/:id', authMiddleware, pedidoController.findById);

module.exports = router;