// Removendo a importação do QRCode e utilizando um script externo no HTML

// Função para gerar QR Code
async function gerarQRCode(data) {
    return new Promise((resolve, reject) => {
        QRCode.toDataURL(data, (err, url) => {
            if (err) reject(err);
            else resolve(url);
        });
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const cartaoForm = document.getElementById('cartao-form');
    const gerarQrcodeButton = document.getElementById('gerar-qrcode');
    const qrcodeContainer = document.getElementById('qrcode-container');
    const qrcodeImage = document.createElement('img');
    const pixPagoButton = document.createElement('button');

    pixPagoButton.textContent = 'Pix Pago';
    pixPagoButton.style.display = 'none';
    pixPagoButton.id = 'pix-pago-button';
    document.body.appendChild(pixPagoButton);

    async function registrarPagamento(idPedido, idFormaPagamento, idPessoa) {
        try {
            const response = await fetch('http://localhost:3001/pagamento/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_pedido: idPedido,
                    id_forma_pagamento: idFormaPagamento
                })
            });

            if (!response.ok) {
                throw new Error('Erro ao registrar pagamento');
            }

            // Atualizar o id_pedido_atual da pessoa para null
            await fetch('http://localhost:3001/pessoa/atualizarPedidoAtual', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_pedido: null, id_pessoa: idPessoa })
            });

            alert('Pagamento registrado com sucesso!');
            window.location.href = '/';
        } catch (error) {
            console.error('Erro ao registrar pagamento:', error);
            alert('Erro ao registrar pagamento. Tente novamente mais tarde.');
        }
    }

    function validarCPF(cpf) {
        cpf = cpf.replace(/[.-]/g, ''); // Remove pontos e traços

        if (cpf.length !== 11 || /^([0-9])\1*$/.test(cpf)) {
            return false; // CPF deve ter 11 dígitos e não pode ser uma sequência repetida
        }

        let soma = 0;
        for (let i = 0; i < 9; i++) {
            soma += parseInt(cpf[i]) * (10 - i);
        }
        let resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf[9])) return false;

        soma = 0;
        for (let i = 0; i < 10; i++) {
            soma += parseInt(cpf[i]) * (11 - i);
        }
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        return resto === parseInt(cpf[10]);
    }

    function validarNumeroCartao(numeroCartao) {
        numeroCartao = numeroCartao.replace(/\s+/g, ''); // Remove espaços

        if (!/^[0-9]{16}$/.test(numeroCartao)) {
            return false; // Número do cartão deve ter 16 dígitos
        }

        let soma = 0;
        let alternar = false;
        for (let i = numeroCartao.length - 1; i >= 0; i--) {
            let digito = parseInt(numeroCartao[i]);

            if (alternar) {
                digito *= 2;
                if (digito > 9) digito -= 9;
            }

            soma += digito;
            alternar = !alternar;
        }

        return soma % 10 === 0; // Soma deve ser múltiplo de 10
    }

    cartaoForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const numeroCartao = document.getElementById('numero-cartao').value;
        const cpf = document.getElementById('cpf').value;

        if (validarNumeroCartao(numeroCartao) && validarCPF(cpf)) {
            const userResponse = await fetch('http://localhost:3001/login/verificaSeUsuarioEstaLogado', {
                method: 'POST',
                credentials: 'include'
            });
            const userData = await userResponse.json();

            if (userData.status === 'ok') {
                await registrarPagamento(userData.id_pedido_atual, 1, userData.id_pessoa); // 1 para Cartão de Crédito
            }
        } else {
            alert('Número do cartão ou CPF inválido.');
        }
    });

    pixPagoButton.addEventListener('click', async () => {
        const userResponse = await fetch('http://localhost:3001/login/verificaSeUsuarioEstaLogado', {
            method: 'POST',
            credentials: 'include'
        });
        const userData = await userResponse.json();

        if (userData.status === 'ok') {
            await registrarPagamento(userData.id_pedido_atual, 3, userData.id_pessoa); // 3 para Pix
        }
    });

    gerarQrcodeButton.addEventListener('click', async () => {
        try {
            const userResponse = await fetch('http://localhost:3001/login/verificaSeUsuarioEstaLogado', {
                method: 'POST',
                credentials: 'include'
            });
            const userData = await userResponse.json();

            if (userData.status !== 'ok') {
                alert('Você precisa fazer login para gerar o QR Code.');
                return;
            }

            const pedidoId = userData.id_pedido_atual;

            const pedidoResponse = await fetch(`http://localhost:3001/pedido/produtos/${pedidoId}`);
            const pedidoProdutos = await pedidoResponse.json();

            const valorTotal = pedidoProdutos.reduce((total, item) => {
                return total + item.preco_unitario * item.quantidade;
            }, 0);

            const qrCodeData = `Pagamento Pix\nPedido ID: ${pedidoId}\nValor: R$ ${valorTotal.toFixed(2)}`;

            const qrCodeUrl = await QRCode.toDataURL(qrCodeData);
            qrcodeImage.src = qrCodeUrl;
            qrcodeContainer.innerHTML = '<p>Use o QR Code abaixo para finalizar a compra:</p>';
            qrcodeContainer.appendChild(qrcodeImage);
            qrcodeContainer.style.display = 'block';
            pixPagoButton.style.display = 'inline-block';
        } catch (error) {
            console.error('Erro ao gerar QR Code:', error);
            alert('Erro ao gerar QR Code. Tente novamente mais tarde.');
        }
    });

    // Adiciona o botão Pix Pago fora do qrcode-container
    document.getElementById("opcao-pix").appendChild(pixPagoButton);
});