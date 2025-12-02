// frontend/index.js (arquivo completo, com correções para permitir adicionar vários tipos de tênis)
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
      credentials: 'include',
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
      credentials: 'include',
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
      // Não criar pedido automaticamente na página inicial;
      // o pedido será criado apenas ao finalizar a compra no carrinho.
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

    // Em vez de criar/verificar pedido no servidor aqui, usamos o sessionStorage
    // para manter um carrinho temporário até o usuário finalizar a compra.
    let prodPedido = [];
    let prodPedido2 = {};
    let idsProdutos = [];

    try {
      const carrinhoLocal = JSON.parse(sessionStorage.getItem('carrinho')) || [];
      prodPedido = Array.isArray(carrinhoLocal) ? carrinhoLocal : [];
      prodPedido2 = {};
      idsProdutos = prodPedido.map(item => {
        prodPedido2[item.id_tenis] = item.quantidade;
        return item.id_tenis;
      });

      // Preenche o objeto pedido local com os itens do sessionStorage
      prodPedido.forEach(it => {
        pedido[it.id_tenis] = {
          quantidade: it.quantidade,
          preco_unitario: it.preco_unitario
        };
      });
      if (prodPedido.length > 0) temquantidade = true;
    } catch (e) {
      console.warn('Falha ao ler sessionStorage do carrinho:', e);
    }

    renderizarProdutos(produtos, prodPedido2, idsProdutos);
}

// objeto que guarda as quantidades selecionadas na página de produtos
const pedido = {};

// Preenche o pedido com quantidades iniciais (quando volta ao menu)
// agora garante que exista a entrada no pedido (quantidade 0) para todos os produtos renderizados
function setQuantidadeInicial(produtoId, quantidade, preco_unitario) {
  const q = parseInt(quantidade);

  // Se já existe no banco, carrega normalmente
  if (q > 0) {
    pedido[produtoId] = { quantidade: q, preco_unitario };
    return;
  }

  // Se o produto ainda não estava no pedido (quantidade=0),
  // ele deve ser considerado 0 mas DEVE existir no objeto para que funcione a adição depois
  if (!pedido[produtoId]) {
    pedido[produtoId] = {
      quantidade: 0,
      preco_unitario
    };
  } else {
    // atualiza apenas o preco caso exista
    pedido[produtoId].preco_unitario = preco_unitario;
    if (pedido[produtoId].quantidade == null) pedido[produtoId].quantidade = 0;
  }
}

function handleQuantidadeChange(event, produtoId, preco_unitario) {
  // usa 'input' ou 'change' — parseInt pode resultar NaN se vazio
  const val = event.target.value;
  const novaQuantidade = val === '' ? 0 : parseInt(val, 10);
  pedido[produtoId] = {
    quantidade: isNaN(novaQuantidade) ? 0 : novaQuantidade,
    preco_unitario
  };
  // apenas para debug
  console.log('pedido (local):', pedido);
}

// Envia apenas UM produto ao backend (upsert). Usado pelo botão "Adicionar".
async function enviarProdutoIndividual(idPedido, idTenis, quantidade, precoUnitario) {
  try {
    // Agora operamos em sessionStorage: mantemos o carrinho local até finalizar compra
    const q = parseInt(quantidade) || 0;
    if (q > 0) {
      pedido[idTenis] = { quantidade: q, preco_unitario: parseFloat(precoUnitario) };
    } else {
      delete pedido[idTenis];
    }

    // Converte pedido em array e salva no sessionStorage
    const arr = Object.entries(pedido).map(([id, det]) => ({ id_tenis: parseInt(id), quantidade: det.quantidade, preco_unitario: det.preco_unitario }));
    sessionStorage.setItem('carrinho', JSON.stringify(arr));
    return true;
  } catch (err) {
    console.error('Erro enviarProdutoIndividual:', err);
    return false;
  }
}

async function handleContinuar() {
  try {
    // Salva o carrinho atual em sessionStorage e navega para o carrinho.
    const produtos = Object.entries(pedido).map(([id_tenis, detalhes]) => ({
      id_tenis: parseInt(id_tenis),
      quantidade: detalhes.quantidade || 0,
      preco_unitario: detalhes.preco_unitario
    })).filter(p => p.quantidade > 0);

    if (produtos.length === 0) {
      alert('Nenhum produto selecionado.');
      return;
    }

    sessionStorage.setItem('carrinho', JSON.stringify(produtos));
    // vai ao carrinho; o pedido só será criado ao finalizar a compra
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

    // usa 'input' para capturar digitação sem precisar perder foco
    inputQuantidade.addEventListener('input', (e) => handleQuantidadeChange(e, produto.id_tenis, produto.preco_unitario));

    // Botão rápido para adicionar somente este produto ao pedido/DB (resolve "preciso ir ao carrinho e voltar")
    const btnAdicionar = document.createElement('button');
    btnAdicionar.className = 'btn-adicionar';
    btnAdicionar.innerText = 'Adicionar';

    btnAdicionar.addEventListener('click', async () => {
      // pega a quantidade atual do input (pode ser 0)
      const q = inputQuantidade.value === '' ? 0 : parseInt(inputQuantidade.value, 10) || 0;

      // salva localmente no sessionStorage (o pedido no banco será criado ao finalizar)
      const ok = await enviarProdutoIndividual(null, produto.id_tenis, q, produto.preco_unitario);
      if (ok) {
        // feedback simples
        btnAdicionar.innerText = 'Adicionado ✓';
        setTimeout(() => btnAdicionar.innerText = 'Adicionar', 900);
      } else {
        alert('Erro ao adicionar o produto. Veja o console.');
      }
    });

    const wrapper = document.createElement('div');
    wrapper.className = 'produto-actions';
    wrapper.appendChild(inputQuantidade);
    wrapper.appendChild(btnAdicionar);

    card.appendChild(wrapper);
    mostruarioProdutos.appendChild(card);
  });
}
