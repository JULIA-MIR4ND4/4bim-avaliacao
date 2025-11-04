const express = require('express');
const router = express.Router();
const pessoaController = require('../controllers/pessoaController');

// CRUD de Pessoas

router.get('/abrirCrudPessoa', pessoaController.abrirCrudPessoa);
router.get('/gerenciarConta', pessoaController.gerenciarConta);
router.get('/', pessoaController.listarPessoas);
router.post('/', pessoaController.criarPessoa);
router.get('/:id', pessoaController.obterPessoa);
router.get('/nome/:nome', pessoaController.obterPessoaPorNome);
router.put('/:id', pessoaController.atualizarPessoa);
router.delete('/:id', pessoaController.deletarPessoa);
router.put('/senha/:id', pessoaController.atualizarSenha);

// Adicionar rota para atualizar o id_pedido_atual de uma pessoa pelo nome
router.patch('/atualizarPedidoAtual', pessoaController.atualizarPedidoAtualPorNome);

module.exports = router;
