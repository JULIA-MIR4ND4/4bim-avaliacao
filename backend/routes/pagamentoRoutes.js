const express = require('express');
const router = express.Router();
const pagamentoController = require('../controllers/pagamentoController');

// Rota para registrar pagamento e concluir pedido
router.post('/', pagamentoController.registrarPagamento);

module.exports = router;