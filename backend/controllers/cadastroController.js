const { query, transaction } = require('../database');

// Rota POST /cadastro
exports.cadastrarCliente = async (req, res) => {
  try {
    const { nome_pessoa, email_pessoa, senha_pessoa, renda_cliente } = req.body;

    // Validações básicas
    if (!nome_pessoa || !email_pessoa || !senha_pessoa || !renda_cliente) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email_pessoa)) return res.status(400).json({ error: 'E-mail inválido.' });
    if (senha_pessoa.length < 6) return res.status(400).json({ error: 'Senha muito curta.' });
    const rendaNum = parseFloat(renda_cliente);
    if (isNaN(rendaNum) || rendaNum <= 0) return res.status(400).json({ error: 'Renda inválida.' });

    // Transação: inserir em pessoa e cliente
    const result = await transaction(async (client) => {
      // Verificar se email já existe
      const existe = await client.query('SELECT id_pessoa FROM pessoa WHERE email_pessoa = $1', [email_pessoa]);
      if (existe.rows.length > 0) {
        return { existe: true };
      }

      // Inserir pessoa (omitindo id_pessoa para usar sequence). data_nascimento_pessoa e endereco são NOT NULL no esquema,
      // então preenchemos com valores padrão (data atual / string vazia).
      const insPessoa = await client.query(
        `INSERT INTO pessoa (nome_pessoa, email_pessoa, senha_pessoa, data_nascimento_pessoa, endereco)
         VALUES ($1, $2, $3, CURRENT_DATE, '') RETURNING id_pessoa, nome_pessoa, email_pessoa`,
        [nome_pessoa, email_pessoa, senha_pessoa]
      );

      const pessoaCriada = insPessoa.rows[0];

      // Inserir cliente
      await client.query(
        'INSERT INTO cliente (id_pessoa, renda_cliente, data_de_cadastro_cliente) VALUES ($1, $2, CURRENT_DATE)',
        [pessoaCriada.id_pessoa, rendaNum]
      );

      return { existe: false, pessoa: pessoaCriada };
    });

    if (result.existe) {
      return res.status(409).json({ error: 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.' });
    }

    const pessoa = result.pessoa;
    console.log(`✅ Novo cliente cadastrado com sucesso! Nome: ${pessoa.nome_pessoa} - E-mail: ${pessoa.email_pessoa}`);

    return res.status(201).json({ mensagem: 'Cadastro realizado com sucesso!' });
  } catch (err) {
    console.error('Erro em /cadastro:', err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};
