const express = require('express');
const multer = require('multer');
const produtoController = require('../controllers/produtoController.js');
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware.js');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, '../Uploads/'),
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

const uploadXML = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, '../Uploads/'),
    filename: (req, file, cb) => cb(null, `nfe_${Date.now()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/xml' || path.extname(file.originalname).toLowerCase() === '.xml') {
      return cb(null, true);
    }
    cb(new Error('Apenas arquivos XML são permitidos'));
  },
});

const router = express.Router();

router.post('/', authMiddleware, isAdmin, upload.single('imagem'), produtoController.create);
router.get('/', produtoController.findAllActive);
router.put('/:id', authMiddleware, isAdmin, upload.single('imagem'), produtoController.update);
router.put('/:id/status', authMiddleware, isAdmin, produtoController.alterarStatus);
router.get('/admin', authMiddleware, isAdmin, produtoController.findAll);
router.post('/increment-stock', authMiddleware, isAdmin, produtoController.incrementStock);
router.post('/import-nfe', authMiddleware, isAdmin, uploadXML.single('nfe'), produtoController.importNFe);
router.get('/temp-products', authMiddleware, isAdmin, produtoController.findAllTempProducts);
router.delete('/temp-products/:id', authMiddleware, isAdmin, produtoController.deleteTempProduct);

module.exports = router;