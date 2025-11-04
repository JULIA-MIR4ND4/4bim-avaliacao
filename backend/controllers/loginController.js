const db = require('../database.js');
const path = require('path');
exports.abrirLogin = (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/login/login.html'));
};
// Verifica se usuário está logado via cookie
exports.verificaSeUsuarioEstaLogado = async (req, res) => {
  console.log('loginController - Acessando rota /verificaSeUsuarioEstaLogado');
  const nome = req.cookies.usuarioLogado;

  console.log('Cookie usuarioLogado:', nome);

  const result = await db.query(
    `SELECT p.id_pessoa, p.id_pedido_atual, 
            CASE WHEN f.id_pessoa IS NOT NULL THEN true ELSE false END AS ehFuncionario
     FROM pessoa p
     LEFT JOIN funcionario f ON p.id_pessoa = f.id_pessoa
     WHERE p.nome_pessoa = $1`,
    [nome]
  );

  if (nome && result.rows.length > 0) {
    const { id_pessoa, id_pedido_atual, ehfuncionario } = result.rows[0];
    res.json({ status: 'ok', nome, id_pessoa, id_pedido_atual, ehFuncionario: ehfuncionario });
  } else {
    res.json({ status: 'nao_logado' });
  }
}

// Listar todas as pessoas
exports.listarPessoas = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM pessoa ORDER BY id_pessoa');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pessoas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Verifica se email existe
exports.verificarEmail = async (req, res) => {
  const { email } = req.body;

  const sql = 'SELECT nome_pessoa FROM pessoa WHERE email_pessoa = $1';
  console.log('rota verificarEmail:', sql, email);

  try {
    const result = await db.query(sql, [email]);
    if (result.rows.length > 0) {
      return res.json({ status: 'existe', nome: result.rows[0].nome_pessoa });
    }
    res.json({ status: 'nao_encontrado' });
  } catch (err) {
    console.error('Erro em verificarEmail:', err);
    res.status(500).json({ status: 'erro', mensagem: err.message });
  }
};

// Verifica senha e autentica usuário
exports.verificarSenha = async (req, res) => {
  const { email, senha } = req.body;

  const sqlPessoa = `
    SELECT id_pessoa, nome_pessoa 
    FROM pessoa 
    WHERE email_pessoa = $1 AND senha_pessoa = $2
  `;
  const sqlFuncionario = `
    SELECT f.id_pessoa, c.nome_cargo
    FROM funcionario f
    JOIN cargo c ON f.cargo_id_cargo = c.id_cargo
    WHERE f.id_pessoa = $1
  `;

  console.log('Rota verificarSenha:', sqlPessoa, email, senha);

  try {
    const resultPessoa = await db.query(sqlPessoa, [email, senha]);

    if (resultPessoa.rows.length === 0) {
      return res.json({ status: 'senha_incorreta' });
    }

    const { id_pessoa, nome_pessoa } = resultPessoa.rows[0];
    console.log('Usuário encontrado:', resultPessoa.rows[0]);

    // Verifica se é funcionário
    const resultFuncionario = await db.query(sqlFuncionario, [id_pessoa]);
    const funcionario = resultFuncionario.rows[0] || null;

    if (funcionario) {
      console.log('Usuário é funcionário, cargo:', funcionario.nome_cargo);
    } else {
      console.log('Usuário não é funcionário');
    }

    // Define cookie
    res.cookie('usuarioLogado', nome_pessoa, {
      sameSite: 'None',
      secure: true,
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    console.log("Cookie 'usuarioLogado' definido com sucesso");

    return res.json({
      status: 'ok',
      nome: nome_pessoa,
      funcionario,
    });

  } catch (err) {
    console.error('Erro ao verificar senha:', err);
    return res.status(500).json({ status: 'erro', mensagem: err.message });
  }
}

// Logout
exports.logout = (req, res) => {
  res.clearCookie('usuarioLogado', {
    sameSite: 'None',
    secure: true,
    httpOnly: true,
    path: '/',
  });
  console.log("Cookie 'usuarioLogado' removido com sucesso");
  res.json({ status: 'deslogado' });
}




// Atualizar senha
exports.atualizarSenha = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { senha_atual, nova_senha } = req.body;

    if (isNaN(id)) return res.status(400).json({ error: 'ID deve ser um número válido' });
    if (!senha_atual || !nova_senha) return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });

    const personResult = await db.query('SELECT * FROM pessoa WHERE id_pessoa = $1', [id]);
    if (personResult.rows.length === 0) return res.status(404).json({ error: 'Pessoa não encontrada' });

    const person = personResult.rows[0];
    if (person.senha_pessoa !== senha_atual) return res.status(400).json({ error: 'Senha atual incorreta' });

    const updateResult = await db.query(
      'UPDATE pessoa SET senha_pessoa = $1 WHERE id_pessoa = $2 RETURNING id_pessoa, nome_pessoa, email_pessoa, primeiro_acesso_pessoa, data_nascimento',
      [nova_senha, id]
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
