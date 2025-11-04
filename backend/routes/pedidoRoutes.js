const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController');

router.get('/crudPedido', pedidoController.abrirCrudPedido);
router.get('/', pedidoController.listarPedidos);
router.get('/:id', pedidoController.buscarPedidoPorId);
// Adicionar rota para buscar produtos de um pedido
router.get('/produtos/:id', pedidoController.buscarProdutosDoPedido);
router.post('/', pedidoController.inserirPedido);
router.put('/:id', pedidoController.atualizarPedido);
router.delete('/:id', pedidoController.excluirPedido);
// Adicionar rota para inserir ou atualizar produtos em um pedido
router.post('/produtos', pedidoController.inserirOuAtualizarProdutosNoPedido);
router.get('/carrinho', pedidoController.abrirCarrinho);
module.exports = router;
