const { query } = require('../database');
const path = require('path');

// Abrir a tela de CRUD de pessoas
exports.abrirCrudPessoa = (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/pessoa/pessoa.html'));
};
exports.gerenciarConta = (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/gerenciarConta/gerenciarConta.html'));
};

// Listar todas as pessoas
exports.listarPessoas = async (req, res) => {
  try {
    const result = await query('SELECT * FROM pessoa ORDER BY id_pessoa');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pessoas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar pessoa
exports.criarPessoa = async (req, res) => {
  try {
    const { id_pessoa, nome_pessoa, email_pessoa, senha_pessoa, data_nascimento_pessoa, endereco } = req.body;

    if (!nome_pessoa || !email_pessoa || !senha_pessoa) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email_pessoa)) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }

    const result = await query(
      'INSERT INTO pessoa (id_pessoa, nome_pessoa, email_pessoa, senha_pessoa, data_nascimento_pessoa, endereco) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id_pessoa, nome_pessoa, email_pessoa, senha_pessoa, data_nascimento_pessoa, endereco]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar pessoa:', error);
    if (error.code === '23505' && error.constraint.includes('email')) {
      return res.status(400).json({ error: 'Email já está em uso' });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter pessoa por ID
exports.obterPessoa = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID deve ser um número válido' });

    const result = await query('SELECT * FROM pessoa WHERE id_pessoa = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Pessoa não encontrada' });

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pessoa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
exports.obterPessoaPorNome = async (req, res) => {
  try {
    const nome = req.params.nome;
    console.log(nome)

    const result = await query('SELECT * FROM pessoa WHERE nome_pessoa = $1', [nome]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Pessoa não encontrada' });

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pessoa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar pessoa
exports.atualizarPessoa = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nome_pessoa, email_pessoa, senha_pessoa, data_nascimento_pessoa, endereco } = req.body;

    if (email_pessoa) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email_pessoa)) return res.status(400).json({ error: 'Formato de email inválido' });
    }

    const existingPersonResult = await query('SELECT * FROM pessoa WHERE id_pessoa = $1', [id]);
    if (existingPersonResult.rows.length === 0) return res.status(404).json({ error: 'Pessoa não encontrada' });

    const current = existingPersonResult.rows[0];
    const updated = {
      nome_pessoa: nome_pessoa ?? current.nome_pessoa,
      email_pessoa: email_pessoa ?? current.email_pessoa,
      senha_pessoa: senha_pessoa ?? current.senha_pessoa,
      data_nascimento_pessoa: data_nascimento_pessoa ?? current.data_nascimento_pessoa,
      endereco: endereco ?? current.endereco
    };

    const updateResult = await query(
      'UPDATE pessoa SET nome_pessoa=$1, email_pessoa=$2, senha_pessoa=$3, data_nascimento_pessoa=$4, endereco=$5 WHERE id_pessoa=$6 RETURNING *',
      [updated.nome_pessoa, updated.email_pessoa, updated.senha_pessoa, updated.data_nascimento_pessoa, updated.endereco, id]
    );

    if(req.body.conta){
      res.cookie('usuarioLogado', nome_pessoa, {
        sameSite: 'None',
        secure: true,
        httpOnly: true,
        path: '/',
        maxAge: 24 * 60 * 60 * 1000,
      });

    }

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar pessoa:', error);
    if (error.code === '23505' && error.constraint.includes('email')) {
      return res.status(400).json({ error: 'Email já está em uso por outra pessoa' });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar pessoa
exports.deletarPessoa = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existingPersonResult = await query('SELECT * FROM pessoa WHERE id_pessoa=$1', [id]);
    if (existingPersonResult.rows.length === 0) return res.status(404).json({ error: 'Pessoa não encontrada' });

    await query('DELETE FROM pessoa WHERE id_pessoa=$1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar pessoa:', error);
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Não é possível deletar pessoa com dependências associadas' });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter pessoa por email
exports.obterPessoaPorEmail = async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) return res.status(400).json({ error: 'Email é obrigatório' });

    const result = await query('SELECT * FROM pessoa WHERE email_pessoa=$1', [email]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Pessoa não encontrada' });

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pessoa por email:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar apenas senha
exports.atualizarSenha = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { senha_atual, nova_senha } = req.body;

    if (isNaN(id)) return res.status(400).json({ error: 'ID deve ser um número válido' });
    if (!senha_atual || !nova_senha) return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });

    const personResult = await query('SELECT * FROM pessoa WHERE id_pessoa=$1', [id]);
    if (personResult.rows.length === 0) return res.status(404).json({ error: 'Pessoa não encontrada' });

    const person = personResult.rows[0];
    if (person.senha_pessoa !== senha_atual) return res.status(400).json({ error: 'Senha atual incorreta' });

    const updateResult = await query(
      'UPDATE pessoa SET senha_pessoa=$1 WHERE id_pessoa=$2 RETURNING id_pessoa, nome_pessoa, email_pessoa, data_nascimento_pessoa, endereco',
      [nova_senha, id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.atualizarPedidoAtualPorNome = async (req, res) => {
  try {
    const { id_pessoa, id_pedido } = req.body;
    console.log(req.body)
   if(id_pedido ==null){
     await query(
       'UPDATE pessoa SET id_pedido_atual = null WHERE id_pessoa = $1',
       [id_pessoa]
     );

   }else{
     await query(
       'UPDATE pessoa SET id_pedido_atual = $1 WHERE id_pessoa = $2',
       [id_pedido, id_pessoa]
     );

   }


    res.status(200).json({ message: 'id_pedido_atual atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar id_pedido_atual:', error);
    res.status(500).json({ error: 'Erro ao atualizar id_pedido_atual' });
  }
};
