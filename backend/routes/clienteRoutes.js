const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

router.get('/:id', clienteController.obterCliente);
router.post('', clienteController.criarCliente);
router.put('/:id', clienteController.atualizarCliente);
router.delete('/:id', clienteController.deletarCliente);

module.exports = router;
