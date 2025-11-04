const db = require('../database');
const path = require('path');


// Abrir a tela de CRUD de produtos
exports.abrirCrudProduto = (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/produto/produto.html'));
};

// Listar todos os produtos
exports.listarProdutos = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM produto ORDER BY id_tenis');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar produtos:', err);
    res.status(500).send('Erro ao listar produtos');
  }
};

// Buscar produto por ID
exports.buscarProdutoPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM produto WHERE id_tenis = $1', [id]);
    if (result.rows.length === 0) return res.status(404).send('Produto não encontrado');
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar produto:', err);
    res.status(500).send('Erro ao buscar produto');
  }
};

// Inserir produto
exports.inserirProduto = async (req, res) => {
  let { nome_tenis, tamanho_disponivel, quantidade_em_estoque, preco_unitario, caminho_imagem } = req.body;
  caminho_imagem = "/imagens/"+caminho_imagem;
  try {
    await db.query(
      `INSERT INTO produto (nome_tenis, tamanho_disponivel, quantidade_em_estoque, preco_unitario, imagem_url)
      VALUES ($1, $2, $3, $4, $5)`,
      [nome_tenis, tamanho_disponivel, quantidade_em_estoque, preco_unitario, caminho_imagem]
    );
    res.status(201).send('Produto inserido com sucesso');
  } catch (err) {
    console.error('Erro ao inserir produto:', err);
    res.status(500).send('Erro ao inserir produto');
  }
};

// Alterar produto
exports.alterarProduto = async (req, res) => {
  const { id } = req.params;
  let { nome_tenis, tamanho_disponivel, quantidade_em_estoque, preco_unitario, caminho_imagem } = req.body;
  caminho_imagem = "/imagens/"+caminho_imagem;

  try {
    await db.query(
      `UPDATE produto 
       SET nome_tenis = $1, tamanho_disponivel = $2, quantidade_em_estoque = $3, preco_unitario = $4, imagem_url = $5
       WHERE id_tenis = $6`,
      [nome_tenis, tamanho_disponivel, quantidade_em_estoque, preco_unitario, caminho_imagem, id]
    );
    res.send('Produto atualizado com sucesso');
  } catch (err) {
    console.error('Erro ao alterar produto:', err);
    res.status(500).send('Erro ao alterar produto');
  }
};

// Excluir produto
exports.excluirProduto = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM produto WHERE id_tenis = $1', [id]);
    res.send('Produto excluído com sucesso');
  } catch (err) {
    console.error('Erro ao excluir produto:', err);
    res.status(500).send('Erro ao excluir produto');
  }
};
