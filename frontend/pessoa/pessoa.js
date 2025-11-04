// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';
let currentPersonId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('pessoaForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const pessoasTableBody = document.getElementById('pessoasTableBody');
const messageContainer = document.getElementById('messageContainer');

// Carregar lista de pessoas ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarPessoas();
    carregarCargos(); // ✅ chamada adicionada para preencher o select de cargos
});

// Event Listeners
btnBuscar.addEventListener('click', buscarPessoa);
btnIncluir.addEventListener('click', incluirPessoa);
btnAlterar.addEventListener('click', alterarPessoa);
btnExcluir.addEventListener('click', excluirPessoa);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

mostrarBotoes(true, false, false, false, false, false);
bloquearCampos(false);

// Função para mostrar mensagens
function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

// Ajustar a função bloquearCampos para manter o campo de busca por ID habilitado
function bloquearCampos(bloquearPrimeiro) {
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach((input, index) => {
        if (input.id === 'searchId') {
            input.disabled = false; // Sempre habilitar o campo de busca por ID
        } else {
            input.disabled = !bloquearPrimeiro;
        }
    });
}

// Limpar formulário
function limparFormulario() {
    form.reset();
    document.getElementById('checkboxFuncionario').checked = false;
    document.getElementById('checkboxCliente').checked = false;
}

// Mostrar ou esconder botões
function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

// Formatar data para exibição
function formatarData(dataString) {
    if (!dataString) return '';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

// Converter data para ISO
function converterDataParaISO(dataString) {
    if (!dataString) return null;
    return new Date(dataString).toISOString().split('T')[0];
}

// ✅ NOVA FUNÇÃO — Carregar cargos no select
async function carregarCargos() {
    try {
        const response = await fetch(`${API_BASE_URL}/cargo`);
        if (response.ok) {
            const cargos = await response.json();
            const selectCargo = document.getElementById('cargo_id_cargo');
            if (selectCargo) {
                selectCargo.innerHTML = '<option value="">Selecione um cargo</option>';
                cargos.forEach(cargo => {
                    const option = document.createElement('option');
                    option.value = cargo.id_cargo;
                    option.textContent = cargo.nome_cargo;
                    selectCargo.appendChild(option);
                });
            }
        } else {
            console.error('Erro ao carregar cargos');
        }
    } catch (error) {
        console.error('Erro ao buscar cargos:', error);
    }
}

// Verifica se a pessoa é funcionário
async function verificarFuncionario(pessoaId) {
    try {
        const response = await fetch(`${API_BASE_URL}/funcionario/${pessoaId}`);
        if (response.status === 404) return { ehFuncionario: false };
        if (response.status === 200) {
            const data = await response.json();
            return {
                ehFuncionario: true,
                salario: data.salario,
                cargo_id_cargo: data.cargo_id_cargo,
                porcentagem_comissao: data.porcentagem_comissao
            };
        }
        return { ehFuncionario: false };
    } catch (error) {
        console.error('Erro ao verificar funcionário:', error);
        return { ehFuncionario: false };
    }
}

// Verifica se a pessoa é cliente
async function verificarCliente(pessoaId) {
    try {
        const response = await fetch(`${API_BASE_URL}/cliente/${pessoaId}`);
        if (response.status === 404) return { ehCliente: false };
        if (response.status === 200) {
            const data = await response.json();
            return {
                ehCliente: true,
                renda_cliente: data.renda_cliente,
                data_de_cadastro_cliente: data.data_de_cadastro_cliente
            };
        }
        return { ehCliente: false };
    } catch (error) {
        console.error('Erro ao verificar cliente:', error);
        return { ehCliente: false };
    }
}

// Buscar pessoa por ID
async function buscarPessoa() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/pessoa/${id}`);
        if (response.ok) {
            const pessoa = await response.json();
            preencherFormulario(pessoa);
            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Pessoa encontrada!', 'success');
        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('Pessoa não encontrada. Você pode incluir uma nova pessoa.', 'info');
        }

        // Verifica funcionário
        const f = await verificarFuncionario(id);
        if (f.ehFuncionario) {
            document.getElementById('checkboxFuncionario').checked = true;
            document.getElementById('salario').value = f.salario || '';
            document.getElementById('cargo_id_cargo').value = f.cargo_id_cargo || '';
            document.getElementById('porcentagem_comissao').value = f.porcentagem_comissao || '';
        } else {
            document.getElementById('checkboxFuncionario').checked = false;
            document.getElementById('salario').value = '';
            document.getElementById('cargo_id_cargo').value = '';
            document.getElementById('porcentagem_comissao').value = '';
        }

        // Verifica cliente
        const c = await verificarCliente(id);
        if (c.ehCliente) {
            document.getElementById('checkboxCliente').checked = true;
            document.getElementById('renda_cliente').value = c.renda_cliente || '';
            document.getElementById('data_de_cadastro_cliente').value = c.data_de_cadastro_cliente ? converterDataParaISO(c.data_de_cadastro_cliente) : '';
        } else {
            document.getElementById('checkboxCliente').checked = false;
            document.getElementById('renda_cliente').value = '';
            document.getElementById('data_de_cadastro_cliente').value = '';
        }

    } catch (error) {
        console.error('Erro ao buscar pessoa:', error);
        mostrarMensagem('Erro ao buscar pessoa', 'error');
    }
}

// Preencher formulário
function preencherFormulario(pessoa) {
    currentPersonId = pessoa.id_pessoa;
    searchId.value = pessoa.id_pessoa;
    document.getElementById('nome_pessoa').value = pessoa.nome_pessoa || '';
    document.getElementById('email_pessoa').value = pessoa.email_pessoa || '';
    document.getElementById('senha_pessoa').value = pessoa.senha_pessoa || '';
    document.getElementById('data_nascimento_pessoa').value = pessoa.data_nascimento_pessoa ? converterDataParaISO(pessoa.data_nascimento_pessoa) : '';
    document.getElementById('endereco').value = pessoa.endereco || '';
}

// Incluir Pessoa
function incluirPessoa() {
    limparFormulario();
    searchId.value = currentPersonId;
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('nome_pessoa').focus();
    operacao = 'incluir';
}

// Alterar Pessoa
function alterarPessoa() {
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('nome_pessoa').focus();
    operacao = 'alterar';
}

// Excluir Pessoa
function excluirPessoa() {
    mostrarMensagem('Excluindo pessoa...', 'info');
    bloquearCampos(false);
    mostrarBotoes(false, false, false, false, true, true);
    operacao = 'excluir';
}

// Salvar Operação
async function salvarOperacao() {
    const formData = new FormData(form);
    const pessoa = {
        id_pessoa: searchId.value,
        nome_pessoa: formData.get('nome_pessoa'),
        email_pessoa: formData.get('email_pessoa'),
        senha_pessoa: formData.get('senha_pessoa'),
        data_nascimento_pessoa: formData.get('data_nascimento_pessoa') || null,
        endereco: formData.get('endereco')
    };

    let funcionario = null;
    if (document.getElementById('checkboxFuncionario').checked) {
        funcionario = {
            id_pessoa: pessoa.id_pessoa,
            salario: parseFloat(document.getElementById('salario').value) || 0,
            cargo_id_cargo: parseInt(document.getElementById('cargo_id_cargo').value) || null,
            porcentagem_comissao: parseFloat(document.getElementById('porcentagem_comissao').value) || 0
        };
    }

    let cliente = null;
    if (document.getElementById('checkboxCliente').checked) {
        cliente = {
            id_pessoa: pessoa.id_pessoa,
            renda_cliente: parseFloat(document.getElementById('renda_cliente').value) || 0,
            data_de_cadastro_cliente: document.getElementById('data_de_cadastro_cliente').value || null
        };
    }

    try {
        if (operacao === 'incluir') {
            // Pessoa
            await fetch(`${API_BASE_URL}/pessoa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pessoa)
            });
            // Funcionario
            if (funcionario) {
                await fetch(`${API_BASE_URL}/funcionario`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(funcionario)
                });
            }
            // Cliente
            if (cliente) {
                await fetch(`${API_BASE_URL}/cliente`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cliente)
                });
            }

            mostrarMensagem('Pessoa incluída com sucesso!', 'success');

        } else if (operacao === 'alterar') {
            await fetch(`${API_BASE_URL}/pessoa/${currentPersonId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pessoa)
            });

            // Funcionario
            const respF = await fetch(`${API_BASE_URL}/funcionario/${currentPersonId}`);
            if (document.getElementById('checkboxFuncionario').checked) {
                if (respF.status === 404) {
                    await fetch(`${API_BASE_URL}/funcionario`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(funcionario) });
                } else {
                    await fetch(`${API_BASE_URL}/funcionario/${currentPersonId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(funcionario) });
                }
            } else if (respF.status === 200) {
                await fetch(`${API_BASE_URL}/funcionario/${currentPersonId}`, { method: 'DELETE' });
            }

            // Cliente
            const respC = await fetch(`${API_BASE_URL}/cliente/${currentPersonId}`);
            if (document.getElementById('checkboxCliente').checked) {
                if (respC.status === 404) {
                    await fetch(`${API_BASE_URL}/cliente`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cliente) });
                } else {
                    await fetch(`${API_BASE_URL}/cliente/${currentPersonId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cliente) });
                }
            } else if (respC.status === 200) {
                await fetch(`${API_BASE_URL}/cliente/${currentPersonId}`, { method: 'DELETE' });
            }

            mostrarMensagem('Pessoa alterada com sucesso!', 'success');

        } else if (operacao === 'excluir') {
            await fetch(`${API_BASE_URL}/cliente/${currentPersonId}`, { method: 'DELETE' });
            await fetch(`${API_BASE_URL}/funcionario/${currentPersonId}`, { method: 'DELETE' });
            await fetch(`${API_BASE_URL}/pessoa/${currentPersonId}`, { method: 'DELETE' });
            mostrarMensagem('Pessoa excluída com sucesso!', 'success');
        }

        limparFormulario();
        carregarPessoas();
        mostrarBotoes(true, false, false, false, false, false);
        bloquearCampos(false);
        searchId.focus();

    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro na operação', 'error');
    }
}

// Cancelar operação
function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    searchId.focus();
    mostrarMensagem('Operação cancelada', 'info');
}

// Carregar lista de pessoas
async function carregarPessoas() {
    try {
        const response = await fetch(`${API_BASE_URL}/pessoa`);
        if (response.ok) {
            const pessoas = await response.json();
            renderizarTabelaPessoas(pessoas);
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de pessoas', 'error');
    }
}

// Renderizar tabela de pessoas
function renderizarTabelaPessoas(pessoas) {
    pessoasTableBody.innerHTML = '';
    pessoas.forEach(async (pessoa) => {
        const f = await verificarFuncionario(pessoa.id_pessoa);
        const c = await verificarCliente(pessoa.id_pessoa);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><button class="btn-id" onclick="selecionarPessoa(${pessoa.id_pessoa})">${pessoa.id_pessoa}</button></td>
            <td>${pessoa.nome_pessoa}</td>
            <td>${pessoa.email_pessoa}</td>
            <td>${formatarData(pessoa.data_nascimento_pessoa)}</td>
            <td>${pessoa.endereco}</td>
            <td>${f.ehFuncionario ? 'Sim' : 'Não'}</td>
            <td>${c.ehCliente ? 'Sim' : 'Não'}</td>
        `;
        pessoasTableBody.appendChild(row);
    });
}

// Selecionar pessoa da tabela
async function selecionarPessoa(id) {
    searchId.value = id;
    await buscarPessoa();
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
