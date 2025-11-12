/**
 * pedido.js - CRUD de Pedidos e Itens (Reescrito para o Backend do Usuário)
 * Estrutura baseada no código do professor, adaptado para:
 * - Rotas: /pedido, /pedido/produtos, /funcionario, /cliente
 * - Campos: pedido_id_pedido, data_pedido, cliente_pessoa_cpf_pessoa, funcionario_pessoa_cpf_pessoa
 * - Normalização de CPF (remove caracteres não-numéricos)
 * - Busca dinâmica de funcionário (por CPF ou nome)
 */

const API_BASE_URL = 'http://localhost:3001';

// Estado global
let currentPedidoId = null;
let operacao = null;
let itensDoPedido = []; // array de objetos { pedido_id_pedido, produto_id_produto, nome_produto, quantidade, preco_unitario }

// ---- Helpers para buscar elementos com nomes diferentes (compatibilidade) ----
function $id(...names) {
  for (const n of names) {
    const el = document.getElementById(n);
    if (el) return el;
  }
  return null;
}

// Elementos (tenta nomes do seu e do professor)
const form = $id('pedidoForm', 'formPedido');
const searchId = $id('searchPedidoId', 'searchId');
const btnBuscar = $id('btnBuscar');
const btnIncluir = $id('btnIncluir');
const btnAlterar = $id('btnAlterar');
const btnExcluir = $id('btnExcluir');
const btnSalvar = $id('btnSalvar');
const btnCancelar = $id('btnCancelar');
const pedidosTableBody = $id('pedidosTableBody', 'pedidos-table-body', 'pedidosTable');
const itensTableBody = $id('itensTableBody', 'itens-table-body');
const messageContainer = $id('messageContainer', 'msgContainer');

// Campos do formulário de pedido (compatíveis com vários nomes)
const inputDataPedido = $id('data_pedido', 'data_do_pedido');
const inputCliente = $id('cliente_pessoa_cpf_pessoa', 'id_cliente', 'cliente');
const inputFuncionario = $id('funcionario_pessoa_cpf_pessoa', 'id_funcionario', 'funcionario');
const inputSearchId = searchId; // alias

// Selects / inputs para adicionar item (podem ser criados dinamicamente no html)
const produtoSelect = $id('produtoSelect'); // optional
const produtoIdInput = $id('produtoIdInput'); // optional
const produtoQuantidadeInput = $id('quantidade', 'quantidade_input');

// mensagens e fallback
function mostrarMensagem(texto, tipo = 'info') {
  if (!messageContainer) {
    console.log(`[${tipo.toUpperCase()}] ${texto}`);
    return;
  }
  messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
  setTimeout(() => {
    if (messageContainer) messageContainer.innerHTML = '';
  }, 3000);
}

// Mostrar/ocultar botões (mantém compatibilidade com ambos)
function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
  if (btnBuscar) btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
  if (btnIncluir) btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
  if (btnAlterar) btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
  if (btnExcluir) btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
  if (btnSalvar) btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
  if (btnCancelar) btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

// Bloquear/desbloquear campos do formulário (index 0 = chave)
// Mantive a lógica original, mas garanto que o campo de busca (searchId) sempre fica habilitado.
function bloquearCampos(bloquearPrimeiro) {
  if (!form) return;
  const inputs = form.querySelectorAll('input, select, textarea');
  inputs.forEach((input, index) => {
    if (input.id === (searchId && searchId.id)) {
      input.disabled = false;
      return;
    }
    if (index === 0) {
      // primeiro campo (geralmente PK) fica bloqueado quando bloquearPrimeiro=true
      input.disabled = bloquearPrimeiro;
    } else {
      input.disabled = !bloquearPrimeiro;
    }
  });
}

// Limpa o formulário
function limparFormulario() {
  if (form) form.reset();
  itensDoPedido = [];
  currentPedidoId = null;
  renderizerTabelaItensPedido([]);
  if (inputSearchId) inputSearchId.value = '';
  // limpa dado auxiliar do funcionario (se houver)
  if (inputFuncionario) {
    inputFuncionario.removeAttribute('data-nome');
  }
}

// Formatação de datas (para input type=date e exibição)
function formatarData(dataString) {
  if (!dataString) return '';
  const d = new Date(dataString);
  return d.toLocaleDateString('pt-BR');
}
function formatarDataParaInputDate(dataString) {
  if (!dataString) return '';
  const d = new Date(dataString);
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}
function converterDataParaISO(dataString) {
  if (!dataString) return null;
  const d = new Date(dataString);
  return d.toISOString();
}

// ========================
// Eventos iniciais
// ========================
if (document) {
  document.addEventListener('DOMContentLoaded', () => {
    // Se existir tabela de pedidos/carregamento automático, chama carregarPedidos
    if (pedidosTableBody) carregarPedidos();
    // Se existir select de produtos, tenta carregar produtos (se houver rota /produto)
    if (produtoSelect) carregarProdutosParaSelect();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    // inicializa busca dinâmica de funcionário (se o campo existir)
    if (inputFuncionario) initBuscaDinamicaFuncionario();
  });
}

// Add event listeners (só se existirem)
if (btnBuscar) btnBuscar.addEventListener('click', buscarPedido);
if (btnIncluir) btnIncluir.addEventListener('click', incluirPedido);
if (btnAlterar) btnAlterar.addEventListener('click', alterarPedido);
if (btnExcluir) btnExcluir.addEventListener('click', excluirPedido);
if (btnSalvar) btnSalvar.addEventListener('click', salvarOperacao);
if (btnCancelar) btnCancelar.addEventListener('click', cancelarOperacao);

// ========================
// FUNÇÕES de CRUD e Itens
// ========================

// Carregar lista de pedidos (GET /pedido)
async function carregarPedidos() {
  try {
    const res = await fetch(`${API_BASE_URL}/pedido`);
    if (!res.ok) throw new Error('Erro ao buscar pedidos');
    const pedidos = await res.json();
    renderizarTabelaPedidos(pedidos || []);
  } catch (err) {
    console.error(err);
    mostrarMensagem('Erro ao carregar pedidos', 'error');
  }
}

// Renderiza tabela principal de pedidos
function renderizarTabelaPedidos(pedidos) {
  if (!pedidosTableBody) {
    console.warn('Elemento pedidosTableBody não encontrado no HTML.');
    return;
  }
  pedidosTableBody.innerHTML = '';
  pedidos.forEach(p => {
    const row = document.createElement('tr');

    // Exibe datas no formato pt-BR (se houver)
    const dataTexto = p.data_pedido || p.data_do_pedido || p.data_do_pedido || '';
    const dataFormatada = dataTexto ? formatarData(dataTexto) : '';

    // Nome dos campos (compatibilidade)
    const idCampo = p.id_pedido || p.id || p.idPedido;
    const cliente = p.cliente_pessoa_cpf_pessoa || p.id_cliente || p.nome_cliente || p.cliente || '';
    const funcionario = p.funcionario_pessoa_cpf_pessoa || p.id_funcionario || p.nome_funcionario || p.funcionario || '';
    const valor = p.valor_total_pagamento || p.valor_total || p.valor || '';

    row.innerHTML = `
      <td><button class="btn-id" onclick="selecionarPedido(${idCampo})">${idCampo}</button></td>
      <td>${dataFormatada}</td>
      <td>${cliente}</td>
      <td>${funcionario}</td>
      <td>${valor}</td>
      <td>
        <button class="btn-small" onclick="selecionarPedido(${idCampo})">Abrir</button>
        <button class="btn-small" onclick="confirmExcluirPedido(${idCampo})">Excluir</button>
      </td>
    `;
    pedidosTableBody.appendChild(row);
  });
}

// Buscar pedido por ID (GET /pedido/:id)
async function buscarPedido() {
  const id = (inputSearchId && inputSearchId.value.trim()) || '';
  if (!id) {
    mostrarMensagem('Informe o ID do pedido', 'warning');
    return;
  }
  try {
    const res = await fetch(`${API_BASE_URL}/pedido/${id}`);
    if (res.ok) {
      const pedido = await res.json();
      preencherFormulario(pedido);
      mostrarBotoes(true, false, true, true, false, false);
      mostrarMensagem('Pedido encontrado', 'success');
      // carregar itens
      await carregarItensDoPedido(pedido.id_pedido || pedido.id || id);
    } else if (res.status === 404) {
      limparFormulario();
      if (inputSearchId) inputSearchId.value = id;
      mostrarBotoes(true, true, false, false, false, false);
      mostrarMensagem('Pedido não encontrado. Você pode incluir.', 'info');
    } else {
      throw new Error('Erro ao buscar pedido');
    }
  } catch (err) {
    console.error(err);
    mostrarMensagem('Erro ao buscar pedido', 'error');
  }
}

// Preenche formulário com dados do pedido
function preencherFormulario(pedido) {
  currentPedidoId = pedido.id_pedido || pedido.id || null;
  if (inputSearchId) inputSearchId.value = pedido.id_pedido || pedido.id || '';
  if (inputDataPedido) inputDataPedido.value = formatarDataParaInputDate(pedido.data_pedido || pedido.data_do_pedido || '');
  // Backend retorna id_cliente (numérico) mas para exibição mostramos o nome
  if (inputCliente) {
    const clienteId = pedido.id_cliente || '';
    const clienteNome = pedido.nome_cliente || '';
    inputCliente.value = clienteId || '';
    if (clienteNome) inputCliente.setAttribute('data-nome', clienteNome);
  }
  if (inputFuncionario) {
    const funcId = pedido.id_funcionario || '';
    const funcNome = pedido.nome_funcionario || '';
    inputFuncionario.value = funcId || '';
    if (funcNome) inputFuncionario.setAttribute('data-nome', funcNome);
  }
}

// ========= ITENS DO PEDIDO ==========

// Carregar itens de um pedido (GET /pedido/produtos/:pedidoId)
async function carregarItensDoPedido(pedidoId) {
  if (!pedidoId) {
    renderizerTabelaItensPedido([]);
    return;
  }
  try {
  const res = await fetch(`${API_BASE_URL}/pedido/produtos/${pedidoId}`);
    if (res.ok) {
      const itens = await res.json();
      // Normalizar: se objeto único, transformar em array
      let itensNorm = itens;
      if (itens && !Array.isArray(itens)) itensNorm = [itens];
      itensDoPedido = itensNorm || [];
      renderizerTabelaItensPedido(itensDoPedido);
    } else if (res.status === 404) {
      // sem itens
      itensDoPedido = [];
      renderizerTabelaItensPedido([]);
    } else {
      // outros erros: mostra vazio e log
      console.warn('carregarItensDoPedido status:', res.status);
      itensDoPedido = [];
      renderizerTabelaItensPedido([]);
    }
  } catch (err) {
    // silencioso para erros de itens, mas log no console
    console.error('Erro ao carregar itens do pedido:', err);
    itensDoPedido = [];
    renderizerTabelaItensPedido([]);
  }
}

// Renderiza tabela de itens do pedido (tbody com id itensTableBody)
function renderizerTabelaItensPedido(itens) {
  if (!itensTableBody) {
    console.warn('Elemento itensTableBody não encontrado no HTML.');
    return;
  }
  itensTableBody.innerHTML = '';

  // Normalizar
  if (itens && typeof itens === 'object' && !Array.isArray(itens)) {
    itens = [itens];
  }
  if (!itens) itens = [];

  itens.forEach((item, index) => {
    const row = document.createElement('tr');

  // campos possíveis: id_pedido/id_tenis/nome_tenis/preco_unitario
  const pid = item.id_pedido || item.pedido_id_pedido || item.pedido || item.pedidoId || '';
  const prodId = item.id_tenis || item.produto_id_produto || item.produto || item.produtoId || '';
  const nome = item.nome_tenis || item.nome_produto || item.nome || '';
  const quantidade = item.quantidade || item.qtd || 0;
  const preco = (item.preco_unitario !== undefined) ? parseFloat(item.preco_unitario) : (item.preco || 0);

    const subTotal = (parseFloat(quantidade) * parseFloat(preco)) || 0;
    const subFormatted = subTotal.toFixed(2).replace('.', ',');

    row.innerHTML = `
      <td class="pedido-id-cell">${pid}</td>
      <td class="produto-id-cell">${prodId}</td>
      <td class="nome-produto-cell">${nome}</td>
      <td class="quantidade-cell"><input type="number" min="1" value="${quantidade}" class="quantidade-input" data-index="${index}"></td>
      <td class="preco-cell"><input type="number" min="0" step="0.01" value="${preco}" class="preco-input" data-index="${index}"></td>
      <td class="subtotal-cell">${subFormatted}</td>
      <td><button class="btn-secondary btn-small" onclick="btnAtualizarItem(this)">Atualizar</button></td>
      <td><button class="btn-secondary btn-small" onclick="btnExcluirItem(this)">Excluir</button></td>
    `;
    itensTableBody.appendChild(row);
  });

  // Adiciona event listeners para recalcular subtotais ao alterar inputs
  adicionarEventListenersSubtotal();
  // Atualiza valor total na tela
  atualizarValorTotalDOM();
}

// Adiciona listeners nos inputs de quantidade e preço para atualizar subtotal ao digitar
function adicionarEventListenersSubtotal() {
  if (!itensTableBody) return;
  const quantidadeInputs = itensTableBody.querySelectorAll('.quantidade-input');
  const precoInputs = itensTableBody.querySelectorAll('.preco-input');

  quantidadeInputs.forEach(input => {
    input.removeEventListener('input', atualizarSubtotal);
    input.removeEventListener('change', atualizarSubtotal);
    input.addEventListener('input', atualizarSubtotal);
    input.addEventListener('change', atualizarSubtotal);
  });
  precoInputs.forEach(input => {
    input.removeEventListener('input', atualizarSubtotal);
    input.removeEventListener('change', atualizarSubtotal);
    input.addEventListener('input', atualizarSubtotal);
    input.addEventListener('change', atualizarSubtotal);
  });
}

// Atualiza subtotal de uma linha quando quantidade/preço mudam
function atualizarSubtotal(event) {
  const target = event.target;
  const row = target.closest('tr');
  if (!row) return;
  const quantidadeInput = row.querySelector('.quantidade-input');
  const precoInput = row.querySelector('.preco-input');
  const subtotalCell = row.querySelector('.subtotal-cell');

  const quantidade = parseFloat(quantidadeInput.value) || 0;
  const preco = parseFloat(precoInput.value) || 0;

  const novoSubtotal = quantidade * preco;
  subtotalCell.textContent = novoSubtotal.toFixed(2).replace('.', ',');
  // Recalcula o valor total geral
  atualizarValorTotalDOM();
}

// Calcula e atualiza o valor total lendo os valores diretamente da tabela de itens
function atualizarValorTotalDOM() {
  const valorEl = document.getElementById('valorTotal');
  if (!valorEl || !itensTableBody) return;
  const rows = itensTableBody.querySelectorAll('tr');
  let total = 0;
  rows.forEach(row => {
    const qInput = row.querySelector('.quantidade-input');
    const pInput = row.querySelector('.preco-input');
    const q = qInput ? parseFloat(qInput.value) || 0 : 0;
    const p = pInput ? parseFloat(pInput.value) || 0 : 0;
    total += q * p;
  });
  valorEl.textContent = total.toFixed(2).replace('.', ',');
}

// Adicionar nova linha vazia para inserir item (apenas visual, real create via btnAdicionarItem)
function adicionarItem() {
  if (!itensTableBody) {
    mostrarMensagem('Tabela de itens não encontrada', 'error');
    return;
  }
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><input type="number" class="pedido-id-input" value="${inputSearchId ? inputSearchId.value : ''}" disabled></td>
    <td class="produto-group"><input type="number" class="produto-id-input"><button class="btn-secondary btn-small" onclick="buscarProdutoPorId(this)">Buscar</button></td>
    <td><span class="produto-nome-input">--</span></td>
    <td><input type="number" class="quantidade-input" value="1" min="1"></td>
    <td><input type="number" class="preco-input" value="0.00" min="0" step="0.01"></td>
    <td class="subtotal-cell">0,00</td>
    <td><button class="btn-secondary btn-small" onclick="btnAdicionarItem(this)">Adicionar</button></td>
    <td><button class="btn-secondary btn-small" onclick="btnCancelarItem(this)">Cancelar</button></td>
  `;
  itensTableBody.appendChild(row);
  adicionarEventListenersSubtotal();
}

// Buscar produto por ID e preencher nome/preço na linha
async function buscarProdutoPorId(button) {
  const row = button.closest('tr');
  if (!row) return;
  const produtoIdInput = row.querySelector('.produto-id-input');
  const produtoId = produtoIdInput.value;
  if (!produtoId) {
    mostrarMensagem('Insira o ID do produto', 'warning');
    return;
  }
  try {
    const res = await fetch(`${API_BASE_URL}/produto/${produtoId}`);
    if (!res.ok) throw new Error('Produto não encontrado');
    const produto = await res.json();
    // Preenche nome e preço
    const nomeSpan = row.querySelector('.produto-nome-input');
    const precoInputRow = row.querySelector('.preco-input');
    nomeSpan.innerHTML = produto.nome_produto || produto.nome || '';
    precoInputRow.value = produto.preco_unitario !== undefined ? produto.preco_unitario : (produto.preco || 0);
    // Atualiza subtotal
    atualizarSubtotal({ target: precoInputRow });
    mostrarMensagem(`Produto ${produto.nome_produto || produto.nome} encontrado`, 'success');
  } catch (err) {
    console.error(err);
    mostrarMensagem('Erro ao buscar produto', 'error');
  }
}

// Botão "Adicionar" (cria/atualiza o item no backend POST /pedido/produtos)
function btnAdicionarItem(button) {
  const row = button.closest('tr');
  if (!row) return console.error('Linha não encontrada');

  // tenta pegar o pedidoId: primeiro currentPedidoId (pedido já salvo), senão busca no campo da linha, senão no campo de busca
  let pedidoId = null;
  if (currentPedidoId) pedidoId = currentPedidoId;
  else if (row.querySelector('.pedido-id-input')) pedidoId = row.querySelector('.pedido-id-input').value;
  else if (inputSearchId && inputSearchId.value) pedidoId = inputSearchId.value;

  if (!pedidoId || isNaN(parseInt(pedidoId))) {
    mostrarMensagem('Salve/Informe o pedido antes de adicionar itens (clique em Incluir e Salvar primeiro).', 'warning');
    return;
  }

  const produtoId = row.querySelector('.produto-id-input').value;
  const quantidade = row.querySelector('.quantidade-input').value;
  const precoUnitario = row.querySelector('.preco-input').value;

  // Validação
  if (!pedidoId || isNaN(parseInt(pedidoId)) || !produtoId || isNaN(parseInt(produtoId)) || !quantidade || isNaN(parseInt(quantidade)) || !precoUnitario || isNaN(parseFloat(precoUnitario))) {
    mostrarMensagem('Preencha corretamente todos os campos do item', 'warning');
    return;
  }

  // Formato esperado pelo backend: { id_pedido, produtos: [{id_tenis, quantidade, preco_unitario}...] }
  const payload = {
    id_pedido: parseInt(pedidoId),
    produtos: [{
      id_tenis: parseInt(produtoId),
      quantidade: parseInt(quantidade),
      preco_unitario: parseFloat(String(precoUnitario).replace(',', '.'))
    }]
  };

  console.debug('POST /pedido/produtos payload:', payload);
  fetch(`${API_BASE_URL}/pedido/produtos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(async res => {
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `Erro ao adicionar item (status ${res.status})`);
      }
      return res.json();
    })
    .then(data => {
      mostrarMensagem('Item adicionado com sucesso!', 'success');
      carregarItensDoPedido(payload.id_pedido);
      carregarPedidos();
    })
    .catch(err => {
      console.error('Erro ao adicionar item:', err);
      mostrarMensagem(err.message || 'Erro ao adicionar item', 'error');
    });
}

// Cancelar adição de item (remove linha temporária)
function btnCancelarItem(button) {
  const row = button.closest('tr');
  if (row) {
    row.remove();
    mostrarMensagem('Adição do item cancelada', 'info');
  }
}

// Atualizar item (Backend aceita POST /pedido/produtos para inserir/atualizar)
function btnAtualizarItem(button) {
  const row = button.closest('tr');
  if (!row) return;
  const pedidoId = row.querySelector('.pedido-id-cell') ? row.querySelector('.pedido-id-cell').textContent : (inputSearchId ? inputSearchId.value : '');
  const produtoId = row.querySelector('.produto-id-cell') ? row.querySelector('.produto-id-cell').textContent : row.querySelector('.produto-id-input') ? row.querySelector('.produto-id-input').value : '';
  const quantidade = row.querySelector('.quantidade-input').value;
  const precoUnitario = row.querySelector('.preco-input').value;

  const itemData = {
    pedido_id_pedido: parseInt(pedidoId),
    produto_id_produto: parseInt(produtoId),
    quantidade: parseInt(quantidade),
    preco_unitario: parseFloat(String(precoUnitario).replace(',', '.'))
  };

  if (isNaN(itemData.pedido_id_pedido) || isNaN(itemData.produto_id_produto) || isNaN(itemData.quantidade) || isNaN(itemData.preco_unitario)) {
    mostrarMensagem('Dados do item inválidos', 'warning');
    return;
  }

  // A API usa POST para inserir/atualizar produtos do pedido
  console.debug('POST /pedido/produtos (atualizar) payload:', itemData);
  fetch(`${API_BASE_URL}/pedido/produtos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itemData)
  })
    .then(async res => {
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `Erro ao atualizar item (status ${res.status})`);
      }
      return res.json();
    })
    .then(data => {
      mostrarMensagem('Item atualizado com sucesso', 'success');
      // Recarregar itens
      carregarItensDoPedido(itemData.pedido_id_pedido);
    })
    .catch(err => {
      console.error('Erro ao atualizar item:', err);
      mostrarMensagem(err.message || 'Erro ao atualizar item', 'error');
    });
}

// Excluir item (DELETE /pedido/produtos/:pedidoId/:produtoId)
function btnExcluirItem(button) {
  const row = button.closest('tr');
  if (!row) return;
  const pedidoId = row.querySelector('.pedido-id-cell').textContent;
  const produtoId = row.querySelector('.produto-id-cell').textContent;

  if (!confirm(`Confirma excluir o item ${produtoId} do pedido ${pedidoId}?`)) return;

  fetch(`${API_BASE_URL}/pedido/produtos/${pedidoId}/${produtoId}`, {
    method: 'DELETE'
  })
    .then(res => {
      if (res.ok) {
        row.remove();
        mostrarMensagem('Item excluído com sucesso', 'success');
        carregarPedidos();
      } else if (res.status === 404) {
        mostrarMensagem('Item não encontrado', 'error');
      } else {
        throw new Error('Erro ao excluir item');
      }
    })
    .catch(err => {
      console.error(err);
      mostrarMensagem('Erro ao excluir item', 'error');
    });
}

// ========= PEDIDO CRUD (inclui inclusão/alteração/exclusão) =========

// Incluir novo pedido (prepara formulário)
function incluirPedido() {
  mostrarMensagem('Preencha os dados para incluir o pedido', 'info');
  // manter o valor do searchId se o usuário digitou
  const lastSearch = inputSearchId ? inputSearchId.value : '';
  limparFormulario();
  if (inputSearchId) inputSearchId.value = lastSearch;
  bloquearCampos(true);
  mostrarBotoes(false, false, false, false, true, true);
  operacao = 'incluir';
  if (inputDataPedido) inputDataPedido.focus();
}

// Alterar pedido (prepara para edição)
// Corrigido: se o usuário digitou o ID no campo de busca, tentamos buscar o pedido antes de habilitar a edição
async function alterarPedido() {
  if (!currentPedidoId && inputSearchId && inputSearchId.value.trim()) {
    // tenta buscar o pedido informando o campo; isso definirá currentPedidoId via preencherFormulario
    await buscarPedido();
  }
  if (!currentPedidoId) {
    mostrarMensagem('Nenhum pedido selecionado para alterar', 'warning');
    return;
  }
  mostrarMensagem('Altere os dados e salve', 'info');
  bloquearCampos(true);
  mostrarBotoes(false, false, false, false, true, true);
  operacao = 'alterar';
  if (inputDataPedido) inputDataPedido.focus();
}

// Preparar exclusão (apenas marca operação, real excluí na salvarOperacao)
function excluirPedido() {
  if (!currentPedidoId && inputSearchId && inputSearchId.value.trim()) {
    currentPedidoId = inputSearchId.value.trim();
  }
  if (!currentPedidoId) {
    mostrarMensagem('Nenhum pedido selecionado para excluir', 'warning');
    return;
  }
  mostrarMensagem('Confirme exclusão clicando em Salvar', 'warning');
  // desabilitar campos
  bloquearCampos(false);
  if (inputSearchId) inputSearchId.disabled = true;
  mostrarBotoes(false, false, false, false, true, true);
  operacao = 'excluir';
}

// Confirmar exclusão rápida (botão na tabela)
function confirmExcluirPedido(id) {
  if (!confirm(`Deseja realmente excluir o pedido ${id}?`)) return;
  fetch(`${API_BASE_URL}/pedido/${id}`, { method: 'DELETE' })
    .then(res => {
      if (res.ok) {
        mostrarMensagem('Pedido excluído com sucesso', 'success');
        carregarPedidos();
      } else {
        throw new Error('Erro ao excluir pedido');
      }
    })
    .catch(err => {
      console.error(err);
      mostrarMensagem('Erro ao excluir pedido', 'error');
    });
}

// Salvar operação: incluir / alterar / excluir
async function salvarOperacao() {
  console.log('Operação:', operacao, 'currentPedidoId:', currentPedidoId, 'searchId:', inputSearchId ? inputSearchId.value : '');
  
  if (!form) {
    mostrarMensagem('Formulário não encontrado', 'error');
    return;
  }

  const formData = new FormData(form);
  
  // Mapeamento: backend espera id_cliente (numérico), id_funcionario (numérico), data_do_pedido
  const pedido = {
    id_pedido: (inputSearchId && inputSearchId.value) || currentPedidoId || null,
    data_do_pedido: formData.get('data_pedido') || (inputDataPedido ? inputDataPedido.value : null),
    id_cliente: formData.get('cliente_pessoa_cpf_pessoa') || (inputCliente ? inputCliente.value : null),
    id_funcionario: formData.get('funcionario_pessoa_cpf_pessoa') || (inputFuncionario ? inputFuncionario.value : null),
  };

  try {
    let response = null;
    
    if (operacao === 'incluir') {
      // garante que os IDs enviados sejam numéricos (backend espera id_cliente e id_funcionario como números)
      const payload = {
        data_do_pedido: pedido.data_do_pedido || null,
        id_cliente: pedido.id_cliente ? parseInt(pedido.id_cliente) : null,
        id_funcionario: pedido.id_funcionario ? parseInt(pedido.id_funcionario) : null
      };
      console.debug('POST /pedido payload:', payload);
      response = await fetch(`${API_BASE_URL}/pedido`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const novo = await response.json();
        mostrarMensagem('Pedido incluído com sucesso!', 'success');
        currentPedidoId = novo.id_pedido || currentPedidoId;
      } else {
        const errBody = await response.json().catch(() => ({}));
        mostrarMensagem(errBody.error || 'Erro ao incluir pedido', 'error');
      }
    } 
    else if (operacao === 'alterar') {
      const idToPut = currentPedidoId || pedido.id_pedido;
      if (!idToPut) {
        mostrarMensagem('ID do pedido não informado para alteração', 'warning');
        return;
      }

      // Monta payload apenas com campos preenchidos
      const payload = {};
      if (pedido.data_do_pedido) payload.data_do_pedido = pedido.data_do_pedido;
      if (pedido.id_cliente) payload.id_cliente = parseInt(pedido.id_cliente) || undefined;
      if (pedido.id_funcionario) payload.id_funcionario = parseInt(pedido.id_funcionario) || undefined;

      // Remove campos undefined
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

      if (Object.keys(payload).length === 0) {
        mostrarMensagem('Nenhum campo para alterar', 'warning');
        return;
      }

      console.debug('PUT /pedido/' + idToPut, 'payload:', payload);
      response = await fetch(`${API_BASE_URL}/pedido/${idToPut}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        mostrarMensagem('Pedido alterado com sucesso!', 'success');
      } else {
        try {
          const errBody = await response.json();
          console.error('Erro PUT (json):', errBody);
          mostrarMensagem(errBody.error || JSON.stringify(errBody), 'error');
        } catch (e) {
          const txt = await response.text().catch(() => '');
          console.error('Erro PUT (text):', txt);
          mostrarMensagem(txt || 'Erro ao alterar pedido', 'error');
        }
      }
    } 
    else if (operacao === 'excluir') {
      const idToDel = currentPedidoId || pedido.id_pedido;
      if (!idToDel) {
        mostrarMensagem('ID do pedido não informado para exclusão', 'warning');
        return;
      }
      response = await fetch(`${API_BASE_URL}/pedido/${idToDel}`, { method: 'DELETE' });
      if (response.ok) {
        mostrarMensagem('Pedido excluído com sucesso!', 'success');
        limparFormulario();
      } else {
        mostrarMensagem('Erro ao excluir pedido', 'error');
      }
    } 
    else {
      mostrarMensagem('Nenhuma operação selecionada', 'warning');
    }

    // Recarrega após operação
    carregarPedidos();
    if (currentPedidoId) carregarItensDoPedido(currentPedidoId);

    // Reset UI
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    operacao = null;
  } catch (err) {
    console.error('Erro salvarOperacao:', err);
    mostrarMensagem('Erro na operação', 'error');
  }
}

// Cancelar operação em andamento
function cancelarOperacao() {
  limparFormulario();
  mostrarBotoes(true, false, false, false, false, false);
  bloquearCampos(false);
  if (inputSearchId) inputSearchId.focus();
  mostrarMensagem('Operação cancelada', 'info');
}

// Selecionar pedido (usado nos botões da tabela) -> preencher e buscar itens
async function selecionarPedido(id) {
  if (!id) return;
  if (inputSearchId) inputSearchId.value = id;
  await buscarPedido();
}

// ========= carregar produtos para select (opcional) =========
async function carregarProdutosParaSelect() {
  try {
    const res = await fetch(`${API_BASE_URL}/produto`);
    if (!res.ok) return;
    const produtos = await res.json();
    if (!produtoSelect) return;
    produtoSelect.innerHTML = `<option value="">Selecione um produto</option>`;
    produtos.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id_produto || p.id || p.codigo || '';
      const preco = (p.preco_unitario !== undefined) ? p.preco_unitario : (p.preco || 0);
      opt.textContent = `${p.nome_produto || p.nome || 'Produto'} - R$ ${Number(preco).toFixed(2)}`;
      produtoSelect.appendChild(opt);
    });
  } catch (err) {
    // silencioso se rota inexistente
  }
}

// Função utilitária para calcular valor total do pedido (somando subtotais)
function calcularValorTotalDaListaItens(itens) {
  if (!Array.isArray(itens)) return 0;
  return itens.reduce((acc, it) => {
    const q = parseFloat(it.quantidade) || 0;
    const p = parseFloat(it.preco_unitario || it.preco || 0) || 0;
    return acc + (q * p);
  }, 0);
}

// =======================
// Busca dinâmica do funcionário (por nome ou id)
// =======================

let _funcionariosParaBusca = []; // array { id, nome }
let _funcResultsContainer = null;

async function initBuscaDinamicaFuncionario() {
  if (!inputFuncionario) return;
  if (!document.getElementById('funcResultsContainer')) {
    const wrapper = document.createElement('div');
    wrapper.className = 'search-bar-container';
    wrapper.style.position = 'relative';
    inputFuncionario.parentNode.insertBefore(wrapper, inputFuncionario.nextSibling);
    const ul = document.createElement('ul');
    ul.id = 'funcResultsContainer';
    ul.style.position = 'absolute';
    ul.style.top = '100%';
    ul.style.left = '0';
    ul.style.right = '0';
    ul.style.maxHeight = '180px';
    ul.style.overflowY = 'auto';
    ul.style.background = '#fff';
    ul.style.border = '1px solid #ccc';
    ul.style.padding = '0';
    ul.style.margin = '4px 0 0 0';
    ul.style.listStyle = 'none';
    ul.style.zIndex = '1000';
    ul.className = 'search-results-list';
    ul.style.display = 'none';
    wrapper.appendChild(ul);
    _funcResultsContainer = ul;
  } else {
    _funcResultsContainer = document.getElementById('funcResultsContainer');
  }

  // Busca os funcionários do backend - rota /funcionario
  try {
    const res = await fetch(`${API_BASE_URL}/funcionario`);
    if (!res.ok) {
      console.warn('Rota /funcionario não disponível para busca dinâmica de funcionário.');
      _funcionariosParaBusca = [];
      return;
    }
    const dados = await res.json();
    // normaliza dados para { id, nome }
    _funcionariosParaBusca = (Array.isArray(dados) ? dados : [dados]).map(item => ({
      id: item.id_pessoa || item.id || item.id_funcionario || null,
      nome: item.nome_pessoa || item.nome || item.nome_funcionario || ''
    })).filter(x => x.id || x.nome);
  } catch (err) {
    console.error('Erro ao carregar funcionários para busca dinâmica:', err);
    _funcionariosParaBusca = [];
  }

  // eventos no inputFuncionario
  inputFuncionario.addEventListener('input', _onInputFuncionario);
  inputFuncionario.addEventListener('focus', _onInputFuncionario);
  // hide ao clicar fora
  document.addEventListener('click', (ev) => {
    if (!ev.target.closest('.search-bar-container')) {
      hideFuncResults();
    }
  });
}

function _onInputFuncionario() {
  const q = (inputFuncionario.value || '').trim().toLowerCase();
  if (!q) {
    hideFuncResults();
    return;
  }
  const isDigits = /^\d+$/.test(q) && q.length > 0;
  let filtered = [];
  if (isDigits) {
    // pesquisar por id
    filtered = _funcionariosParaBusca.filter(f => String(f.id || '').includes(q));
  } else {
    // pesquisar por nome
    filtered = _funcionariosParaBusca.filter(f => (f.nome || '').toLowerCase().includes(q));
  }
  renderFuncResults(filtered);
}

function renderFuncResults(list) {
  if (!_funcResultsContainer) return;
  _funcResultsContainer.innerHTML = '';
  if (!list || list.length === 0) {
    hideFuncResults();
    return;
  }
  list.forEach(item => {
    const li = document.createElement('li');
    li.style.padding = '6px 8px';
    li.style.cursor = 'pointer';
    li.style.borderBottom = '1px solid #eee';
    li.innerHTML = `<strong>${escapeHtml(item.nome)}</strong> <small>(id:${escapeHtml(String(item.id))})</small>`;
    li.addEventListener('click', () => {
      // Ao selecionar, gravar o ID no campo (o backend espera id_funcionario)
      inputFuncionario.value = item.id || '';
      inputFuncionario.setAttribute('data-nome', item.nome || '');
      hideFuncResults();
    });
    _funcResultsContainer.appendChild(li);
  });
  _funcResultsContainer.style.display = 'block';
}

function hideFuncResults() {
  if (!_funcResultsContainer) return;
  _funcResultsContainer.innerHTML = '';
  _funcResultsContainer.style.display = 'none';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"'`=\/]/g, function (s) {
    return ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
      "'": '&#39;', '`': '&#x60;', '=': '&#x3D;', '/': '&#x2F;'
    })[s];
  });
}

// Expor algumas funções no window para poder chamar via onclick inline
window.adicionarItem = adicionarItem;
window.buscarProdutoPorId = buscarProdutoPorId;
window.btnAdicionarItem = btnAdicionarItem;
window.btnCancelarItem = btnCancelarItem;
window.btnAtualizarItem = btnAtualizarItem;
window.btnExcluirItem = btnExcluirItem;
window.selecionarPedido = selecionarPedido;
window.confirmExcluirPedido = confirmExcluirPedido;
window.carregarPedidos = carregarPedidos;
window.carregarItensDoPedido = carregarItensDoPedido;
window.salvarOperacao = salvarOperacao;
window.incluirPedido = incluirPedido;
window.alterarPedido = alterarPedido;
window.excluirPedido = excluirPedido;
window.cancelarOperacao = cancelarOperacao;
window.buscarPedido = buscarPedido;
