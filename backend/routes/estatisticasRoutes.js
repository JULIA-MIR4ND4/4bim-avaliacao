// --- MOCK DATA ---

/**
 * Gera dados mock de vendas se não existirem no localStorage.
 */
function mockVendasData() {
    const produtos = [
        { modelo: 'Air Runner Pro', preco: 450.00 },
        { modelo: 'Street Classic 95', preco: 320.00 },
        { modelo: 'Nova Boost X', preco: 580.00 },
        { modelo: 'Trail Master 2.0', preco: 610.00 },
        { modelo: 'Retro 88', preco: 290.00 },
        { modelo: 'Grip Speed V1', preco: 499.00 },
        { modelo: 'Infinity Wave', preco: 700.00 },
        { modelo: 'Pulse Flex', preco: 390.00 },
        { modelo: 'Cloud Walk 3', preco: 420.00 },
        { modelo: 'Base Low', preco: 250.00 }
    ];
    const tamanhos = [37, 38, 39, 40, 41, 42, 43, 44];
    const pagamentos = ['Cartão', 'Pix', 'Dinheiro'];
    const dataVendas = [];
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Gerar 500 pedidos aleatórios nos últimos 60 dias
    for (let i = 0; i < 500; i++) {
        const diasAtras = Math.floor(Math.random() * 60); // Vendas nos últimos 60 dias
        const dataPedido = new Date(hoje);
        dataPedido.setDate(hoje.getDate() - diasAtras);
        const item = produtos[Math.floor(Math.random() * produtos.length)];
        const quantidade = Math.floor(Math.random() * 3) + 1; // 1 a 3 unidades
        const valorTotal = (item.preco * quantidade).toFixed(2);
        const tamanho = tamanhos[Math.floor(Math.random() * tamanhos.length)];
        const formaPagamento = pagamentos[Math.floor(Math.random() * pagamentos.length)];

        dataVendas.push({
            idPedido: `PED-${1000 + i}`,
            data: dataPedido.toISOString().split('T')[0], // YYYY-MM-DD
            modelo: item.modelo,
            tamanho: tamanho,
            quantidade: quantidade,
            valorTotal: parseFloat(valorTotal),
            formaPagamento: formaPagamento,
        });
    }
    return dataVendas;
}

// --- ROUTER / DATA ACCESS ---

/**
 * Retorna a array de vendas, criando dados mock no localStorage se necessário.
 * Simula um GET /api/vendas/raw
 */
export const getVendasRaw = () => {
    let vendas = [];
    try {
        const localData = localStorage.getItem('relatorioVendas');
        if (localData) {
            vendas = JSON.parse(localData);
        } else {
            vendas = mockVendasData();
            localStorage.setItem('relatorioVendas', JSON.stringify(vendas));
            console.log("Dados mock de vendas gerados e salvos no localStorage.");
        }
    } catch (e) {
        console.error("Erro ao carregar ou salvar dados no localStorage:", e);
        vendas = mockVendasData(); // Fallback para dados mock
    }
    return vendas;
};

/**
 * Função utilitária para obter a data de início de um período predefinido.
 */
export function getStartDate(periodo) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const date = new Date(now);

    switch (periodo) {
        case '7d':
            date.setDate(now.getDate() - 7);
            break;
        case '30d':
            date.setDate(now.getDate() - 30);
            break;
        case 'currentMonth':
            date.setDate(1); // Primeiro dia do mês
            break;
        default:
            return null;
    }
    return date;
}

// Simulação de endpoint agregado (não utilizada diretamente, mas respeita o requisito)
export const fetchVendasSummary = (start, end) => {
    // Nesta simulação, apenas retornamos os dados brutos,
    // já que a agregação será feita no cliente pelo Controller.
    const vendas = getVendasRaw();
    return Promise.resolve(vendas);
};