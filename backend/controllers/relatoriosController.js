const db = require('../database');
const path = require('path');
const fs = require('fs');

// Retorna estatísticas agregadas: total de pedidos, total arrecadado, quantidade de produtos vendidos e produto mais vendido
exports.getEstatisticas = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = [];
    const params = [];
    let idx = 1;
    if (startDate) {
      where.push(`p.data_do_pedido >= $${idx++}`);
      params.push(startDate);
    }
    if (endDate) {
      where.push(`p.data_do_pedido <= $${idx++}`);
      params.push(endDate);
    }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    // total de pedidos
    const totalPedidosRes = await db.query(`SELECT COUNT(*)::int AS total_pedidos FROM Pedido p ${whereClause}`, params);
    const totalPedidos = totalPedidosRes.rows[0].total_pedidos || 0;

    // total arrecadado (somando itens se valor_total não estiver preenchido)
    const totalArrecadadoRes = await db.query(
      `SELECT COALESCE(SUM(ph.quantidade * ph.preco_unitario),0)::numeric(12,2) AS total_arrecadado
       FROM pedidohastenis ph
       JOIN Pedido p ON ph.id_pedido = p.id_pedido
       ${whereClause}`,
      params
    );
    const totalArrecadado = parseFloat(totalArrecadadoRes.rows[0].total_arrecadado) || 0;

    // quantidade total de produtos vendidos
    const qtdProdutosRes = await db.query(
      `SELECT COALESCE(SUM(ph.quantidade),0)::int AS qtd_vendida
       FROM pedidohastenis ph
       JOIN Pedido p ON ph.id_pedido = p.id_pedido
       ${whereClause}`,
      params
    );
    const quantidadeProdutosVendidos = qtdProdutosRes.rows[0].qtd_vendida || 0;

    // produto mais vendido
    const topProdutoRes = await db.query(
      `SELECT ph.id_tenis, prod.nome_tenis, SUM(ph.quantidade)::int AS total_vendido
       FROM pedidohastenis ph
       JOIN Pedido p ON ph.id_pedido = p.id_pedido
       JOIN produto prod ON prod.id_tenis = ph.id_tenis
       ${whereClause}
       GROUP BY ph.id_tenis, prod.nome_tenis
       ORDER BY total_vendido DESC
       LIMIT 1`,
      params
    );

    const produtoMaisVendido = topProdutoRes.rows[0] || null;

    res.json({
      total_pedidos: totalPedidos,
      total_arrecadado: totalArrecadado,
      quantidade_produtos_vendidos: quantidadeProdutosVendidos,
      produto_mais_vendido: produtoMaisVendido
    });
  } catch (error) {
    console.error('Erro em getEstatisticas:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
};

// Retorna lista de vendas (pedidos) com cliente, funcionario, data, valor_total e itens do pedido
exports.getVendas = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = [];
    const params = [];
    let idx = 1;
    if (startDate) {
      where.push(`p.data_do_pedido >= $${idx++}`);
      params.push(startDate);
    }
    if (endDate) {
      where.push(`p.data_do_pedido <= $${idx++}`);
      params.push(endDate);
    }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const sql = `
      SELECT
        p.id_pedido,
        p.data_do_pedido,
        COALESCE(SUM(ph.quantidade * ph.preco_unitario),0)::numeric(12,2) AS valor_total,
        pesCli.nome_pessoa AS cliente,
        pesFunc.nome_pessoa AS funcionario,
        COALESCE(json_agg(json_build_object(
          'id_tenis', ph.id_tenis,
          'nome_tenis', prod.nome_tenis,
          'quantidade', ph.quantidade,
          'preco_unitario', ph.preco_unitario
        ) ORDER BY ph.id_tenis) FILTER (WHERE ph.id_tenis IS NOT NULL), '[]') AS itens
      FROM Pedido p
      LEFT JOIN Pessoa pesCli ON pesCli.id_pessoa = p.id_cliente
      LEFT JOIN Pessoa pesFunc ON pesFunc.id_pessoa = p.id_funcionario
      LEFT JOIN pedidohastenis ph ON ph.id_pedido = p.id_pedido
      LEFT JOIN produto prod ON prod.id_tenis = ph.id_tenis
      ${whereClause}
      GROUP BY p.id_pedido, pesCli.nome_pessoa, pesFunc.nome_pessoa, p.data_do_pedido
      ORDER BY p.data_do_pedido DESC
    `;

    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('Erro em getVendas:', error);
    res.status(500).json({ error: 'Erro ao obter vendas' });
  }
};

// Retorna receita agrupada por mês (YYYY-MM) dentro do intervalo opcional
exports.getReceitaPorMes = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = [];
    const params = [];
    let idx = 1;
    if (startDate) {
      where.push(`p.data_do_pedido >= $${idx++}`);
      params.push(startDate);
    }
    if (endDate) {
      where.push(`p.data_do_pedido <= $${idx++}`);
      params.push(endDate);
    }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const sql = `
      SELECT to_char(p.data_do_pedido, 'YYYY-MM') AS periodo,
             COALESCE(SUM(ph.quantidade * ph.preco_unitario),0)::numeric(12,2) AS receita
      FROM Pedido p
      LEFT JOIN pedidohastenis ph ON ph.id_pedido = p.id_pedido
      ${whereClause}
      GROUP BY to_char(p.data_do_pedido, 'YYYY-MM')
      ORDER BY periodo ASC
    `;

    const { rows } = await db.query(sql, params);
    // Normalizar retorno
    const result = rows.map(r => ({ periodo: r.periodo, receita: parseFloat(r.receita) }));
    res.json(result);
  } catch (error) {
    console.error('Erro em getReceitaPorMes:', error && error.stack ? error.stack : error);
    res.status(500).json({ error: 'Erro ao obter receita por mês' });
  }
};

// Servir páginas estáticas de relatório
exports.abrirRelatorioEstatisticas = (req, res) => {
  console.log('[ROTA] Servindo página /relatorios/estatisticas');
  const preferPath = path.join(__dirname, '../../frontend/relatorios/estatisticas/estatisticas.html');
  const fallbackPath = path.join(__dirname, '../../frontend/relatorios/estatisticas.html');
  if (fs.existsSync(preferPath)) return res.sendFile(preferPath);
  if (fs.existsSync(fallbackPath)) return res.sendFile(fallbackPath);
  console.warn('Arquivo de estatisticas não encontrado nas rotas esperadas:', preferPath, fallbackPath);
  res.status(404).send('Página de estatísticas não encontrada');
};

exports.abrirRelatorioVendas = (req, res) => {
  console.log('[ROTA] Servindo página /relatorios/vendas');
  const preferPath = path.join(__dirname, '../../frontend/relatorios/vendas/vendas.html');
  const fallbackPath = path.join(__dirname, '../../frontend/relatorios/vendas.html');
  if (fs.existsSync(preferPath)) return res.sendFile(preferPath);
  if (fs.existsSync(fallbackPath)) return res.sendFile(fallbackPath);
  console.warn('Arquivo de vendas não encontrado nas rotas esperadas:', preferPath, fallbackPath);
  res.status(404).send('Página de vendas não encontrada');
};
