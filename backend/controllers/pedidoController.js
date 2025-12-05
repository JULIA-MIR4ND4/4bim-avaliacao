// backend/controllers/pedidoController.js
const db = require('../database');
const path = require('path');

// Abrir tela CRUD
exports.abrirCrudPedido = (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/pedido/pedido.html'));
};
exports.abrirCarrinho = (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/carrinho/carrinho.html'));
};
exports.abrirFinalizar = (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/finalizar/finalizar.html'));
};

// Listar todos os pedidos
exports.listarPedidos = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        p.id_pedido,
        p.data_do_pedido,
        p.id_cliente,
        pesCli.nome_pessoa AS nome_cliente,
        p.id_funcionario,
        pesFunc.nome_pessoa AS nome_funcionario
      FROM Pedido p
      LEFT JOIN Cliente cli ON cli.id_pessoa = p.id_cliente
      LEFT JOIN Pessoa pesCli ON pesCli.id_pessoa = p.id_cliente
      LEFT JOIN Funcionario func ON func.id_pessoa = p.id_funcionario
      LEFT JOIN Pessoa pesFunc ON pesFunc.id_pessoa = p.id_funcionario
      ORDER BY p.id_pedido DESC
    `);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({ error: 'Erro ao listar pedidos' });
  }
};

// Buscar pedido por ID
exports.buscarPedidoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(`
      SELECT 
        p.id_pedido,
        p.data_do_pedido,
        p.id_cliente,
        pesCli.nome_pessoa AS nome_cliente,
        p.id_funcionario,
        pesFunc.nome_pessoa AS nome_funcionario
      FROM Pedido p
      LEFT JOIN Pessoa pesCli ON pesCli.id_pessoa = p.id_cliente
      LEFT JOIN Pessoa pesFunc ON pesFunc.id_pessoa = p.id_funcionario
      WHERE p.id_pedido = $1
    `, [id]);

    if (rows.length === 0) return res.status(404).json({ error: 'Pedido não encontrado' });
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(500).json({ error: 'Erro ao buscar pedido' });
  }
};

// Ajustar a função inserirPedido para forçar funcionário = 100 (vendedor online)
exports.inserirPedido = async (req, res) => {
  console.log('📝 [POST /pedido] Corpo da requisição:', req.body);
  try {
    let { data_do_pedido, id_cliente } = req.body;

    // FORÇAR SEMPRE o id_funcionario = 100
    const id_funcionario = 100;

    // Evitar criar pedidos duplicados: se a pessoa já tem id_pedido_atual válido, retorne ele
    const pessoaRes = await db.query('SELECT id_pedido_atual FROM pessoa WHERE id_pessoa = $1', [id_cliente]);
    if (pessoaRes.rows.length > 0) {
      const idPedidoAtual = pessoaRes.rows[0].id_pedido_atual;
      if (idPedidoAtual) {
        // Verifica se o pedido realmente existe
        const check = await db.query('SELECT 1 FROM Pedido WHERE id_pedido = $1', [idPedidoAtual]);
        if (check.rowCount > 0) {
          console.log('♻️ [POST /pedido] Reutilizando pedido existente:', idPedidoAtual, 'para pessoa:', id_cliente);
          return res.status(200).json({ message: 'Pedido já existe', id_pedido: idPedidoAtual });
        }
      }
    }

    // Se chegou aqui, cria novo pedido e atualiza pessoa.id_pedido_atual em transação
    await db.transaction(async (client) => {
      console.log('🔄 [POST /pedido] Iniciando transação para criar novo pedido');
      
      const insertRes = await client.query(
        `INSERT INTO Pedido (data_do_pedido, id_cliente, id_funcionario)
         VALUES ($1, $2, $3) RETURNING id_pedido`,
        [data_do_pedido, id_cliente, id_funcionario]
      );
      const novoId = insertRes.rows[0].id_pedido;
      console.log('✅ [POST /pedido] Pedido criado com ID:', novoId);

      await client.query('UPDATE pessoa SET id_pedido_atual = $1 WHERE id_pessoa = $2', [novoId, id_cliente]);
      console.log('✅ [POST /pedido] pessoa.id_pedido_atual atualizado para:', novoId);

      res.status(201).json({ message: 'Pedido inserido com sucesso!', id_pedido: novoId });
    });
  } catch (error) {
    console.error('❌ [POST /pedido] Erro ao inserir pedido:', error);
    res.status(500).json({ error: 'Erro ao inserir pedido' });
  }
};

// Atualizar pedido
exports.atualizarPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const { data_do_pedido, id_cliente, id_funcionario } = req.body;

    // Cria um array para armazenar os campos a serem atualizados e seus valores
    const updates = [];
    const values = [];

    if (data_do_pedido !== null && data_do_pedido !== undefined) {
      updates.push('data_do_pedido = $' + (updates.length + 1));
      values.push(data_do_pedido);
    }

    if (id_cliente !== null && id_cliente !== undefined) {
      updates.push('id_cliente = $' + (updates.length + 1));
      values.push(id_cliente);
    }

    if (id_funcionario !== null && id_funcionario !== undefined) {
      updates.push('id_funcionario = $' + (updates.length + 1));
      values.push(id_funcionario);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    // Adiciona o ID do pedido como último parâmetro
    values.push(id);

    const query = `
      UPDATE Pedido
      SET ${updates.join(', ')}
      WHERE id_pedido = $${values.length}
    `;

    await db.query(query, values);

    res.status(200).json({ message: 'Pedido atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    res.status(500).json({ error: 'Erro ao atualizar pedido' });
  }
};

// Excluir pedido
exports.excluirPedido = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM Pedido WHERE id_pedido = $1', [id]);
    res.status(200).json({ message: 'Pedido excluído com sucesso!' });
  } catch (error) {
    console.error('Erro ao excluir pedido:', error);
    res.status(500).json({ error: 'Erro ao excluir pedido' });
  }
};

// Função para buscar todos os produtos de um pedido
exports.buscarProdutosDoPedido = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 [GET /pedido/produtos/${id}] Buscando itens do pedido`);
    const { rows } = await db.query(`
      SELECT 
          pp.id_tenis,
          pp.quantidade,
          p.nome_tenis,
          p.preco_unitario
      FROM pedidohastenis pp
      JOIN produto p ON pp.id_tenis = p.id_tenis
      WHERE pp.id_pedido = $1
      ORDER BY pp.id_tenis;
    `, [id]);

    console.log(`✅ [GET /pedido/produtos/${id}] Encontrados ${rows.length} itens:`, rows);
    // Retorna sempre 200 com array vazio se nenhum item encontrado
    res.status(200).json(rows);
  } catch (error) {
    console.error('❌ [GET /pedido/produtos] Erro ao buscar produtos do pedido:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos do pedido' });
  }
};

// Função para inserir ou atualizar produtos em um pedido
exports.inserirOuAtualizarProdutosNoPedido = async (req, res) => {
  try {
    const { id_pedido, produtos } = req.body;
    
    if (!id_pedido || !Array.isArray(produtos) || produtos.length === 0) {
      return res.status(400).json({ error: 'ID do pedido e lista de produtos são obrigatórios' });
    }

    // Usa a função transaction exportada do database.js para garantir BEGIN/COMMIT/ROLLBACK
    await db.transaction(async (client) => {
      // Remove os produtos existentes do pedido (se for uma atualização)
      await client.query('DELETE FROM pedidohastenis WHERE id_pedido = $1', [id_pedido]);
      
      // Insere os novos produtos
      for (const produto of produtos) {
        const { id_tenis, quantidade, preco_unitario } = produto;
        
        if (id_tenis === undefined || quantidade === undefined || preco_unitario === undefined) {
          // Lança erro para acionar o ROLLBACK na transaction
          throw new Error('Cada produto deve conter id_tenis, quantidade e preco_unitario');
        }
        
        // Verificações adicionais de tipo
        const idTenisNum = parseInt(id_tenis);
        const qtdNum = parseInt(quantidade);
        const precoNum = parseFloat(preco_unitario);
        if (isNaN(idTenisNum) || isNaN(qtdNum) || isNaN(precoNum)) {
          throw new Error('Dados de produto inválidos (id_tenis, quantidade ou preco_unitario inválidos)');
        }
        
        await client.query(
          'INSERT INTO pedidohastenis (id_tenis, id_pedido, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)',
          [idTenisNum, id_pedido, qtdNum, precoNum]
        );
      }
    });

    res.status(200).json({ message: 'Produtos inseridos ou atualizados com sucesso no pedido!' });
  } catch (error) {
    console.error('Erro ao inserir ou atualizar produtos no pedido:', error);
    // db.transaction já faz rollback; aqui apenas retornamos erro ao cliente
    const msg = error.message || 'Erro ao inserir ou atualizar produtos no pedido';
    res.status(500).json({ error: msg });
  }
};

// Rota de debug para inspecionar Pedido + itens diretamente no DB
exports.debugPedido = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'ID do pedido é obrigatório' });

    console.log(`[DEBUG /pedido/debug/${id}] Consultando pedido e itens`);
    
    const pedidoRes = await db.query('SELECT * FROM Pedido WHERE id_pedido = $1', [id]);
    const itensRes = await db.query('SELECT * FROM pedidohastenis WHERE id_pedido = $1 ORDER BY id_tenis', [id]);
    
    console.log(`[DEBUG /pedido/debug/${id}] Pedido:`, pedidoRes.rows[0] || 'NÃO ENCONTRADO');
    console.log(`[DEBUG /pedido/debug/${id}] Itens (${itensRes.rowCount}):`, itensRes.rows);

    return res.status(200).json({ 
      pedido: pedidoRes.rows[0] || null, 
      itens: itensRes.rows || [] 
    });
  } catch (error) {
    console.error('Erro debugPedido:', error);
    res.status(500).json({ error: 'Erro no debug do pedido' });
  }
};
