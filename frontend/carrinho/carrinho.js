// frontend/carrinho/carrinho.js (versão corrigida)
const API_BASE_URL = 'http://localhost:3001';

document.addEventListener('DOMContentLoaded', async () => {
  const cartItemsContainer = document.getElementById('cart-items');
  const totalPriceElement = document.getElementById('total-price');
  const totalItemsElement = document.getElementById('total-items');
  const orderDateElement = document.getElementById('order-date');
  const funcionarioSelect = document.getElementById('funcionario');

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
      const pedidoId = data.id_pedido_atual;
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
        })
      });
      if (!criarRes.ok) return null;
      const novoPedido = await criarRes.json();
      const novoId = novoPedido.id_pedido;

      // Atualiza pessoa
      await fetch(`${API_BASE_URL}/pessoa/atualizarPedidoAtual`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_pessoa: data.id_pessoa, id_pedido: novoId })
      });

      return novoId;
    } catch (err) {
      console.error('Erro ao garantir pedido válido:', err);
      return null;
    }
  }

  try {
    const pedidoId = await garantirPedidoValidoFront();
    if (!pedidoId) {
      throw new Error('Não foi possível garantir um pedido válido para exibir o carrinho.');
    }

    // Busca itens do pedido
    const response = await fetch(`${API_BASE_URL}/pedido/produtos/${pedidoId}`);
    let cartItems = [];
    if (response.ok) {
      cartItems = await response.json();
    } else {
      cartItems = []; // pedido vazio
    }

    let totalPrice = 0;
    let totalItems = 0;

    cartItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('cart-item');
        itemElement.innerHTML = `
            <p>${item.nome_tenis} (${item.quantidade}x)</p>
            <p>R$ ${(item.preco_unitario * item.quantidade).toFixed(2)}</p>
        `;
        cartItemsContainer.appendChild(itemElement);

        totalPrice += item.preco_unitario * item.quantidade;
        totalItems += item.quantidade;
    });

    totalPriceElement.textContent = `Total a pagar: R$ ${totalPrice.toFixed(2)}`;
    totalItemsElement.textContent = `Itens: ${totalItems}`;
    orderDateElement.textContent = `Data: ${new Date().toLocaleString()}`;

    // Fetch funcionarios
    const funcionariosResponse = await fetch(`${API_BASE_URL}/funcionario`);
    const funcionarios = await funcionariosResponse.json();

    funcionarios.forEach(funcionario => {
        const option = document.createElement('option');
        option.value = funcionario.id_pessoa;
        option.textContent = funcionario.nome_pessoa;
        funcionarioSelect.appendChild(option);
    });

    // Add event listeners
    document.getElementById('back-button').addEventListener('click', () => {
        window.location.href = 'http://localhost:3001/';
    });

    document.getElementById('finalize-button').addEventListener('click', async () => {
        const selectedFuncionario = funcionarioSelect.value;

        const finalizeResponse = await fetch(`${API_BASE_URL}/login/verificaSeUsuarioEstaLogado`, {
          method: 'POST',
          credentials: 'include'
        });
        const userData = await finalizeResponse.json();
        if (userData.status !== 'ok') {
          alert('Você precisa estar logado para finalizar o pedido.');
          return;
        }

        // obtém o id_pedido atual e garante sua existência antes de finalizar
        let idPedidoAtual = userData.id_pedido_atual;
        const pedidoRes = await fetch(`${API_BASE_URL}/pedido/${idPedidoAtual}`);
        if (!pedidoRes.ok) {
          // cria novo pedido se por algum motivo o id atual não existe
          idPedidoAtual = await (async () => {
            const criar = await fetch(`${API_BASE_URL}/pedido`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                data_do_pedido: new Date().toISOString().split('T')[0],
                id_cliente: userData.id_pessoa,
                id_funcionario: null
              })
            });
            if (!criar.ok) throw new Error('Erro ao criar novo pedido na finalização');
            const novo = await criar.json();
            await fetch(`${API_BASE_URL}/pessoa/atualizarPedidoAtual`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id_pessoa: userData.id_pessoa, id_pedido: novo.id_pedido })
            });
            return novo.id_pedido;
          })();
        }

        // Atualiza o pedido com o funcionário selecionado
        const finalizeResponse2 = await fetch(`${API_BASE_URL}/pedido/${idPedidoAtual}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id_funcionario: selectedFuncionario })
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
