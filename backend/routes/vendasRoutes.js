// backend/routes/vendasRouter.js

const express = require('express');
const router = express.Router();
const vendasController = require('../controllers/vendasController');

// Rota para obter todos os dados de vendas (com suporte a filtros via query params)
router.get('/api/vendas', vendasController.getAllSales);

// Outras rotas como /api/vendas/:id, /api/vendas/export, etc., seriam adicionadas aqui

module.exports = router;
