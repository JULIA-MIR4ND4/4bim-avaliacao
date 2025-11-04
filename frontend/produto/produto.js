// ===============================
// CONFIGURAÇÃO E ELEMENTOS DO DOM
// ===============================
const API_BASE_URL = 'http://localhost:3001';
let currentProdutoId = null;
let operacao = null;

const form = document.getElementById('produtoForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const produtosTableBody = document.getElementById('produtosTableBody');
const messageContainer = document.getElementById('messageContainer');

// Carregar lista ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
});

function handleUserAction(action) {
    if (action === "gerenciar-conta") {
      // alert("Redirecionando para a página de Gerenciar Conta...");
      window.location.href = "/pessoa/gerenciarConta";
    } else if (action === "sair") {
      
      logout();
    }
  }
  
  function handleLogin(){
    const combobox = document.getElementById("oUsuario");
    const primeiraOpcao = combobox.options[0];
    if(primeiraOpcao.text=="Fazer Login"){
  
      window.location.href = 'http://localhost:3001/login/login'; // redireciona para login
    }
  }
  
  async function logout() {
    try {
      const res = await fetch('http://localhost:3001/login/logout', {
        method: 'POST',
        credentials: 'include', // envia cookies para o backend
      });
  
      const data = await res.json();
  
      if (data.status === 'deslogado') {
        window.location.href = 'http://localhost:3001/login/login'; // redireciona para login
      } else {
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao desconectar. Tente novamente.");
    }
  }
  
  

  
  
  
  
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


const inputImagem = document.getElementById('imagem');
const previewImagem = document.getElementById('previewImagem');

inputImagem.addEventListener('change', () => {
    const file = inputImagem.files[0];
    if (file) {
        previewImagem.src = URL.createObjectURL(file);
        previewImagem.style.display = 'block';
    } else {
        previewImagem.style.display = 'none';
    }
});


// ===============================
// EVENTOS
// ===============================
btnBuscar.addEventListener('click', buscarProduto);
btnIncluir.addEventListener('click', incluirProduto);
btnAlterar.addEventListener('click', alterarProduto);
btnExcluir.addEventListener('click', excluirProduto);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

mostrarBotoes(true, false, false, false, false, false);
bloquearCampos(false);

// ===============================
// FUNÇÕES UTILITÁRIAS
// ===============================

function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => (messageContainer.innerHTML = ''), 3000);
}

function bloquearCampos(bloquearPrimeiro) {
    const inputs = document.querySelectorAll('input');
    inputs.forEach((input, index) => {
        if (index === 0) input.disabled = bloquearPrimeiro;
        else input.disabled = !bloquearPrimeiro;
    });
}

function limparFormulario() {
    form.reset();
}

function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

// ===============================
// CRUD
// ===============================
async function buscarProduto() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/produto/${id}`);
        if (response.ok) {
            const produto = await response.json();
            preencherFormulario(produto);
            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Produto encontrado!', 'success');
        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('Produto não encontrado. Você pode incluir um novo.', 'info');
        } else {
            mostrarMensagem('Erro ao buscar produto', 'error');
        }
    } catch (err) {
        console.error('Erro ao buscar produto:', err);
        mostrarMensagem('Erro na busca', 'error');
    }
}

function preencherFormulario(produto) {
    currentProdutoId = produto.id_tenis;
    searchId.value = produto.id_tenis;
    document.getElementById('nome_tenis').value = produto.nome_tenis || '';
    document.getElementById('tamanho_disponivel').value = produto.tamanho_disponivel || '';
    document.getElementById('quantidade_em_estoque').value = produto.quantidade_em_estoque || 0;
    document.getElementById('preco_unitario').value = produto.preco_unitario || 0;
    console.log(produto)
    
    
}

function incluirProduto() {
    limparFormulario();
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('nome_tenis').focus();
    operacao = 'incluir';
}

function alterarProduto() {
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('nome_tenis').focus();
    operacao = 'alterar';
}

function excluirProduto() {
    mostrarMensagem('Confirme a exclusão clicando em Salvar.', 'warning');
    mostrarBotoes(false, false, false, false, true, true);
    operacao = 'excluir';
}

async function salvarOperacao() {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);

    const produtoJSON = {
        nome_tenis: document.getElementById('nome_tenis').value,
        tamanho_disponivel: document.getElementById('tamanho_disponivel').value,
        quantidade_em_estoque: parseInt(document.getElementById('quantidade_em_estoque').value) || 0,
        preco_unitario: parseFloat(document.getElementById('preco_unitario').value) || 0,
        caminho_imagem: uniqueName + ".jpeg"
    };
    console.log(uniqueName)

    // Para enviar ao backend:
    const bodyJSON = JSON.stringify(produtoJSON);
    const formImage = new FormData();
    const novo_arquivo = new File([inputImagem.files[0]], uniqueName + '.jpeg', { type: "image/jpeg" });
    formImage.append("imagem", novo_arquivo)
    

    try {
        if (operacao === 'incluir') {
            await fetch(`${API_BASE_URL}/produto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: bodyJSON,
            });
            await fetch(`${API_BASE_URL}/upload/upload-imagem`, {
                method: 'POST',
                body: formImage 
            })
            
            mostrarMensagem('Produto incluído com sucesso!', 'success');
        } else if (operacao === 'alterar') {
            await fetch(`${API_BASE_URL}/produto/${currentProdutoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: bodyJSON,
            });
            await fetch(`${API_BASE_URL}/upload/upload-imagem`, {
                method: 'POST',
                body: formImage 
            })
            mostrarMensagem('Produto alterado com sucesso!', 'success');
        } else if (operacao === 'excluir') {
            await fetch(`${API_BASE_URL}/produto/${currentProdutoId}`, { method: 'DELETE' });
            mostrarMensagem('Produto excluído com sucesso!', 'success');
        }

        limparFormulario();
        carregarProdutos();
        mostrarBotoes(true, false, false, false, false, false);
        bloquearCampos(false);
        searchId.focus();
    } catch (error) {
        console.error('Erro na operação:', error);
        mostrarMensagem('Erro na operação', 'error');
    }
}

function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    searchId.focus();
    mostrarMensagem('Operação cancelada', 'info');
}

// ===============================
// LISTAGEM
// ===============================
async function carregarProdutos() {
    try {
        const response = await fetch(`${API_BASE_URL}/produto/`);
        if (response.ok) {
            const produtos = await response.json();
            renderizarTabelaProdutos(produtos);
        } else {
            mostrarMensagem('Erro ao carregar produtos', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista', 'error');
    }
}

function renderizarTabelaProdutos(produtos) {
    produtosTableBody.innerHTML = '';
    produtos.forEach((produto) => {
        const row = document.createElement('tr');
        const imagem = produto.imagem_url
            ? `<img src="${produto.imagem_url}" alt="${produto.nome_tenis}" class="thumb">`
            : `<span class="no-img">Sem imagem</span>`;

        row.innerHTML = `
            <td><button class="btn-id" onclick="selecionarProduto(${produto.id_tenis})">${produto.id_tenis}</button></td>
            <td>${imagem}</td>
            <td>${produto.nome_tenis}</td>
            <td>${produto.tamanho_disponivel || '-'}</td>
            <td>${produto.quantidade_em_estoque}</td>
            <td>R$ ${produto.preco_unitario.toFixed(2)}</td>
        `;
        produtosTableBody.appendChild(row);
    });
}

async function selecionarProduto(id) {
    searchId.value = id;
    await buscarProduto();
}
