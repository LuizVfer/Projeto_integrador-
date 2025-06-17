// routes/perfilRoutes.js
const express = require('express');
const router = express.Router();
const PerfilController = require('../controllers/perfilController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, PerfilController.getPerfil);
router.put('/', authMiddleware, PerfilController.updatePerfil);

module.exports = router;