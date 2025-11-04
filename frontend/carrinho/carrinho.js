document.addEventListener('DOMContentLoaded', async () => {
    const cartItemsContainer = document.getElementById('cart-items');
    const totalPriceElement = document.getElementById('total-price');
    const totalItemsElement = document.getElementById('total-items');
    const orderDateElement = document.getElementById('order-date');
    const funcionarioSelect = document.getElementById('funcionario');

    try {
        // Fetch cart items
        const res = await fetch('http://localhost:3001/login/verificaSeUsuarioEstaLogado', {
          method: 'POST',
          credentials: 'include' // MUITO IMPORTANTE: envia cookies
        });
        const data = await res.json();
        const response = await fetch('http://localhost:3001/pedido/produtos/'+data.id_pedido_atual); // Example: Fetching products for order ID 1
        const cartItems = await response.json();
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
        const funcionariosResponse = await fetch('http://localhost:3001/funcionario');
        const funcionarios = await funcionariosResponse.json();

        funcionarios.forEach(funcionario => {
            const option = document.createElement('option');
            option.value = funcionario.id_pessoa;
            option.textContent = funcionario.nome_pessoa;
            funcionarioSelect.appendChild(option);
        });

        // Add event listeners
        document.getElementById('back-button').addEventListener('click', () => {
            console.log('Back button clicked');
            window.location.href = 'http://localhost:3001/';
        });

        document.getElementById('finalize-button').addEventListener('click', async () => {
            const selectedFuncionario = funcionarioSelect.value;

            const finalizeResponse = await fetch('http://localhost:3001/pedido/'+data.id_pedido_atual, { // Example: Finalizing order ID 1
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id_funcionario: selectedFuncionario })
            });

            if (finalizeResponse.ok) {
                window.location.href = 'http://localhost:3001/carrinho/finalizar';
            } else {
                alert('Erro ao finalizar compra.');
            }
        });

    } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
    }
});