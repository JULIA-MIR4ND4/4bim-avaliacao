// frontend/carrinho/carrinho.js
const API_BASE_URL = 'http://localhost:3001';
const FUNCIONARIO_ONLINE_ID = 100; // vendedor online fixo

document.addEventListener('DOMContentLoaded', async () => {
  const cartItemsContainer = document.getElementById('cart-items');
  const totalPriceElement = document.getElementById('total-price');
  const totalItemsElement = document.getElementById('total-items');
  const orderDateElement = document.getElementById('order-date');
  const funcionarioWrapper = document.querySelector('.add-funcionario');
  const funcionarioSelect = document.getElementById('funcionario');
  const backButton = document.getElementById('back-button');
  const finalizeButton = document.getElementById('finalize-button');

  // Oculta o seletor de funcionário, pois será fixo (ID 100)
  if (funcionarioWrapper) {
    funcionarioWrapper.style.display = 'none';
  }

  // Helper: garante que existe um pedido válido (mesma lógica do index.js)
  async function garantirPedidoValidoFront() {
    try {
      const res = await fetch(`${API_BASE_URL}/login/verificaSeUsuarioEstaLogado`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.status !== 'ok') return null;

      // Verifica se pedido existe
      let pedidoId = data.id_pedido_atual;
      if (pedidoId) {
        const pedidoRes = await fetch(`${API_BASE_URL}/pedido/${pedidoId}`);
        if (pedidoRes.ok) return pedidoId;
      }

      // Se não existe, criar e atualizar a pessoa
      const criarRes = await fetch(`${API_BASE_URL}/pedido`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_do_pedido: new Date().toISOString().split('T')[0],
          id_cliente: data.id_pessoa,
          id_funcionario: null
        }),
        credentials: 'include'
      });
      if (!criarRes.ok) return null;
      const novoPedido = await criarRes.json();
      const novoId = novoPedido.id_pedido;

      // Atualiza pessoa
      await fetch(`${API_BASE_URL}/pessoa/atualizarPedidoAtual`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_pessoa: data.id_pessoa, id_pedido: novoId }),
        credentials: 'include'
      });

      return novoId;
    } catch (err) {
      console.error('Erro ao garantir pedido válido:', err);
      return null;
    }
  }

  // ======= FUNÇÃO CORRIGIDA (ÚNICA ALTERAÇÃO DO ARQUIVO) =======
  // ======= FUNÇÃO CORRIGIDA (ÚNICA ALTERAÇÃO DO ARQUIVO) =======
async function enviarAtualizacaoItem(idPedido, idTenis, quantidade, precoUnitario) {

    // Evita enviar dados incompletos para o backend
    if (idTenis == null || quantidade == null || precoUnitario == null) {
        console.error("Dados incompletos ao atualizar item:", { idTenis, quantidade, precoUnitario });
        return false;
    }

    // 👉 NOVO: se quantidade = 0, CHAMAR DELETE (rota correta do backend)
    if (quantidade === 0) {
        try {
            const response = await fetch(
                `http://localhost:3001/pedido/produtos/${idPedido}/${idTenis}`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                const erro = await response.text();
                console.error("Erro ao remover item:", erro);
                return false;
            }

            return true;

        } catch (err) {
            console.error("Erro inesperado ao remover item:", err);
            return false;
        }
    }

    // 👉 Mantém o POST existente para adicionar / atualizar
    const body = {
        id_pedido: idPedido,
        produtos: [
            {
                id_tenis: idTenis,
                quantidade: quantidade,
                preco_unitario: precoUnitario
            }
        ]
    };

    try {
        const response = await fetch("http://localhost:3001/pedido/produtos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const erro = await response.text();
            console.error("Erro ao atualizar item:", erro);
            return false;
        }

        return true;

    } catch (err) {
        console.error("Erro inesperado:", err);
        return false;
    }
}
// =============================================================

  // =============================================================


  try {
    const pedidoId = await garantirPedidoValidoFront();
    if (!pedidoId) {
      throw new Error('Não foi possível garantir um pedido válido para exibir o carrinho.');
    }

    // Busca itens do pedido
    const response = await fetch(`${API_BASE_URL}/pedido/produtos/${pedidoId}`, { credentials: 'include' });
    let cartItems = [];
    if (response.ok) {
      cartItems = await response.json();
    } else {
      cartItems = []; // pedido vazio
    }

    let itemsState = Array.isArray(cartItems) ? cartItems.slice() : [];

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

      // BOTÃO +
      btnPlus.addEventListener('click', async () => {
        const novoQ = parseInt(qtyDisplay.innerText) + 1;

        const success = await enviarAtualizacaoItem(
          pedidoId,
          item.id_tenis,
          novoQ,
          item.preco_unitario
        );
        if (!success) return;

        qtyDisplay.innerText = novoQ;
        item.quantidade = novoQ;
        const idx = itemsState.findIndex(x => x.id_tenis === item.id_tenis);
        if (idx >= 0) itemsState[idx].quantidade = novoQ;
        preco.innerText = `R$ ${(item.preco_unitario * novoQ).toFixed(2)}`;
        recalcularResumo();
      });

      // BOTÃO –
      btnMinus.addEventListener('click', async () => {
        const atual = parseInt(qtyDisplay.innerText);
        const novoQ = Math.max(0, atual - 1);

        const success = await enviarAtualizacaoItem(
          pedidoId,
          item.id_tenis,
          novoQ,
          item.preco_unitario
        );
        if (!success) return;

        if (novoQ === 0) {
          itemElement.remove();
          itemsState = itemsState.filter(x => x.id_tenis !== item.id_tenis);
        } else {
          qtyDisplay.innerText = novoQ;
          item.quantidade = novoQ;
          const idx = itemsState.findIndex(x => x.id_tenis === item.id_tenis);
          if (idx >= 0) itemsState[idx].quantidade = novoQ;
          preco.innerText = `R$ ${(item.preco_unitario * novoQ).toFixed(2)}`;
        }
        recalcularResumo();
      });

      // BOTÃO REMOVER (CORRIGIDO)
      btnRemove.addEventListener('click', async () => {
        const confirmar = confirm(`Remover ${item.nome_tenis} do carrinho?`);
        if (!confirmar) return;

        const success = await enviarAtualizacaoItem(
          pedidoId,
          item.id_tenis,
          0,
          item.preco_unitario
        );
        if (!success) return;

        itemElement.remove();
        itemsState = itemsState.filter(x => x.id_tenis !== item.id_tenis);
        recalcularResumo();
      });

      return itemElement;
    }

    // Render inicial
    cartItemsContainer.innerHTML = '';
    itemsState.forEach(it => {
      const el = criarItemElement(it);
      cartItemsContainer.appendChild(el);
    });
    recalcularResumo();

    backButton.addEventListener('click', () => {
      window.location.href = 'http://localhost:3001/';
    });

    finalizeButton.addEventListener('click', async () => {
      const finalizeResponse = await fetch(`${API_BASE_URL}/login/verificaSeUsuarioEstaLogado`, {
        method: 'POST',
        credentials: 'include'
      });
      const userData = await finalizeResponse.json();
      if (userData.status !== 'ok') {
        alert('Você precisa estar logado para finalizar o pedido.');
        return;
      }

      let idPedidoAtual = userData.id_pedido_atual;
      if (!idPedidoAtual) {
        const criar = await fetch(`${API_BASE_URL}/pedido`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            data_do_pedido: new Date().toISOString().split('T')[0],
            id_cliente: userData.id_pessoa,
            id_funcionario: null
          })
        });
        if (!criar.ok) {
          alert('Erro ao criar pedido para finalização.');
          return;
        }
        const novo = await criar.json();
        idPedidoAtual = novo.id_pedido;
        await fetch(`${API_BASE_URL}/pessoa/atualizarPedidoAtual`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id_pessoa: userData.id_pessoa, id_pedido: idPedidoAtual })
        });
      }

      const finalizeResponse2 = await fetch(`${API_BASE_URL}/pedido/${idPedidoAtual}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ id_funcionario: FUNCIONARIO_ONLINE_ID })
      });

      if (finalizeResponse2.ok) {
          window.location.href = 'http://localhost:3001/carrinho/finalizar';
      } else {
          alert('Erro ao finalizar compra.');
      }
    });

  } catch (error) {
    console.error('Erro ao carregar carrinho:', error);
    alert('Erro ao carregar carrinho. Atualize a página e tente novamente.');
  }
});
