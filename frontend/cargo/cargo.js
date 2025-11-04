// frontend/cargo/cargo.js
// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';
let currentPersonId = null;
let operacao = null;

// Elementos do DOM serão obtidos após DOMContentLoaded
let form, searchId, btnBuscar, btnIncluir, btnAlterar, btnExcluir, btnCancelar, btnSalvar, cargosTableBody, messageContainer;

document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM
    form = document.getElementById('cargoForm');
    searchId = document.getElementById('searchId');
    btnBuscar = document.getElementById('btnBuscar');
    btnIncluir = document.getElementById('btnIncluir');
    btnAlterar = document.getElementById('btnAlterar');
    btnExcluir = document.getElementById('btnExcluir');
    btnCancelar = document.getElementById('btnCancelar');
    btnSalvar = document.getElementById('btnSalvar');
    cargosTableBody = document.getElementById('cargosTableBody');
    messageContainer = document.getElementById('messageContainer');

    // Carregar lista de cargos ao inicializar
    carregarCargos();

    // Event Listeners
    btnBuscar.addEventListener('click', buscarCargo);
    btnIncluir.addEventListener('click', incluirCargo);
    btnAlterar.addEventListener('click', alterarCargo);
    btnExcluir.addEventListener('click', excluirCargo);
    btnCancelar.addEventListener('click', cancelarOperacao);
    btnSalvar.addEventListener('click', salvarOperacao);

    mostrarBotoes(true, false, false, false, false, false); // buscar visível inicialmente
    bloquearCampos(false); // libera PK e bloqueia os demais campos por padrão
});

// Função para mostrar mensagens
function mostrarMensagem(texto, tipo = 'info') {
    if (!messageContainer) return;
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        if (messageContainer) messageContainer.innerHTML = '';
    }, 3000);
}

function bloquearCampos(bloquearPrimeiro) {
    if (!form) return;
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach((input, index) => {
        if (index === 0) {
            // Primeiro elemento - pk
            input.disabled = bloquearPrimeiro;
        } else {
            // Demais elementos - o oposto
            input.disabled = !bloquearPrimeiro;
        }
    });
}

// Função para limpar formulário
function limparFormulario() {
    if (!form) return;
    form.reset();
}

// mostra/oculta botões
function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    if (!btnBuscar) return;
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

// Função para formatar data para exibição (se precisar)
function formatarData(dataString) {
    if (!dataString) return '';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

// Função para converter data para formato ISO (se precisar)
function converterDataParaISO(dataString) {
    if (!dataString) return null;
    return new Date(dataString).toISOString();
}

// Tenta parsear resposta como JSON de forma segura (suporta corpo vazio)
async function safeParseResponse(response) {
    try {
        const text = await response.text();
        if (!text) return null;
        return JSON.parse(text);
    } catch (err) {
        // se não for JSON, apenas retorna null
        return null;
    }
}

// Função para buscar cargo por ID
async function buscarCargo(event) {
    if (event) event.preventDefault();
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        searchId.focus();
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/cargo/${id}`);
        const data = await safeParseResponse(response);

        if (response.ok) {
            preencherFormulario(data);
            mostrarBotoes(true, false, true, true, false, false); // buscar, alterar, excluir
            mostrarMensagem('Cargo encontrada!', 'success');
            bloquearCampos(false); // libera pk e bloqueia demais (id editável se desejar)
        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false); // permitir incluir
            mostrarMensagem('Cargo não encontrada. Você pode incluir uma nova cargo.', 'info');
            // Quando não existe, queremos bloquear o campo PK e liberar os demais para cadastro
            bloquearCampos(true); // bloqueia PK (index 0) e libera demais
            // colocar foco no nome
            const nomeEl = document.getElementById('nome_cargo');
            if (nomeEl) nomeEl.focus();
        } else {
            const errMsg = (data && data.error) ? data.error : 'Erro ao buscar cargo';
            throw new Error(errMsg);
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar cargo', 'error');
    }
}

// Função para preencher formulário com dados da cargo
function preencherFormulario(cargo) {
    if (!cargo) return;
    currentPersonId = cargo.id_cargo;
    searchId.value = cargo.id_cargo;
    const nomeEl = document.getElementById('nome_cargo');
    if (nomeEl) nomeEl.value = cargo.nome_cargo || '';
    // caso tenha mais campos marque-os aqui
}

// Função para incluir cargo (prepara UI)
function incluirCargo() {
    mostrarMensagem('Preencha os dados para incluir a cargo', 'info');
    currentPersonId = searchId.value || '';
    limparFormulario();
    searchId.value = currentPersonId || '';
    bloquearCampos(true); // bloqueia PK e libera os demais campos
    mostrarBotoes(false, false, false, false, true, true); // salvar e cancelar
    const nomeEl = document.getElementById('nome_cargo');
    if (nomeEl) nomeEl.focus();
    operacao = 'incluir';
}

// Função para alterar cargo (prepara UI)
function alterarCargo() {
    mostrarMensagem('Edite os dados e clique em salvar', 'info');
    bloquearCampos(true); // bloqueia PK e libera os demais campos
    mostrarBotoes(false, false, false, false, true, true);
    const nomeEl = document.getElementById('nome_cargo');
    if (nomeEl) nomeEl.focus();
    operacao = 'alterar';
}

// Função para excluir cargo (prepara UI)
function excluirCargo() {
    mostrarMensagem('Confirme exclusão clicando em salvar', 'warning');
    currentPersonId = searchId.value;
    // bloquear edição do ID enquanto confirma
    if (searchId) searchId.disabled = true;
    // liberar campos só para confirmação visual (não obrigatórios)
    bloquearCampos(false);
    mostrarBotoes(false, false, false, false, true, true); // salvar (confirmar) e cancelar
    operacao = 'excluir';
}

// Função para salvar operação (incluir / alterar / excluir)
async function salvarOperacao(event) {
    if (event) event.preventDefault();
    console.log('Operação:', operacao, ' - currentPersonId:', currentPersonId, ' - searchId:', searchId.value);

    const formData = new FormData(form);
    const cargo = {
        id_cargo: searchId.value,
        nome_cargo: formData.get('nome_cargo') || ''
    };

    try {
        let response;
        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/cargo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cargo)
            });
        } else if (operacao === 'alterar') {
            // usa currentPersonId como id alvo
            const idAlvo = currentPersonId || searchId.value;
            response = await fetch(`${API_BASE_URL}/cargo/${idAlvo}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cargo)
            });
        } else if (operacao === 'excluir') {
            const idAlvo = currentPersonId || searchId.value;
            response = await fetch(`${API_BASE_URL}/cargo/${idAlvo}`, {
                method: 'DELETE'
            });
        } else {
            mostrarMensagem('Nenhuma operação selecionada', 'warning');
            return;
        }

        const data = await safeParseResponse(response);

        if (response.ok) {
            if (operacao === 'incluir' || operacao === 'alterar') {
                mostrarMensagem(`Operação ${operacao} realizada com sucesso!`, 'success');
            } else if (operacao === 'excluir') {
                // se backend retornar mensagem, pode exibi-la
                if (data && data.message) {
                    mostrarMensagem(data.message, 'success');
                } else {
                    mostrarMensagem('Cargo excluída com sucesso!', 'success');
                }
            }
            limparFormulario();
            carregarCargos();
        } else {
            // erro: mostrar mensagem do backend se houver
            const erroTexto = (data && data.error) ? data.error : `Erro ao executar operação ${operacao}`;
            mostrarMensagem(erroTexto, 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro na comunicação com o servidor', 'error');
    } finally {
        // reset UI para estado inicial
        mostrarBotoes(true, false, false, false, false, false);
        bloquearCampos(false);
        if (searchId) {
            searchId.disabled = false;
            searchId.focus();
        }
        operacao = null;
        currentPersonId = null;
    }
}

// Função para cancelar operação
function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    if (searchId) {
        searchId.disabled = false;
        searchId.focus();
    }
    mostrarMensagem('Operação cancelada', 'info');
    operacao = null;
    currentPersonId = null;
}

// Função para carregar lista de cargos
async function carregarCargos() {
    try {
        const response = await fetch(`${API_BASE_URL}/cargo`);
        if (response.ok) {
            const cargos = await response.json();
            renderizarTabelaCargos(cargos);
        } else {
            throw new Error('Erro ao carregar cargos');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de cargos', 'error');
    }
}

// Função para renderizar tabela de cargos
function renderizarTabelaCargos(cargos) {
    if (!cargosTableBody) return;
    cargosTableBody.innerHTML = '';

    cargos.forEach(cargo => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <button class="btn-id" onclick="selecionarCargo(${cargo.id_cargo})">
                    ${cargo.id_cargo}
                </button>
            </td>
            <td>${cargo.nome_cargo || ''}</td>
        `;
        cargosTableBody.appendChild(row);
    });
}

// Função para selecionar cargo da tabela
async function selecionarCargo(id) {
    if (!searchId) return;
    searchId.value = id;
    await buscarCargo();
}
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
  
  

let ehProfessor = false;



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