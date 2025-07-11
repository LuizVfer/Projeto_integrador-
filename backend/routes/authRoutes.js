// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController.js');
const { authMiddleware } = require('../middlewares/authMiddleware.js');

router.post('/registro', authController.register);
router.post('/login', authController.login);
router.get('/verificar-admin', authMiddleware, authController.verificarAdmin);
router.post('/solicitar-recuperacao', authController.requestPasswordReset);
router.post('/verificar-codigo', authController.verifyCode);
router.post('/recuperar-senha', authController.resetPassword);

module.exports = router;