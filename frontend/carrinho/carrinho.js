// frontend/carrinho/carrinho.js
const API_BASE_URL = 'http://localhost:3001';
const FUNCIONARIO_ONLINE_ID = 100; // vendedor online fixo

document.addEventListener('DOMContentLoaded', async () => {
  const cartItemsContainer = document.getElementById('cart-items');
  const totalPriceElement = document.getElementById('total-price');
  const totalItemsElement = document.getElementById('total-items');
  const orderDateElement = document.getElementById('order-date');
  const funcionarioWrapper = document.querySelector('.add-funcionario');
  const backButton = document.getElementById('back-button');
  const finalizeButton = document.getElementById('finalize-button');

  // Oculta o seletor de funcionário
  if (funcionarioWrapper) {
    funcionarioWrapper.style.display = 'none';
  }

  // Helper: pega dados do usuário logado (status, id_pessoa, id_pedido_atual)
  async function getUsuarioLogado() {
    try {
      const res = await fetch(`${API_BASE_URL}/login/verificaSeUsuarioEstaLogado`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (data && data.status === 'ok') return data;
      return null;
    } catch (err) {
      console.error('Erro ao obter usuário logado:', err);
      return null;
    }
  }

  // Função: garantir pedido válido (NÃO CRIA automaticamente; só retorna se já existe)
  async function garantirPedidoValidoFront() {
    try {
      const data = await getUsuarioLogado();
      if (!data) return null;
      const pedidoId = data.id_pedido_atual;
      if (pedidoId) {
        // verifica se o pedido realmente existe (GET /pedido/:id)
        const pedidoRes = await fetch(`${API_BASE_URL}/pedido/${pedidoId}`);
        if (pedidoRes.ok) return pedidoId;
      }
      // NÃO CRIAR AQUI — criação será feita no envio do primeiro item
      return null;
    } catch (err) {
      console.error('Erro ao garantir pedido válido:', err);
      return null;
    }
  }

  // ------------ FUNÇÃO DE ENVIAR ITEM (CORRIGIDA E MELHORADA) -----------
  /**
   * Envia uma atualização de item para o backend.
   * Se idPedido for nulo/undefined, cria um pedido para o usuário (uma só vez),
   * atualiza pessoa.id_pedido_atual e passa a usar esse id.
   *
   * Retorno:
   * - número do idPedido usado em caso de sucesso (ex: 116)
   * - false em caso de erro
   */
  async function enviarAtualizacaoItem(idPedido, idTenis, quantidade, precoUnitario) {
    try {
      if (idTenis == null || quantidade == null || precoUnitario == null) {
        console.error("Dados incompletos ao atualizar item:", { idTenis, quantidade, precoUnitario });
        return false;
      }

      // Se não houver idPedido, criamos um (apenas no primeiro envio)
      let currentPedidoId = idPedido;
      if (!currentPedidoId) {
        // pega usuário logado
        const usuario = await getUsuarioLogado();
        if (!usuario) {
          console.error('Usuário não está logado; não é possível criar pedido.');
          return false;
        }

        // Cria pedido no backend
        const criarRes = await fetch(`${API_BASE_URL}/pedido`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            data_do_pedido: new Date().toISOString().split('T')[0],
            id_cliente: usuario.id_pessoa,
            id_funcionario: null
          })
        });

        if (!criarRes.ok) {
          const texto = await criarRes.text();
          console.error('Erro ao criar pedido:', texto);
          return false;
        }

        const novoPedido = await criarRes.json();
        currentPedidoId = novoPedido.id_pedido;

        // Atualiza pessoa.id_pedido_atual para o novo pedido
        await fetch(`${API_BASE_URL}/pessoa/atualizarPedidoAtual`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id_pessoa: usuario.id_pessoa, id_pedido: currentPedidoId })
        });

        console.log('Pedido criado automaticamente e pessoa atualizada. id_pedido:', currentPedidoId);
      }

      // Caso remoção (quantidade 0) — se não houver pedido, nada a remover
      if (quantidade === 0) {
        if (!currentPedidoId) {
          // nada para remover
          return currentPedidoId || true;
        }
        const deleteRes = await fetch(`${API_BASE_URL}/pedido/produtos/${currentPedidoId}/${idTenis}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if (!deleteRes.ok) {
          const errTxt = await deleteRes.text();
          console.error('Erro ao remover item:', errTxt);
          return false;
        }
        return currentPedidoId;
      }

      // Inserção/atualização de item (POST /pedido/produtos)
      const body = {
        id_pedido: currentPedidoId,
        produtos: [
          {
            id_tenis: idTenis,
            quantidade: quantidade,
            preco_unitario: precoUnitario
          }
        ]
      };

      const response = await fetch(`${API_BASE_URL}/pedido/produtos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: 'include'
      });

      if (!response.ok) {
        const erro = await response.text();
        console.error("Erro ao atualizar item:", erro);
        return false;
      }

      // sucesso — retorna o id do pedido usado (útil para quem chamou)
      return currentPedidoId;
    } catch (err) {
      console.error("Erro inesperado em enviarAtualizacaoItem:", err);
      return false;
    }
  }
  // ----------------------------------------------------------------------

  try {
    // Tenta obter id do pedido atual (SE existir). NÃO cria pedido automaticamente.
    let pedidoId = await garantirPedidoValidoFront();
    // pedidoId pode ser null aqui — será criado ao enviar o primeiro item

    // Prioridade: se houver um carrinho temporário em sessionStorage (gravado no índice), preferi-lo.
    const carrinhoSession = JSON.parse(sessionStorage.getItem('carrinho')) || [];

    let itemsState = [];
    if (carrinhoSession.length > 0) {
      // Usar o carrinho salvo localmente; não enviar ainda ao backend.
      itemsState = carrinhoSession.map(it => ({ ...it }));
    } else {
      // Se não há carrinho local, tentar ler do pedido atual no backend (se existir)
      let cartItems = [];
      if (pedidoId) {
        const response = await fetch(`${API_BASE_URL}/pedido/produtos/${pedidoId}`, { credentials: 'include' });
        if (response.ok) cartItems = await response.json();
        else cartItems = [];
      } else {
        cartItems = [];
      }
      itemsState = Array.isArray(cartItems) ? cartItems.slice() : [];
    }

    function recalcularResumo() {
      let totalPrice = 0;
      let totalItems = 0;

      itemsState.forEach(it => {
        totalPrice += (it.preco_unitario * it.quantidade);
        totalItems += it.quantidade;
      });

      totalPriceElement.textContent = `Total a pagar: R$ ${totalPrice.toFixed(2)}`;
      totalItemsElement.textContent = `Itens: ${totalItems}`;
      orderDateElement.textContent = `Data: ${new Date().toLocaleString()}`;
    }

    function criarItemElement(item) {
      const itemElement = document.createElement('div');
      itemElement.classList.add('cart-item');
      itemElement.dataset.idTenis = item.id_tenis;

      const nome = document.createElement('p');
      nome.innerText = `${item.nome_tenis}`;
      nome.classList.add('cart-item-name');

      const quantidadeWrap = document.createElement('div');
      quantidadeWrap.classList.add('cart-qty-wrap');

      const btnMinus = document.createElement('button');
      btnMinus.classList.add('btn-minus');
      btnMinus.innerText = '-';

      const qtyDisplay = document.createElement('span');
      qtyDisplay.classList.add('qty-display');
      qtyDisplay.innerText = item.quantidade;

      const btnPlus = document.createElement('button');
      btnPlus.classList.add('btn-plus');
      btnPlus.innerText = '+';

      const preco = document.createElement('p');
      preco.classList.add('cart-item-price');
      preco.innerText = `R$ ${(item.preco_unitario * item.quantidade).toFixed(2)}`;

      const btnRemove = document.createElement('button');
      btnRemove.classList.add('btn-remove');
      btnRemove.innerText = 'Remover';

      quantidadeWrap.appendChild(btnMinus);
      quantidadeWrap.appendChild(qtyDisplay);
      quantidadeWrap.appendChild(btnPlus);

      itemElement.appendChild(nome);
      itemElement.appendChild(quantidadeWrap);
      itemElement.appendChild(preco);
      itemElement.appendChild(btnRemove);

      // Botão +
      btnPlus.addEventListener('click', () => {
        const novoQ = parseInt(qtyDisplay.innerText) + 1;
        qtyDisplay.innerText = novoQ;
        item.quantidade = novoQ;
        const idx = itemsState.findIndex(x => x.id_tenis === item.id_tenis);
        if (idx >= 0) itemsState[idx].quantidade = novoQ;
        else itemsState.push({ id_tenis: item.id_tenis, quantidade: novoQ, preco_unitario: item.preco_unitario });

        // atualiza sessionStorage
        sessionStorage.setItem('carrinho', JSON.stringify(itemsState));

        preco.innerText = `R$ ${(item.preco_unitario * novoQ).toFixed(2)}`;
        recalcularResumo();
      });

      // Botão -
      btnMinus.addEventListener('click', () => {
        const atual = parseInt(qtyDisplay.innerText);
        const novoQ = Math.max(0, atual - 1);

        if (novoQ === 0) {
          itemElement.remove();
          itemsState = itemsState.filter(x => x.id_tenis !== item.id_tenis);
        } else {
          qtyDisplay.innerText = novoQ;
          item.quantidade = novoQ;
          const idx = itemsState.findIndex(x => x.id_tenis === item.id_tenis);
          if (idx >= 0) itemsState[idx].quantidade = novoQ;
        }

        // atualiza sessionStorage
        sessionStorage.setItem('carrinho', JSON.stringify(itemsState));

        if (novoQ !== 0) preco.innerText = `R$ ${(item.preco_unitario * novoQ).toFixed(2)}`;
        recalcularResumo();
      });

      // Botão REMOVER
      btnRemove.addEventListener('click', () => {
        const confirmar = confirm(`Remover ${item.nome_tenis} do carrinho?`);
        if (!confirmar) return;

        itemElement.remove();
        itemsState = itemsState.filter(x => x.id_tenis !== item.id_tenis);
        sessionStorage.setItem('carrinho', JSON.stringify(itemsState));
        recalcularResumo();
      });

      return itemElement;
    }

    // Render inicial
    cartItemsContainer.innerHTML = '';
    itemsState.forEach(it => {
      cartItemsContainer.appendChild(criarItemElement(it));
    });

    recalcularResumo();

    backButton.addEventListener('click', () => {
      window.location.href = 'http://localhost:3001/';
    });

    finalizeButton.addEventListener('click', async () => {
      const usuario = await getUsuarioLogado();
      if (!usuario) {
        alert('Você precisa estar logado para finalizar o pedido.');
        return;
      }

      // Prioriza o carrinho em sessionStorage (modificações feitas na UI)
      const carrinhoSession = JSON.parse(sessionStorage.getItem('carrinho')) || [];
      const produtosASalvar = (carrinhoSession.length > 0 ? carrinhoSession : itemsState).map(it => ({
        id_tenis: parseInt(it.id_tenis),
        quantidade: parseInt(it.quantidade),
        preco_unitario: parseFloat(it.preco_unitario)
      })).filter(p => p.quantidade > 0);

      if (produtosASalvar.length === 0) {
        alert('O carrinho está vazio. Adicione itens antes de finalizar.');
        return;
      }

      try {
        // 1) Criar pedido no backend com id_funcionario fixo (100)
        const criar = await fetch(`${API_BASE_URL}/pedido`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            data_do_pedido: new Date().toISOString().split('T')[0],
            id_cliente: usuario.id_pessoa,
            id_funcionario: FUNCIONARIO_ONLINE_ID
          })
        });

        if (!criar.ok) {
          const txt = await criar.text();
          console.error('Erro ao criar pedido:', txt);
          alert('Erro ao criar pedido. Tente novamente.');
          return;
        }

        const novo = await criar.json();
        const idPedidoAtual = novo.id_pedido;

        // 2) Atualizar pessoa.id_pedido_atual
        await fetch(`${API_BASE_URL}/pessoa/atualizarPedidoAtual`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id_pessoa: usuario.id_pessoa, id_pedido: idPedidoAtual })
        });

        // 3) Inserir os produtos no pedido (POST /pedido/produtos)
        const salvarRes = await fetch(`${API_BASE_URL}/pedido/produtos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id_pedido: idPedidoAtual, produtos: produtosASalvar })
        });

        if (!salvarRes.ok) {
          const txt = await salvarRes.text();
          console.error('Erro ao salvar produtos no pedido:', txt);
          alert('Erro ao salvar os itens. Tente novamente.');
          return;
        }

        // 4) Opcional: finalizar/associar funcionario — já criamos com id_funcionario
        // Limpar sessionStorage e redirecionar para página de confirmação
        sessionStorage.removeItem('carrinho');
        window.location.href = 'http://localhost:3001/carrinho/finalizar';
      } catch (err) {
        console.error('Erro ao finalizar compra:', err);
        alert('Erro ao finalizar compra. Tente novamente.');
      }
    });

  } catch (error) {
    console.error('Erro ao carregar carrinho:', error);
    alert('Erro ao carregar carrinho.');
  }
});
