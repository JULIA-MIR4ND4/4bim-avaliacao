const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');

// Rotas específicas devem vir ANTES de rotas genéricas (/:id)
router.get('/crudPedido', pedidoController.abrirCrudPedido);
router.get('/carrinho', pedidoController.abrirCarrinho);
router.get('/debug/:id', pedidoController.debugPedido);
router.get('/produtos/:id', pedidoController.buscarProdutosDoPedido);
router.post('/produtos', pedidoController.inserirOuAtualizarProdutosNoPedido);

// Rotas genéricas (/:id) DEPOIS
router.get('/', pedidoController.listarPedidos);
router.get('/:id', pedidoController.buscarPedidoPorId);
router.post('/', pedidoController.inserirPedido);
router.put('/:id', pedidoController.atualizarPedido);
router.delete('/:id', pedidoController.excluirPedido);
module.exports = router;
