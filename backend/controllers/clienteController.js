const { query } = require('../database');

// Obter cliente pelo id_pessoa
exports.obterCliente = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await query('SELECT * FROM cliente WHERE id_pessoa = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar cliente
exports.criarCliente = async (req, res) => {
  try {
    const { id_pessoa, renda_cliente, data_de_cadastro_cliente } = req.body;
    const result = await query(
      'INSERT INTO cliente (id_pessoa, renda_cliente, data_de_cadastro_cliente) VALUES ($1, $2, $3) RETURNING *',
      [id_pessoa, renda_cliente, data_de_cadastro_cliente]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar cliente
exports.atualizarCliente = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { renda_cliente, data_de_cadastro_cliente } = req.body;
    const result = await query(
      'UPDATE cliente SET renda_cliente = $1, data_de_cadastro_cliente = $2 WHERE id_pessoa = $3 RETURNING *',
      [renda_cliente, data_de_cadastro_cliente, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar cliente
exports.deletarCliente = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await query('DELETE FROM cliente WHERE id_pessoa = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};


