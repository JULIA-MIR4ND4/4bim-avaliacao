// pedido_has_produtoController.js - Adaptado para o projeto do usuário
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
 * Corrigido: permite quantidade = 0 e remove item automaticamente
 */
exports.criarItemDoPedido = async (req, res) => {
  try {
    console.log('[POST /pedido/produtos] Recebido:', JSON.stringify(req.body));

    if (req.body.id_pedido && Array.isArray(req.body.produtos)) {
      const { id_pedido, produtos } = req.body;

      const produto = produtos[0];
      const { id_tenis, quantidade, preco_unitario } = produto;

      // ❗ CORREÇÃO PRINCIPAL: antes usava !quantidade → quantidade 0 virava erro
      if (id_tenis === undefined || quantidade === undefined || preco_unitario === undefined) {
        return res.status(400).json({
          error: 'Cada produto deve conter: id_tenis, quantidade, preco_unitario'
        });
      }

      const pedidoId = parseInt(id_pedido);
      const produtoId = parseInt(id_tenis);
      const qtd = parseInt(quantidade);
      const preco = parseFloat(preco_unitario);

      // 🔥 Se a quantidade for ZERO → remover item automaticamente
      if (qtd === 0) {
        await query(
          'DELETE FROM pedidohastenis WHERE id_pedido = $1 AND id_tenis = $2',
          [pedidoId, produtoId]
        );
        console.log('[POST] quantidade 0 → item removido');
        return res.status(200).json({ message: 'Item removido (quantidade zero)' });
      }

      const result = await query(
        `INSERT INTO pedidohastenis (id_tenis, id_pedido, quantidade, preco_unitario)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id_tenis, id_pedido)
         DO UPDATE SET quantidade = EXCLUDED.quantidade,
                       preco_unitario = EXCLUDED.preco_unitario
         RETURNING id_pedido, id_tenis, quantidade, preco_unitario`,
        [produtoId, pedidoId, qtd, preco]
      );

      console.log('[POST /pedido/produtos] Item criado/atualizado:', result.rows[0]);
      return res.status(201).json(result.rows[0]);
    }

    return res.status(400).json({ error: 'Formato inválido' });

  } catch (error) {
    console.error('Erro ao criar item do pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

/**
 * Atualizar item do pedido (PUT)
 */
exports.atualizarItemDoPedido = async (req, res) => {
  try {
    const { idPedido, idProduto } = req.params;
    const { quantidade, preco_unitario } = req.body;

    const idPedidoNum = parseInt(idPedido);
    const idProdutoNum = parseInt(idProduto);

    const existsResult = await query(
      'SELECT * FROM pedidohastenis WHERE id_pedido = $1 AND id_tenis = $2',
      [idPedidoNum, idProdutoNum]
    );

    if (existsResult.rows.length === 0) {
      return res.status(404).json({ error: 'Item do pedido não encontrado' });
    }

    const updateResult = await query(
      `UPDATE pedidohastenis 
       SET quantidade = $1, preco_unitario = $2
       WHERE id_pedido = $3 AND id_tenis = $4
       RETURNING id_pedido, id_tenis, quantidade, preco_unitario`,
      [quantidade, preco_unitario, idPedidoNum, idProdutoNum]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar item do pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

/**
 * Deletar item
 */
exports.deletarItemDoPedido = async (req, res) => {
  try {
    const { idPedido, idProduto } = req.params;

    const idPedidoNum = parseInt(idPedido);
    const idProdutoNum = parseInt(idProduto);

    const deleteResult = await query(
      'DELETE FROM pedidohastenis WHERE id_pedido = $1 AND id_tenis = $2',
      [idPedidoNum, idProdutoNum]
    );

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar item do pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
