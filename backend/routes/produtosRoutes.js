// routes/produtosRoutes.js
const express = require('express');
const multer = require('multer');
const produtoController = require('../controllers/produtoController.js');
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware.js');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, '../uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Apenas imagens JPEG/PNG/WEBP são permitidas'));
  },
});

const router = express.Router();

router.post('/', authMiddleware, isAdmin, upload.single('imagem'), produtoController.create);
router.get('/', produtoController.findAllActive);
router.put('/:id', authMiddleware, isAdmin, upload.single('imagem'), produtoController.update);
router.delete('/:id', authMiddleware, isAdmin, produtoController.delete);
router.put('/:id/status', authMiddleware, isAdmin, produtoController.alterarStatus);
router.get('/admin', authMiddleware, isAdmin, produtoController.findAll);

module.exports = router;