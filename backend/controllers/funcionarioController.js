const { query } = require('../database');

exports.listarFuncionarios = async (req, res) => {
  try {
    const result = await query('SELECT funcionario.id_pessoa, nome_pessoa FROM funcionario, pessoa WHERE funcionario.id_pessoa = pessoa.id_pessoa');
    console.log(result);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao obter funcionário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
// Obter funcionário pelo id_pessoa
exports.obterFuncionario = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await query('SELECT * FROM funcionario WHERE id_pessoa = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter funcionário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar funcionário
exports.criarFuncionario = async (req, res) => {
  try {
    const { id_pessoa, salario, cargo_id_cargo, porcentagem_comissao } = req.body;
    const result = await query(
      'INSERT INTO funcionario (id_pessoa, salario, cargo_id_cargo, porcentagem_comissao) VALUES ($1, $2, $3, $4) RETURNING *',
      [id_pessoa, salario, cargo_id_cargo, porcentagem_comissao]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar funcionário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar funcionário
exports.atualizarFuncionario = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { salario, cargo_id_cargo, porcentagem_comissao } = req.body;
    const result = await query(
      'UPDATE funcionario SET salario = $1, cargo_id_cargo = $2, porcentagem_comissao = $3 WHERE id_pessoa = $4 RETURNING *',
      [salario, cargo_id_cargo, porcentagem_comissao, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar funcionário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar funcionário
exports.deletarFuncionario = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await query('DELETE FROM funcionario WHERE id_pessoa = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar funcionário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
