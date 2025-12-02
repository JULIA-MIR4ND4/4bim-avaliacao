const express = require('express');
const router = express.Router();
const relatoriosController = require('../controllers/relatoriosController');

// Páginas HTML
router.get('/estatisticas', relatoriosController.abrirRelatorioEstatisticas);
router.get('/estatisticas/', relatoriosController.abrirRelatorioEstatisticas);
router.get('/vendas', relatoriosController.abrirRelatorioVendas);
router.get('/vendas/', relatoriosController.abrirRelatorioVendas);

// APIs para dados
router.get('/api/estatisticas', relatoriosController.getEstatisticas);
router.get('/api/vendas', relatoriosController.getVendas);
router.get('/api/receita-mes', relatoriosController.getReceitaPorMes);

module.exports = router;
