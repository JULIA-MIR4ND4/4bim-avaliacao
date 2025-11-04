const API_BASE_URL = 'http://localhost:3001';
let ehProfessor = false;
let temquantidade = false;
let pedidoId;
// Adicionar lógica para criar um pedido e atualizar o id_pedido_atual
async function nomeUsuario() {
  const combobox = document.getElementById("oUsuario");
  const primeiraOpcao = combobox.options[0];

  try {
    const res = await fetch('http://localhost:3001/login/verificaSeUsuarioEstaLogado', {
      method: 'POST',
      credentials: 'include' // MUITO IMPORTANTE: envia cookies
    });

    const data = await res.json();

    if (data.status === 'ok') {
      primeiraOpcao.text = data.nome; // usuário logado
      if (!data.id_pedido_atual) {
        // Criar um novo pedido
        const novoPedidoRes = await fetch(`${API_BASE_URL}/pedido`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data_do_pedido: new Date().toISOString().split('T')[0],
            id_cliente: data.id_pessoa,
            id_funcionario: null
          })
        });
        console.log(novoPedidoRes)

        if (novoPedidoRes.ok) {
          const novoPedido = await novoPedidoRes.json();

          // Atualizar o id_pedido_atual da pessoa
          await fetch(`${API_BASE_URL}/pessoa/atualizarPedidoAtual`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id_pessoa: data.id_pessoa,
              id_pedido: novoPedido.id_pedido
            })
          });

          console.log('Novo pedido criado e id_pedido_atual atualizado:', novoPedido);
        } else {
          console.error('Erro ao criar novo pedido');
        }
      } else {
        console.log('Pedido atual já existe:', data.id_pedido_atual);
      }
    } else {
      primeiraOpcao.text = "Fazer Login"; // fallback
    }

  } catch (err) {
    console.error(err);
    primeiraOpcao.text = "Fazer Login";
  }
}

// Chame a função quando a página carregar
window.onload = nomeUsuario;

async function usuarioAutorizado() {
  
  const rota = API_BASE_URL + '/login/verificaSeUsuarioEstaLogado';
  alert('Rota: ' + rota);
  
  const res = await fetch(rota, { credentials: 'include' });
  alert(JSON.stringify(data));

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
  

    const res = await fetch('http://localhost:3001/login/verificaSeUsuarioEstaLogado', {
      method: 'POST',
      credentials: 'include' // MUITO IMPORTANTE: envia cookies
    });
    const data = await res.json();
    let prodPedido;
    if(data.status === 'ok'){
      pedidoId = data.id_pedido_atual;
      temquantidade = true;
      prodPedido = await fetch(`${API_BASE_URL}/pedido/produtos/${data.id_pedido_atual}`);
      prodPedido = await prodPedido.json();
      console.log(prodPedido)
      if(prodPedido.error) prodPedido = []
      prodPedido2 = {}
      idsProdutos = prodPedido.map(item => {
        prodPedido2[item.id_tenis] = item.quantidade
        return  item.id_tenis }
      )
    }
    renderizarProdutos(produtos, prodPedido2, idsProdutos);
    
}

const pedido = {};

function handleQuantidadeChange(event, produtoId, preco_unitario) {
  const novaQuantidade = parseInt(event.target.value);
  pedido[produtoId] = {quantidade: novaQuantidade, preco_unitario: preco_unitario};
  console.log(pedido);
}

async function handleContinuar() {
  try {
    const produtos = Object.entries(pedido).map(([id_tenis, detalhes]) => ({
      id_tenis: parseInt(id_tenis),
      quantidade: detalhes.quantidade, // Corrige para acessar diretamente a quantidade
      preco_unitario: detalhes.preco_unitario // Corrige para acessar diretamente o preço unitário
    }));

    const response = await fetch(`${API_BASE_URL}/pedido/produtos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_pedido: pedidoId, produtos })
    });

    if (!response.ok) {
      throw new Error('Erro ao salvar os produtos no pedido');
    }

    console.log('Produtos salvos com sucesso no pedido!');
    window.location.href = "http://localhost:3001/carrinho";
  } catch (error) {
    console.error('Erro no handleContinuar:', error);
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
      <p>Quantidade: ${produto.quantidade_em_estoque}</p>
      <p class="preco">R$ ${produto.preco_unitario.toFixed(2)}</p>
    `;

    const inputQuantidade = document.createElement('input');
    inputQuantidade.className = 'quantidade';
    inputQuantidade.type = 'number';
    inputQuantidade.placeholder = 'quantidade';
    inputQuantidade.min = 0;
    inputQuantidade.max = produto.quantidade_em_estoque;
    inputQuantidade.value = quantidade;

    // Adiciona o evento de mudança
    inputQuantidade.addEventListener('change', (e) => handleQuantidadeChange(e, produto.id_tenis, produto.preco_unitario));

    card.appendChild(inputQuantidade);
    mostruarioProdutos.appendChild(card);
  });
}