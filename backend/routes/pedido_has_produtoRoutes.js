// backend/routes/pedido_has_produtoRoutes.js - Rotas para /pedido/produtos

const express = require('express');
const router = express.Router();
const pedido_has_produtoController = require('../controllers/pedido_has_produtoController');

// ✅ GET /pedido/produtos - Listar todos os itens de pedidos
router.get('/', pedido_has_produtoController.listarProdutosDoPedido);

// ✅ GET /pedido/produtos/:idPedido - Obter todos os itens de um pedido específico
// ⚠️ Esta rota deve vir ANTES da rota com dois parâmetros, para evitar conflito
router.get('/:idPedido', pedido_has_produtoController.obterItensDoPedido);

// ✅ GET /pedido/produtos/:idPedido/:idProduto - Obter item específico (pedido + produto)
router.get('/:idPedido/:idProduto', pedido_has_produtoController.obterItemDoPedido);

// ✅ POST /pedido/produtos - Criar novo item de pedido
router.post('/', pedido_has_produtoController.criarItemDoPedido);

// ✅ POST /pedido/produtos/lote - Inserção em lote de vários produtos
router.post('/lote', pedido_has_produtoController.criarItensPedidoEmLote);

// ✅ PUT /pedido/produtos/:idPedido/:idProduto - Atualizar item do pedido
router.put('/:idPedido/:idProduto', pedido_has_produtoController.atualizarItemDoPedido);

// ✅ DELETE /pedido/produtos/:idPedido/:idProduto - Deletar item do pedido
router.delete('/:idPedido/:idProduto', pedido_has_produtoController.deletarItemDoPedido);

module.exports = router;
