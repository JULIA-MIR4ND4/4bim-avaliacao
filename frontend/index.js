const API_BASE_URL = 'http://localhost:3001';
let ehProfessor = false;
let temquantidade = false;
let pedidoId = null; // ID de pedido validado/garantido

// Helper: verifica se pedido existe (GET /pedido/:id). Retorna true/false.
async function verificaPedidoExiste(idPedido) {
  try {
    const res = await fetch(`${API_BASE_URL}/pedido/${idPedido}`);
    return res.ok;
  } catch (err) {
    console.error('Erro ao verificar pedido:', err);
    return false;
  }
}

// Helper: cria novo pedido (POST /pedido) e atualiza pessoa.id_pedido_atual (PATCH /pessoa/atualizarPedidoAtual)
async function criarPedidoEAtualizarPessoa(idPessoa) {
  try {
    const novoPedidoRes = await fetch(`${API_BASE_URL}/pedido`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data_do_pedido: new Date().toISOString().split('T')[0],
        id_cliente: idPessoa,
        id_funcionario: null
      })
    });

    if (!novoPedidoRes.ok) {
      console.error('Falha ao criar pedido (status):', novoPedidoRes.status);
      return null;
    }

    const novoPedido = await novoPedidoRes.json();
    const novoId = novoPedido.id_pedido;

    // Atualiza o id_pedido_atual da pessoa
    const atualizarRes = await fetch(`${API_BASE_URL}/pessoa/atualizarPedidoAtual`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_pessoa: idPessoa,
        id_pedido: novoId
      })
    });

    if (!atualizarRes.ok) {
      console.warn('Pedido criado, mas falha ao atualizar pessoa.id_pedido_atual');
      // ainda assim retornamos o id do pedido criado
    }

    return novoId;
  } catch (err) {
    console.error('Erro ao criar pedido e atualizar pessoa:', err);
    return null;
  }
}

// Função que garante que o usuário tem um pedido válido: retorna id_pedido existente ou criado.
async function garantirPedidoValido(idPessoa, idPedidoAtual) {
  // Se não tem id_pedido_atual, cria um novo e atualiza pessoa
  if (!idPedidoAtual) {
    const novoId = await criarPedidoEAtualizarPessoa(idPessoa);
    pedidoId = novoId;
    return novoId;
  }

  // Se tem id_pedido_atual, verificar se o pedido existe no banco
  const existe = await verificaPedidoExiste(idPedidoAtual);
  if (existe) {
    pedidoId = idPedidoAtual;
    return idPedidoAtual;
  }

  // Se não existe (pedido apagado ou finalizado), crie um novo e atualize pessoa
  console.warn(`id_pedido_atual ${idPedidoAtual} não existe no banco — criando novo pedido.`);
  const novoId = await criarPedidoEAtualizarPessoa(idPessoa);
  pedidoId = novoId;
  return novoId;
}

// Adicionar lógica para criar um pedido e atualizar o id_pedido_atual
async function nomeUsuario() {
  const combobox = document.getElementById("oUsuario");
  const primeiraOpcao = combobox && combobox.options && combobox.options[0];

  try {
    const res = await fetch(`${API_BASE_URL}/login/verificaSeUsuarioEstaLogado`, {
      method: 'POST',
      credentials: 'include' // MUITO IMPORTANTE: envia cookies
    });

    const data = await res.json();

    if (data.status === 'ok') {
      if (primeiraOpcao) primeiraOpcao.text = data.nome; // usuário logado

      // Garantir que exista um pedido válido para o usuário
      const idPedidoValido = await garantirPedidoValido(data.id_pessoa, data.id_pedido_atual);
      if (idPedidoValido) {
        console.log('Pedido válido garantido:', idPedidoValido);
      } else {
        console.error('Não foi possível garantir um pedido válido para o usuário.');
      }

    } else if (primeiraOpcao) {
      primeiraOpcao.text = "Fazer Login"; // fallback
    }

  } catch (err) {
    console.error(err);
    if (primeiraOpcao) primeiraOpcao.text = "Fazer Login";
  }
}

// Chame a função quando a página carregar (não sobrescreve outros handlers)
document.addEventListener('DOMContentLoaded', nomeUsuario);

async function usuarioAutorizado() {
  const rota = API_BASE_URL + '/login/verificaSeUsuarioEstaLogado';
  const res = await fetch(rota, { credentials: 'include' });
  const data = await res.json();
  if (data.status === 'ok') {
    document.getElementById('boasVindas').innerText =
      `${data.nome} - ${data.mnemonicoProfessor ? `Professor: ${data.mnemonicoProfessor}` : ''}`;
    if (data.mnemonicoProfessor) ehProfessor = true;
  } else {
    alert("Você precisa fazer login.");
    window.location.href = "./login/login";
  }
}

async function logout2() {
  await fetch('http://localhost:3005/logout', {
    method: 'POST',
    credentials: 'include'
  });
  window.location.href = "http://localhost:3001/produto/abrirCrudProduto";
}

// usuarioAutorizado();
const mostruarioProdutos = document.getElementById('mostruarioProdutos');

// Carrega produtos ao iniciar a página
document.addEventListener('DOMContentLoaded', () => {
    carregarProdutosMostruario();
});

async function carregarProdutosMostruario() {
    const response = await fetch(`${API_BASE_URL}/produto/`);
    const produtos = await response.json();

    const res = await fetch(`${API_BASE_URL}/login/verificaSeUsuarioEstaLogado`, {
      method: 'POST',
      credentials: 'include' // envia cookies
    });
    const data = await res.json();

    // Prepare defaults
    let prodPedido = [];
    let prodPedido2 = {};
    let idsProdutos = [];

    if (data && data.status === 'ok') {
      // Garante/atualiza pedidoId (verifica existência no DB e cria se necessário)
      const idPedidoValido = await garantirPedidoValido(data.id_pessoa, data.id_pedido_atual);
      pedidoId = idPedidoValido;
      temquantidade = true;

      let itemsJson = [];
      if (pedidoId) {
        const itemsRes = await fetch(`${API_BASE_URL}/pedido/produtos/${pedidoId}`);
        if (itemsRes.ok) {
          itemsJson = await itemsRes.json();
        } else {
          itemsJson = []; // nada no pedido
        }
      }

      prodPedido = Array.isArray(itemsJson) ? itemsJson : [];

      console.log('prodPedido:', prodPedido);

      prodPedido2 = {};
      idsProdutos = prodPedido.map(item => {
        prodPedido2[item.id_tenis] = item.quantidade;
        return item.id_tenis;
      });
    }

    renderizarProdutos(produtos, prodPedido2, idsProdutos);
}

// objeto que guarda as quantidades selecionadas na página de produtos
const pedido = {};

// Preenche o pedido com quantidades iniciais (quando volta ao menu)
function setQuantidadeInicial(produtoId, quantidade, preco_unitario) {
  const q = parseInt(quantidade) || 0;
  if (q > 0) {
    pedido[produtoId] = { quantidade: q, preco_unitario };
  } else {
    // se zero, garantir inexistência no pedido local (não envia)
    if (pedido[produtoId]) delete pedido[produtoId];
  }
}

function handleQuantidadeChange(event, produtoId, preco_unitario) {
  const novaQuantidade = parseInt(event.target.value) || 0;
  if (novaQuantidade > 0) {
    pedido[produtoId] = {quantidade: novaQuantidade, preco_unitario: preco_unitario};
  } else {
    // se zerou, remove do objeto local
    if (pedido[produtoId]) delete pedido[produtoId];
  }
  console.log('pedido (local):', pedido);
}

async function handleContinuar() {
  try {
    // Garante que existe um pedido válido antes de enviar produtos
    if (!pedidoId) {
      // refetch do usuário e garantia do pedido
      const res = await fetch(`${API_BASE_URL}/login/verificaSeUsuarioEstaLogado`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.status === 'ok') {
        pedidoId = await garantirPedidoValido(data.id_pessoa, data.id_pedido_atual);
      }
    }

    if (!pedidoId) {
      throw new Error('Não foi possível criar/obter pedido antes de continuar.');
    }

    const produtos = Object.entries(pedido).map(([id_tenis, detalhes]) => ({
      id_tenis: parseInt(id_tenis),
      quantidade: detalhes.quantidade || 0,
      preco_unitario: detalhes.preco_unitario
    })).filter(p => p.quantidade > 0); // só enviar produtos com quantidade > 0

    if (produtos.length === 0) {
      alert('Nenhum produto selecionado.');
      return;
    }

    const response = await fetch(`${API_BASE_URL}/pedido/produtos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_pedido: pedidoId, produtos }),
      credentials: 'include'
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error('Erro ao salvar os produtos no pedido: ' + text);
    }

    console.log('Produtos salvos com sucesso no pedido!');
    // redireciona para a rota do carrinho
    window.location.href = "http://localhost:3001/carrinho";
  } catch (error) {
    console.error('Erro no handleContinuar:', error);
    alert('Erro ao salvar o carrinho. Tente novamente.');
    // redireciona mesmo assim para carrinho (opcional)
    window.location.href = "http://localhost:3001/carrinho";
  }
}


function renderizarProdutos(produtos, prodPedido2, idsProdutos) {
  mostruarioProdutos.innerHTML = ''; // limpa o container
  produtos.forEach(produto => {
    const card = document.createElement('div');
    card.className = 'produto-card';

    const imagem = produto.imagem_url
      ? `<img src="${produto.imagem_url}" alt="${produto.nome_tenis}">`
      : `<img src="https://via.placeholder.com/220x150?text=Sem+imagem" alt="Sem imagem">`;

    const quantidade = temquantidade && idsProdutos.includes(produto.id_tenis)
      ? prodPedido2[produto.id_tenis]
      : 0; // Define a quantidade com base em `prodPedido2` ou 0

    card.innerHTML = `
      ${imagem}
      <h4>${produto.nome_tenis}</h4>
      <p>Tamanho: ${produto.tamanho_disponivel || '-'}</p>
      <p>Quantidade em estoque: ${produto.quantidade_em_estoque}</p>
      <p class="preco">R$ ${produto.preco_unitario.toFixed(2)}</p>
    `;

    const inputQuantidade = document.createElement('input');
    inputQuantidade.className = 'quantidade';
    inputQuantidade.type = 'number';
    inputQuantidade.placeholder = 'quantidade';
    inputQuantidade.min = 0;
    inputQuantidade.max = produto.quantidade_em_estoque;
    inputQuantidade.value = quantidade;

    // Set initial local pedido state
    setQuantidadeInicial(produto.id_tenis, quantidade, produto.preco_unitario);

    // Adiciona o evento de mudança
    inputQuantidade.addEventListener('change', (e) => handleQuantidadeChange(e, produto.id_tenis, produto.preco_unitario));

    card.appendChild(inputQuantidade);
    mostruarioProdutos.appendChild(card);
  });
}
