const API_BASE_URL = 'http://localhost:3001';
const contaForm = document.getElementById('contaForm');
const messageContainer = document.getElementById('messageContainer');

const btnSalvar = document.getElementById('btnSalvar');
const btnCancelar = document.getElementById('btnCancelar');

let usuarioLogadoId = null; // você pode pegar do cookie ou token
let usuarioLogadoNome = null; // você pode pegar do cookie ou token

document.addEventListener('DOMContentLoaded', () => {
    carregarConta();
});

// ============================
// Funções de mensagem
// ============================
function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => messageContainer.innerHTML = '', 3000);
}

// ============================
// Funções utilitárias
// ============================
function converterDataParaISO(dataString) {
    if (!dataString) return '';
    return new Date(dataString).toISOString().split('T')[0];
}

// ============================
// Carregar conta do usuário
// ============================
async function carregarConta() {
    try {
        await pegarUsuarioLogado()
        const response = await fetch(`${API_BASE_URL}/pessoa/nome/${usuarioLogadoNome}`);
        if (!response.ok) throw new Error('Erro ao carregar dados da conta');
        const usuario = await response.json();
        usuarioLogadoId = usuario.id_pessoa || null;
        document.getElementById('nome_pessoa').value = usuario.nome_pessoa || '';
        document.getElementById('email_pessoa').value = usuario.email_pessoa || '';
        document.getElementById('data_nascimento_pessoa').value = usuario.data_nascimento_pessoa ? converterDataParaISO(usuario.data_nascimento_pessoa) : '';
        document.getElementById('endereco').value = usuario.endereco || '';
    } catch (error) {
        console.error(error);
        mostrarMensagem('Erro ao carregar informações da conta', 'error');
    }
}

// ============================
// Salvar alterações
// ============================
btnSalvar.addEventListener('click', async () => {
    const usuario = {
        nome_pessoa: document.getElementById('nome_pessoa').value,
        email_pessoa: document.getElementById('email_pessoa').value,
        data_nascimento_pessoa: document.getElementById('data_nascimento_pessoa').value || null,
        endereco: document.getElementById('endereco').value,
        conta:true
    };

    const senha_atual = document.getElementById('senha_atual').value;
    const nova_senha = document.getElementById('nova_senha').value;

    try {
        // Atualizar dados da conta
        await fetch(`${API_BASE_URL}/pessoa/${usuarioLogadoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(usuario)
        });

        // Alterar senha se preenchida
        if (senha_atual && nova_senha) {
            const respSenha = await fetch(`${API_BASE_URL}/pessoa/senha/${usuarioLogadoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senha_atual, nova_senha })
            });
            if (!respSenha.ok) {
                const erro = await respSenha.json();
                throw new Error(erro.error || 'Erro ao alterar senha');
            }
        }

        mostrarMensagem('Conta atualizada com sucesso!', 'success');
        document.getElementById('senha_atual').value = '';
        document.getElementById('nova_senha').value = '';

    } catch (error) {
        console.error(error);
        mostrarMensagem(error.message, 'error');
    }
});

// ============================
// Cancelar operação
// ============================
btnCancelar.addEventListener('click', () => {
    carregarConta();
    document.getElementById('senha_atual').value = '';
    document.getElementById('nova_senha').value = '';
    mostrarMensagem('Alterações canceladas', 'info');
});

async function pegarUsuarioLogado() {
  try {
      const res = await fetch(`${API_BASE_URL}/login/verificaSeUsuarioEstaLogado`, {
          method: 'POST',
          credentials: 'include'
      });
      const data = await res.json();
      if (data.status === 'ok') {
          usuarioLogadoNome = data.nome;
          console.log(data)
      } else {
          mostrarMensagem('Você precisa estar logado.', 'warning');
          setTimeout(() => window.location.href = '/login/login', 1000);
      }
  } catch (err) {
      console.error(err);
      mostrarMensagem('Erro ao verificar login', 'error');
      setTimeout(() => window.location.href = '/login/login', 1000);
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