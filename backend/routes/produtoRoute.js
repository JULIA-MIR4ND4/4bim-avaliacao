const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');

router.get('/abrirCrudProduto', produtoController.abrirCrudProduto);
router.get('/', produtoController.listarProdutos);
router.get('/:id', produtoController.buscarProdutoPorId);
router.post('/', produtoController.inserirProduto);
router.put('/:id', produtoController.alterarProduto);
router.delete('/:id', produtoController.excluirProduto);

module.exports = router;
