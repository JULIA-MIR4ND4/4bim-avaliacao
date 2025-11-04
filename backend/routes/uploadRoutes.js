const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const uploadController = require('../controllers/uploadController');

// Configuração do Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // pasta de destino
    cb(null, path.join(__dirname, '../../frontend/imagens'));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// Rota principal de upload
router.post('/upload-imagem', upload.single('imagem'), (req, res, next) => {
  next();
}, uploadController.uploadImagem);

module.exports = router;
