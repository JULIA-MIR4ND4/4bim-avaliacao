const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');

router.get('/', pedidoController.abrirCarrinho);
router.get('/finalizar', pedidoController.abrirFinalizar);

module.exports = router;
