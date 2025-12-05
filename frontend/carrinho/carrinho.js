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

    // Carrega itens do sessionStorage (itens adicionados pelo usuário antes de finalizar)
    const rawCarrinho = sessionStorage.getItem("carrinho");
    let carrinhoLocal = [];
    try {
      carrinhoLocal = rawCarrinho ? JSON.parse(rawCarrinho) : [];
    } catch (e) {
      console.warn('Erro ao parsear sessionStorage.carrinho:', e, 'raw:', rawCarrinho);
      carrinhoLocal = [];
    }

    let cartItems = [];
    let localOnly = false; // se true, operamos apenas no sessionStorage até finalizar

    if (Array.isArray(carrinhoLocal) && carrinhoLocal.length > 0) {
      // Preferimos mostrar os itens que o usuário adicionou localmente e NÃO enviamos ao backend ainda
      console.debug('Usando itens do sessionStorage (ainda não persistidos):', carrinhoLocal);
      cartItems = carrinhoLocal.map(it => ({
        id_tenis: it.id_tenis,
        nome_tenis: it.nome_tenis || `Produto ${it.id_tenis}`,
        quantidade: it.quantidade,
        preco_unitario: it.preco_unitario
      }));
      localOnly = true;
    } else if (pedidoId) {
      // Se não há itens locais e existe um pedido vinculado, carregue do backend
      const response = await fetch(`${API_BASE_URL}/pedido/produtos/${pedidoId}`, { credentials: 'include' });
      if (response.ok) cartItems = await response.json();
      else cartItems = [];
      console.debug('Itens obtidos do backend para pedidoId=', pedidoId, '=>', cartItems);
      localOnly = false;
    } else {
      cartItems = [];
      console.debug('Nenhum item no sessionStorage e sem pedido existente.');
      localOnly = true;
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

      // Botão +
      btnPlus.addEventListener('click', async () => {
        const novoQ = parseInt(qtyDisplay.innerText) + 1;

        if (typeof localOnly !== 'undefined' && localOnly) {
          // atualiza apenas localmente e no sessionStorage
          qtyDisplay.innerText = novoQ;
          item.quantidade = novoQ;
          const idx = itemsState.findIndex(x => x.id_tenis === item.id_tenis);
          if (idx >= 0) itemsState[idx].quantidade = novoQ;
          try {
            sessionStorage.setItem('carrinho', JSON.stringify(itemsState.map(it => ({ id_tenis: it.id_tenis, quantidade: it.quantidade, preco_unitario: it.preco_unitario, nome_tenis: it.nome_tenis }))));
          } catch (e) { console.warn('Falha ao atualizar sessionStorage no +:', e); }
          preco.innerText = `R$ ${(item.preco_unitario * novoQ).toFixed(2)}`;
          recalcularResumo();
          return;
        }

        const result = await enviarAtualizacaoItem(pedidoId, item.id_tenis, novoQ, item.preco_unitario);
        if (!result) return;
        if (typeof result === 'number') pedidoId = result;

        qtyDisplay.innerText = novoQ;
        item.quantidade = novoQ;
        const idx = itemsState.findIndex(x => x.id_tenis === item.id_tenis);
        if (idx >= 0) itemsState[idx].quantidade = novoQ;

        preco.innerText = `R$ ${(item.preco_unitario * novoQ).toFixed(2)}`;
        recalcularResumo();
      });

      // Botão -
      btnMinus.addEventListener('click', async () => {
        const atual = parseInt(qtyDisplay.innerText);
        const novoQ = Math.max(0, atual - 1);

        if (typeof localOnly !== 'undefined' && localOnly) {
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
          try {
            sessionStorage.setItem('carrinho', JSON.stringify(itemsState.map(it => ({ id_tenis: it.id_tenis, quantidade: it.quantidade, preco_unitario: it.preco_unitario, nome_tenis: it.nome_tenis }))));
          } catch (e) { console.warn('Falha ao atualizar sessionStorage no -:', e); }
          recalcularResumo();
          return;
        }

        const result = await enviarAtualizacaoItem(pedidoId, item.id_tenis, novoQ, item.preco_unitario);
        if (!result) return;
        if (typeof result === 'number') pedidoId = result;

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

      // Botão REMOVER
      btnRemove.addEventListener('click', async () => {
        const confirmar = confirm(`Remover ${item.nome_tenis} do carrinho?`);
        if (!confirmar) return;

        if (typeof localOnly !== 'undefined' && localOnly) {
          itemElement.remove();
          itemsState = itemsState.filter(x => x.id_tenis !== item.id_tenis);
          try {
            sessionStorage.setItem('carrinho', JSON.stringify(itemsState.map(it => ({ id_tenis: it.id_tenis, quantidade: it.quantidade, preco_unitario: it.preco_unitario, nome_tenis: it.nome_tenis }))));
          } catch (e) { console.warn('Falha ao atualizar sessionStorage no remover:', e); }
          recalcularResumo();
          return;
        }

        const result = await enviarAtualizacaoItem(pedidoId, item.id_tenis, 0, item.preco_unitario);
        if (!result) return;
        if (typeof result === 'number') pedidoId = result;

        itemElement.remove();
        itemsState = itemsState.filter(x => x.id_tenis !== item.id_tenis);
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

      let idPedidoAtual = usuario.id_pedido_atual;
      // Verifica se o id_pedido_atual retornado pelo login realmente existe no banco.
      if (idPedidoAtual) {
        try {
          const check = await fetch(`${API_BASE_URL}/pedido/${idPedidoAtual}`, { credentials: 'include' });
          if (!check.ok) {
            console.warn('id_pedido_atual inválido/no DB. Limpando referência para criar novo pedido. id_pedido:', idPedidoAtual);
            // limpa no backend a referência de pessoa.id_pedido_atual para evitar reutilizar id inválido
            await fetch(`${API_BASE_URL}/pessoa/atualizarPedidoAtual`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ id_pessoa: usuario.id_pessoa, id_pedido: null })
            });
            idPedidoAtual = null;
          }
        } catch (e) {
          console.error('Erro ao verificar id_pedido_atual:', e);
          idPedidoAtual = null;
        }
      }

      // Se não tiver pedido ainda (ou se o id anterior era inválido), cria um agora e atualiza usuario/pessoa
      if (!idPedidoAtual) {
        const criar = await fetch(`${API_BASE_URL}/pedido`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            data_do_pedido: new Date().toISOString().split('T')[0],
            id_cliente: usuario.id_pessoa,
            id_funcionario: 100
          })
        });
        if (!criar.ok) {
          const txt = await criar.text();
          console.error('Erro ao criar pedido (finalizar):', criar.status, txt);
          alert('Erro ao criar pedido. Veja console do navegador.');
          return;
        }
        const novo = await criar.json();
        idPedidoAtual = novo.id_pedido;

        await fetch(`${API_BASE_URL}/pessoa/atualizarPedidoAtual`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id_pessoa: usuario.id_pessoa, id_pedido: idPedidoAtual })
        });
        console.log('Pedido criado ao finalizar. id_pedido:', idPedidoAtual);
      }

      // Se havia itens apenas no sessionStorage, envie todos agora para o backend
      try {
        if (Array.isArray(itemsState) && itemsState.length > 0) {
          console.log('Iniciando envio/merge de itens locais ao backend. pedidoId:', idPedidoAtual, 'itens locais:', itemsState);

          // Pequeno delay para garantir que o pedido foi commitado no DB
          await new Promise(resolve => setTimeout(resolve, 500));

          // 1) Busca itens já existentes no pedido (se houver)
          let existingItems = [];
          try {
            const existingRes = await fetch(`${API_BASE_URL}/pedido/produtos/${idPedidoAtual}`, { credentials: 'include' });
            if (existingRes.ok) existingItems = await existingRes.json();
            else existingItems = [];
          } catch (e) {
            console.warn('Não foi possível buscar itens existentes do pedido (continua com itens locais):', e);
            existingItems = [];
          }

          // 2) Mescla existingItems e itemsState somando quantidades quando id_tenis coincidir
          const mergedMap = new Map();
          const pushToMap = (it) => {
            const id = parseInt(it.id_tenis);
            const qtd = parseInt(it.quantidade) || 0;
            const preco = parseFloat(it.preco_unitario) || 0;
            if (!mergedMap.has(id)) mergedMap.set(id, { id_tenis: id, quantidade: qtd, preco_unitario: preco });
            else {
              const cur = mergedMap.get(id);
              cur.quantidade = (parseInt(cur.quantidade) || 0) + qtd;
              // manter preco mais recente
              cur.preco_unitario = preco;
              mergedMap.set(id, cur);
            }
          };

          existingItems.forEach(pushToMap);
          itemsState.forEach(it => pushToMap({ id_tenis: it.id_tenis, quantidade: it.quantidade, preco_unitario: it.preco_unitario }));

          const produtosPayload = Array.from(mergedMap.values());
          console.debug('Payload MERGED sendo enviado (itens existentes + locais):', { id_pedido: idPedidoAtual, produtos: produtosPayload });

          // 3) Envia cada item individualmente para aproveitar o UPSERT do backend (ON CONFLICT)
          for (const produto of produtosPayload) {
            const bodySingle = { id_pedido: idPedidoAtual, produtos: [{ id_tenis: produto.id_tenis, quantidade: produto.quantidade, preco_unitario: produto.preco_unitario }] };
            const enviarRes = await fetch(`${API_BASE_URL}/pedido/produtos`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(bodySingle)
            });

            const txt = await enviarRes.text();
            console.debug('Resposta (upsert) do backend para produto', produto.id_tenis, enviarRes.status, txt);
            if (!enviarRes.ok) {
              console.error('Falha ao enviar item', produto, 'status', enviarRes.status, txt);
              alert('Erro ao enviar itens do carrinho. Veja console.');
              return;
            }
          }

          // 4) Limpamos a sessionStorage.carrinho após persistir
          try { sessionStorage.removeItem('carrinho'); } catch (e) { console.warn('Não foi possível remover sessionStorage.carrinho:', e); }
          console.log('✓ Itens enviados/mesclados com sucesso ao backend.');
        }
      } catch (e) {
        console.error('Erro ao enviar itens na finalização:', e);
        alert('Erro ao enviar itens na finalização. Veja console.');
        return;
      }

      const finalizeResponse2 = await fetch(`${API_BASE_URL}/pedido/${idPedidoAtual}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
    alert('Erro ao carregar carrinho.');
  }
});
