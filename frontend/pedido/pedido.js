const API_BASE_URL = 'http://localhost:3001';
let currentPedidoId = null;
let operacao = null;

// Elementos
const form = document.getElementById('pedidoForm');
const searchId = document.getElementById('searchPedidoId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnSalvar = document.getElementById('btnSalvar');
const btnCancelar = document.getElementById('btnCancelar');
const tabelaBody = document.getElementById('pedidosTableBody');
const messageContainer = document.getElementById('messageContainer');

document.addEventListener('DOMContentLoaded', carregarPedidos);

// Eventos
btnBuscar.addEventListener('click', buscarPedido);
btnIncluir.addEventListener('click', incluirPedido);
btnAlterar.addEventListener('click', alterarPedido);
btnExcluir.addEventListener('click', excluirPedido);
btnSalvar.addEventListener('click', salvarOperacao);
btnCancelar.addEventListener('click', cancelarOperacao);

mostrarBotoes(true, false, false, false, false, false);
bloquearCampos(false);

function mostrarMensagem(texto, tipo = 'info') {
  messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
  setTimeout(() => messageContainer.innerHTML = '', 3000);
}

// Ajustar a função bloquearCampos para manter o campo de busca por ID habilitado
function bloquearCampos(bloquearPrimeiro) {
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
        if (input.id === 'searchPedidoId') {
            input.disabled = false; // Sempre habilitar o campo de busca por ID
        } else {
            input.disabled = !bloquearPrimeiro;
        }
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

async function carregarPedidos() {
  try {
    const res = await fetch(`${API_BASE_URL}/pedido`);
    if (res.ok) {
      const pedidos = await res.json();
      renderizarTabela(pedidos);
    }
  } catch (err) {
    mostrarMensagem('Erro ao carregar pedidos', 'error');
  }
}

function renderizarTabela(pedidos) {
  tabelaBody.innerHTML = '';
  pedidos.forEach(p => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><button class="btn-id" onclick="selecionarPedido(${p.id_pedido})">${p.id_pedido}</button></td>
      <td>${new Date(p.data_do_pedido).toLocaleDateString('pt-BR')}</td>
      <td>${p.nome_cliente || p.id_cliente}</td>
      <td>${p.nome_funcionario || p.id_funcionario}</td>
      <td>${p.valor_total_pagamento}</td>
      <td>${p.status_pagamento}</td>
    `;
    tabelaBody.appendChild(row);
  });
}

async function buscarPedido() {
  const id = searchId.value.trim();
  if (!id) return mostrarMensagem('Informe o ID do pedido', 'warning');

  const res = await fetch(`${API_BASE_URL}/pedido/${id}`);
  if (res.ok) {
    const pedido = await res.json();
    preencherFormulario(pedido);
    mostrarBotoes(true, false, true, true, false, false);
    mostrarMensagem('Pedido encontrado', 'success');
  } else {
    limparFormulario();
    searchId.value = id;
    mostrarBotoes(true, true, false, false, false, false);
    mostrarMensagem('Pedido não encontrado. Você pode incluir.', 'info');
  }
}

function preencherFormulario(pedido) {
  currentPedidoId = pedido.id_pedido;
  document.getElementById('data_do_pedido').value = pedido.data_do_pedido.split('T')[0];
  document.getElementById('id_cliente').value = pedido.id_cliente;
  document.getElementById('id_funcionario').value = pedido.id_funcionario;
}

function incluirPedido() {
  limparFormulario();
  bloquearCampos(true);
  mostrarBotoes(false, false, false, false, true, true);
  operacao = 'incluir';
}

function alterarPedido() {
  bloquearCampos(true);
  mostrarBotoes(false, false, false, false, true, true);
  operacao = 'alterar';
}

function excluirPedido() {
  mostrarMensagem('Confirme para excluir', 'warning');
  bloquearCampos(false);
  mostrarBotoes(false, false, false, false, true, true);
  operacao = 'excluir';
}

async function salvarOperacao() {
  const pedido = {
    data_do_pedido: document.getElementById('data_do_pedido').value,
    id_cliente: document.getElementById('id_cliente').value,
    id_funcionario: document.getElementById('id_funcionario').value
  };

  try {
    if (operacao === 'incluir') {
      await fetch(`${API_BASE_URL}/pedido`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedido)
      });
      mostrarMensagem('Pedido incluído com sucesso!', 'success');
    } else if (operacao === 'alterar') {
      await fetch(`${API_BASE_URL}/pedido/${currentPedidoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedido)
      });
      mostrarMensagem('Pedido alterado com sucesso!', 'success');
    } else if (operacao === 'excluir') {
      await fetch(`${API_BASE_URL}/pedido/${currentPedidoId}`, { method: 'DELETE' });
      mostrarMensagem('Pedido excluído com sucesso!', 'success');
    }

    limparFormulario();
    carregarPedidos();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
  } catch (error) {
    console.error(error);
    mostrarMensagem('Erro na operação', 'error');
  }
}

function cancelarOperacao() {
  limparFormulario();
  mostrarBotoes(true, false, false, false, false, false);
  bloquearCampos(false);
  mostrarMensagem('Operação cancelada', 'info');
}

async function selecionarPedido(id) {
  searchId.value = id;
  await buscarPedido();
}
