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

// Inserir pedido (aceita id_funcionario do frontend ou null)
exports.inserirPedido = async (req, res) => {
  console.log('Corpo da requisição para inserir pedido:', req.body);
  try {
    let { data_do_pedido, id_cliente, id_funcionario } = req.body;

    // Se id_funcionario não for enviado, usar null (pode ser preenchido depois)
    if (id_funcionario === undefined || id_funcionario === null) {
      id_funcionario = null;
    }

    const result = await db.query(
      `INSERT INTO public.Pedido (data_do_pedido, id_cliente, id_funcionario)
       VALUES ($1, $2, $3) RETURNING id_pedido`,
      [data_do_pedido, id_cliente, id_funcionario]
    );

    console.log('✅ Pedido criado com sucesso:', result.rows[0].id_pedido);
    res.status(201).json({
      message: 'Pedido inserido com sucesso!',
      id_pedido: result.rows[0].id_pedido
    });
  } catch (error) {
    console.error('❌ Erro ao inserir pedido:', error);
    res.status(500).json({ error: 'Erro ao inserir pedido', details: error.message });
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

    // Se quiser retornar array vazio em vez de 404, descomente abaixo:
    // return res.status(200).json(rows);

    if (rows.length === 0) return res.status(404).json({ error: 'Nenhum produto encontrado para este pedido' });

    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar produtos do pedido:', error);
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
