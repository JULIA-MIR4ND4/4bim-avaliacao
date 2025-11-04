// backend/controllers/cargoController.js
const { query } = require('../database');
const path = require('path');

// Abre a página do CRUD (se necessário)
exports.abrirCrudCargo = (req, res) => {
  console.log('cargoController - Rota /abrirCrudCargo - abrir o crudCargo');
  res.sendFile(path.join(__dirname, '../../frontend/cargo/cargo.html'));
}

// Listar todos os cargos
exports.listarCargos = async (req, res) => {
  try {
    const result = await query('SELECT * FROM cargo ORDER BY id_cargo');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar cargos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Criar cargo
exports.criarCargo = async (req, res) => {
  try {
    const { id_cargo, nome_cargo } = req.body;

    // Validação básica
    if (!nome_cargo) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const result = await query(
      'INSERT INTO cargo (id_cargo, nome_cargo) VALUES ($1, $2) RETURNING *',
      [id_cargo || null, nome_cargo]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar cargo:', error);

    // Violação NOT NULL
    if (error.code === '23502') {
      return res.status(400).json({ error: 'Dados obrigatórios não fornecidos' });
    }

    // Violação de unique/constraint
    if (error.code === '23505') {
      return res.status(400).json({ error: 'ID ou dados já existem' });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Obter cargo por ID
exports.obterCargo = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query('SELECT * FROM cargo WHERE id_cargo = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cargo não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter cargo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Atualizar cargo
exports.atualizarCargo = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nome_cargo } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // Verifica se existe
    const existingPersonResult = await query('SELECT * FROM cargo WHERE id_cargo = $1', [id]);
    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cargo não encontrada' });
    }

    const currentPerson = existingPersonResult.rows[0];
    const updatedNome = (nome_cargo !== undefined) ? nome_cargo : currentPerson.nome_cargo;

    const updateResult = await query(
      'UPDATE cargo SET nome_cargo = $1 WHERE id_cargo = $2 RETURNING *',
      [updatedNome, id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar cargo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Deletar cargo (retorna 200 com JSON para facilitar parsing no frontend)
exports.deletarCargo = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // Verifica se existe
    const existingPersonResult = await query('SELECT * FROM cargo WHERE id_cargo = $1', [id]);
    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cargo não encontrada' });
    }

    // Deleta a cargo (constraints CASCADE lidam com dependências)
    await query('DELETE FROM cargo WHERE id_cargo = $1', [id]);

    // Retorna JSON com mensagem de sucesso (evita problemas com body vazio)
    res.status(200).json({ message: 'Cargo excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar cargo:', error);

    // Violação de foreign key (dependências)
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Não é possível deletar cargo com dependências associadas' });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
