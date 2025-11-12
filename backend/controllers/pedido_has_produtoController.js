// pedido_has_produtoController.js - Adaptado para o projeto do usuário
// Rotas: /pedido/produtos (equivalente a /pedido_has_produto do professor)

const { query } = require('../database');
const path = require('path');

/**
 * Listar todos os itens de pedido (GET /pedido/produtos)
 */
exports.listarProdutosDoPedido = async (req, res) => {
  try {
    const result = await query('SELECT * FROM pedidohastenis ORDER BY id_pedido');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar produtos do pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

/**
 * Obter itens de um pedido específico (GET /pedido/produtos/:idPedido)
 */
exports.obterItensDoPedido = async (req, res) => {
  try {
    const { idPedido } = req.params;
    const idPedidoNum = parseInt(idPedido);
    
    if (isNaN(idPedidoNum)) {
      return res.status(400).json({ error: 'ID do pedido inválido' });
    }

    console.log(`[GET /pedido/produtos/${idPedidoNum}] Obtendo itens do pedido`);

    const result = await query(
      `SELECT 
        pht.id_pedido,
        pht.id_tenis,
        p.nome_tenis,
        pht.quantidade,
        pht.preco_unitario
      FROM pedidohastenis pht
      JOIN produto p ON pht.id_tenis = p.id_tenis
      WHERE pht.id_pedido = $1
      ORDER BY pht.id_tenis`,
      [idPedidoNum]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Nenhum item encontrado para este pedido.' });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao obter itens do pedido:', error);
    res.status(500).json({ message: 'Erro ao processar a requisição.', error: error.message });
  }
};

/**
 * Obter um item específico do pedido (GET /pedido/produtos/:idPedido/:idProduto)
 */
exports.obterItemDoPedido = async (req, res) => {
  try {
    const { idPedido, idProduto } = req.params;
    console.log(`[GET /pedido/produtos/${idPedido}/${idProduto}] Obtendo item específico`);

    const idPedidoNum = parseInt(idPedido);
    const idProdutoNum = parseInt(idProduto);

    if (isNaN(idPedidoNum) || isNaN(idProdutoNum)) {
      return res.status(400).json({ error: 'IDs devem ser números válidos' });
    }

    const result = await query(
      `SELECT 
        pht.id_pedido,
        pht.id_tenis,
        p.nome_tenis,
        pht.quantidade,
        pht.preco_unitario
      FROM pedidohastenis pht
      JOIN produto p ON pht.id_tenis = p.id_tenis
      WHERE pht.id_pedido = $1 AND pht.id_tenis = $2`,
      [idPedidoNum, idProdutoNum]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item do pedido não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter item do pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

/**
 * Criar novo item de pedido (POST /pedido/produtos)
 * Aceita dois formatos:
 * 1. { id_pedido, produtos: [{id_tenis, quantidade, preco_unitario}...] } (novo/professor)
 * 2. { pedido_id_pedido, produto_id_produto, quantidade, preco_unitario } (antigo)
 */
exports.criarItemDoPedido = async (req, res) => {
  try {
    console.log('[POST /pedido/produtos] Recebido:', JSON.stringify(req.body));

    // Formato 1: { id_pedido, produtos: [...] }
    if (req.body.id_pedido && Array.isArray(req.body.produtos)) {
      const { id_pedido, produtos } = req.body;
      
      if (!Array.isArray(produtos) || produtos.length === 0) {
        return res.status(400).json({ error: 'Array de produtos deve ter pelo menos um item' });
      }

      const produto = produtos[0];
      const { id_tenis, quantidade, preco_unitario } = produto;

      if (!id_tenis || !quantidade || preco_unitario === undefined) {
        return res.status(400).json({
          error: 'Cada produto deve conter: id_tenis, quantidade, preco_unitario'
        });
      }

      const pedidoId = parseInt(id_pedido);
      const produtoId = parseInt(id_tenis);
      const qtd = parseInt(quantidade);
      const preco = parseFloat(preco_unitario);

      if (isNaN(pedidoId) || isNaN(produtoId) || isNaN(qtd) || isNaN(preco)) {
        return res.status(400).json({ error: 'Formato de dados inválido' });
      }

      const result = await query(
        `INSERT INTO pedidohastenis (id_tenis, id_pedido, quantidade, preco_unitario)
         VALUES ($1, $2, $3, $4)
         RETURNING id_pedido, id_tenis, quantidade, preco_unitario`,
        [produtoId, pedidoId, qtd, preco]
      );

      console.log('[POST /pedido/produtos] Item criado (formato novo):', result.rows[0]);
      return res.status(201).json(result.rows[0]);
    }

    // Formato 2: { pedido_id_pedido, produto_id_produto, quantidade, preco_unitario }
    const { pedido_id_pedido, produto_id_produto, quantidade, preco_unitario } = req.body;

    if (!pedido_id_pedido || !produto_id_produto || !quantidade || preco_unitario === undefined) {
      return res.status(400).json({
        error: 'Todos os campos são obrigatórios: pedido_id_pedido, produto_id_produto, quantidade, preco_unitario.'
      });
    }

    const pedidoId = parseInt(pedido_id_pedido);
    const produtoId = parseInt(produto_id_produto);
    const qtd = parseInt(quantidade);
    const preco = parseFloat(preco_unitario);

    if (isNaN(pedidoId) || isNaN(produtoId) || isNaN(qtd) || isNaN(preco)) {
      return res.status(400).json({ error: 'Formato de dados inválido. IDs e quantidade devem ser números inteiros, preço deve ser numérico.' });
    }

    const result = await query(
        `INSERT INTO pedidohastenis (id_tenis, id_pedido, quantidade, preco_unitario)
       VALUES ($1, $2, $3, $4)
       RETURNING id_pedido, id_tenis, quantidade, preco_unitario`,
      [produtoId, pedidoId, qtd, preco]
    );

    console.log('[POST /pedido/produtos] Item criado (formato antigo):', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar item do pedido:', error);

    // Erro de PK duplicada
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'O item do pedido já existe. Use a função de atualização para modificar.'
      });
    }

    // Erro de FK (pedido ou produto não existe)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'O ID do pedido ou do produto não existe.'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

/**
 * Atualizar item do pedido (PUT /pedido/produtos/:idPedido/:idProduto)
 */
exports.atualizarItemDoPedido = async (req, res) => {
  try {
    const { idPedido, idProduto } = req.params;
    const { quantidade, preco_unitario } = req.body;
    console.log(`[PUT /pedido/produtos/${idPedido}/${idProduto}] Atualizando item`, { quantidade, preco_unitario });

    const idPedidoNum = parseInt(idPedido);
    const idProdutoNum = parseInt(idProduto);

    if (isNaN(idPedidoNum) || isNaN(idProdutoNum)) {
      return res.status(400).json({ error: 'IDs devem ser números válidos' });
    }

    // Verifica se o item existe
    const existsResult = await query(
        'SELECT * FROM pedidohastenis WHERE id_pedido = $1 AND id_tenis = $2',
      [idPedidoNum, idProdutoNum]
    );

    if (existsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item do pedido não encontrado' });
    }

    // Constrói os campos a atualizar dinamicamente
    const updatedFields = {};
    if (quantidade !== undefined) updatedFields.quantidade = parseInt(quantidade);
    if (preco_unitario !== undefined) updatedFields.preco_unitario = parseFloat(preco_unitario);

    if (Object.keys(updatedFields).length === 0) {
      return res.status(400).json({ error: 'Nenhum campo válido para atualizar' });
    }

    // Atualiza o item
    const updateResult = await query(
        `UPDATE pedidohastenis 
       SET quantidade = $1, preco_unitario = $2
       WHERE id_pedido = $3 AND id_tenis = $4
       RETURNING id_pedido, id_tenis, quantidade, preco_unitario`,
      [updatedFields.quantidade, updatedFields.preco_unitario, idPedidoNum, idProdutoNum]
    );

    console.log('[PUT /pedido/produtos] Item atualizado:', updateResult.rows[0]);
    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar item do pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

/**
 * Deletar item do pedido (DELETE /pedido/produtos/:idPedido/:idProduto)
 */
exports.deletarItemDoPedido = async (req, res) => {
  try {
    const { idPedido, idProduto } = req.params;
    console.log(`[DELETE /pedido/produtos/${idPedido}/${idProduto}] Deletando item`);

    const idPedidoNum = parseInt(idPedido);
    const idProdutoNum = parseInt(idProduto);

    if (isNaN(idPedidoNum) || isNaN(idProdutoNum)) {
      return res.status(400).json({ error: 'IDs devem ser números válidos.' });
    }

    // Verifica se o item existe
    const existsResult = await query(
        'SELECT * FROM pedidohastenis WHERE id_pedido = $1 AND id_tenis = $2',
      [idPedidoNum, idProdutoNum]
    );

    if (existsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item do pedido não encontrado.' });
    }

    // Deleta o item
    const deleteResult = await query(
        'DELETE FROM pedidohastenis WHERE id_pedido = $1 AND id_tenis = $2',
      [idPedidoNum, idProdutoNum]
    );

    if (deleteResult.rowCount > 0) {
      console.log('[DELETE /pedido/produtos] Item deletado com sucesso');
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Item do pedido não encontrado para exclusão.' });
    }
  } catch (error) {
    console.error('Erro ao deletar item do pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};
