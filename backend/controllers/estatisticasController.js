// /home/ubuntu/project/4bim-avaliacao/controllers/estatisticasController.js

/**
 * Simula a obtenção de dados de vendas. Prioriza localStorage, mas pode ser adaptado para fetch API.
 * @returns {Array<Object>} Array de objetos de venda.
 */
export function getVendasRaw() {
    try {
        const vendas = JSON.parse(localStorage.getItem('relatorioVendas') || '[]');
        // Adiciona um campo 'formaPagamento' para simular dados de pagamento, se não existir
        // Em um projeto real, isso viria do backend ou do próprio objeto de venda.
        // Aqui, vamos simular com base em um hash simples do ID do pedido.
        return vendas.map(venda => {
            if (!venda.formaPagamento) {
                const formas = ['Cartão', 'Pix', 'Dinheiro'];
                // Usando o valor total para uma simulação de forma de pagamento
                const index = Math.floor(venda.valorTotal * 100) % formas.length;
                venda.formaPagamento = formas[index];
            }
            return venda;
        });
    } catch (e) {
        console.error("Erro ao carregar dados de vendas do localStorage:", e);
        return [];
    }
}

/**
 * Filtra as vendas por um período de tempo.
 * @param {Array<Object>} vendas - Array de vendas.
 * @param {Date} start - Data de início do período (inclusivo).
 * @param {Date} end - Data de fim do período (inclusivo).
 * @returns {Array<Object>} Vendas filtradas.
 */
function filtrarVendasPorPeriodo(vendas, start, end) {
    const startTime = start.getTime();
    const endTime = end.getTime();

    return vendas.filter(venda => {
        // Assume que venda.data é uma string de data válida (ex: "YYYY-MM-DD")
        const dataVenda = new Date(venda.data).getTime();
        // Adiciona 23:59:59.999 ao final para garantir que o dia final seja inclusivo
        const dataFimDoDia = new Date(new Date(venda.data).setHours(23, 59, 59, 999)).getTime();
        
        return dataVenda >= startTime && dataFimDoDia <= endTime;
    });
}

/**
 * Calcula o resumo das métricas (total de pedidos, arrecadado, ticket médio).
 * @param {Array<Object>} vendas - Array de vendas.
 * @param {Date} start - Data de início do período.
 * @param {Date} end - Data de fim do período.
 * @returns {Object} Resumo das métricas.
 */
export function calcResumo(vendas, start, end) {
    const vendasNoPeriodo = filtrarVendasPorPeriodo(vendas, start, end);

    const totalPedidos = vendasNoPeriodo.length;
    const totalArrecadado = vendasNoPeriodo.reduce((acc, venda) => acc + venda.valorTotal, 0);
    const ticketMedio = totalPedidos > 0 ? totalArrecadado / totalPedidos : 0;

    return {
        totalPedidos,
        totalArrecadado,
        ticketMedio
    };
}

/**
 * Calcula o ranking dos produtos mais vendidos.
 * @param {Array<Object>} vendas - Array de vendas.
 * @param {number} n - Número de produtos no top.
 * @returns {Array<Object>} Ranking de produtos.
 */
export function topProdutos(vendas, n = 10) {
    const contagemProdutos = {};
    let totalGeral = 0;

    vendas.forEach(venda => {
        venda.itens.forEach(item => {
            const modelo = item.modelo;
            const quantidade = item.quantidade;
            totalGeral += quantidade;

            if (!contagemProdutos[modelo]) {
                contagemProdutos[modelo] = 0;
            }
            contagemProdutos[modelo] += quantidade;
        });
    });

    const ranking = Object.keys(contagemProdutos).map(modelo => ({
        modelo,
        qtd: contagemProdutos[modelo],
        percentual: (contagemProdutos[modelo] / totalGeral) * 100
    }));

    ranking.sort((a, b) => b.qtd - a.qtd);

    return ranking.slice(0, n);
}

/**
 * Agrupa as vendas por tamanho de tênis.
 * @param {Array<Object>} vendas - Array de vendas.
 * @returns {Object} Mapa tamanho -> quantidade vendida.
 */
export function vendasPorTamanho(vendas) {
    const contagemTamanhos = {};
    let totalItens = 0;

    vendas.forEach(venda => {
        venda.itens.forEach(item => {
            const tamanho = item.tamanho;
            const quantidade = item.quantidade;
            totalItens += quantidade;

            if (!contagemTamanhos[tamanho]) {
                contagemTamanhos[tamanho] = 0;
            }
            contagemTamanhos[tamanho] += quantidade;
        });
    });

    return Object.keys(contagemTamanhos).map(tamanho => ({
        tamanho,
        qtd: contagemTamanhos[tamanho],
        percentual: (contagemTamanhos[tamanho] / totalItens) * 100
    })).sort((a, b) => parseInt(a.tamanho) - parseInt(b.tamanho));
}

/**
 * Agrupa as vendas por forma de pagamento.
 * @param {Array<Object>} vendas - Array de vendas.
 * @returns {Array<Object>} Array de formas de pagamento com contagem e porcentagem.
 */
export function vendasPorFormaPagamento(vendas) {
    const contagemPagamentos = {};
    let totalPedidos = vendas.length;

    vendas.forEach(venda => {
        const forma = venda.formaPagamento || 'Outro';
        if (!contagemPagamentos[forma]) {
            contagemPagamentos[forma] = { contagem: 0, totalArrecadado: 0 };
        }
        contagemPagamentos[forma].contagem += 1;
        contagemPagamentos[forma].totalArrecadado += venda.valorTotal;
    });

    return Object.keys(contagemPagamentos).map(forma => ({
        forma,
        contagem: contagemPagamentos[forma].contagem,
        totalArrecadado: contagemPagamentos[forma].totalArrecadado,
        percentual: (contagemPagamentos[forma].contagem / totalPedidos) * 100
    }));
}

/**
 * Calcula a receita ao longo do tempo.
 * @param {Array<Object>} vendas - Array de vendas.
 * @param {'day'|'week'|'month'} agrupamento - Tipo de agrupamento.
 * @returns {Array<Object>} Série temporal.
 */
export function receitaPorPeriodo(vendas, agrupamento = 'day') {
    const serieTemporal = {};

    vendas.forEach(venda => {
        const data = new Date(venda.data);
        let chave;

        if (agrupamento === 'day') {
            chave = data.toISOString().split('T')[0]; // YYYY-MM-DD
        } else if (agrupamento === 'week') {
            // Simplesmente usa o primeiro dia da semana (domingo) como chave
            const diaSemana = data.getDay();
            const inicioSemana = new Date(data);
            inicioSemana.setDate(data.getDate() - diaSemana);
            chave = inicioSemana.toISOString().split('T')[0];
        } else if (agrupamento === 'month') {
            chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
        }

        if (!serieTemporal[chave]) {
            serieTemporal[chave] = 0;
        }
        serieTemporal[chave] += venda.valorTotal;
    });

    return Object.keys(serieTemporal).sort().map(chave => ({
        periodo: chave,
        receita: serieTemporal[chave]
    }));
}

/**
 * Obtém os detalhes de um produto específico (para o modal).
 * @param {Array<Object>} vendas - Array de vendas.
 * @param {string} modelo - Nome do modelo do produto.
 * @returns {Object} Detalhes do produto.
 */
export function detalhesProduto(vendas, modelo) {
    const vendasProduto = vendas.filter(venda =>
        venda.itens.some(item => item.modelo === modelo)
    );

    const historicoDiario = {};
    const tamanhosVendidos = {};

    vendasProduto.forEach(venda => {
        const data = new Date(venda.data).toISOString().split('T')[0];
        const item = venda.itens.find(i => i.modelo === modelo);

        if (item) {
            if (!historicoDiario[data]) {
                historicoDiario[data] = 0;
            }
            historicoDiario[data] += item.quantidade;

            const tamanho = item.tamanho;
            if (!tamanhosVendidos[tamanho]) {
                tamanhosVendidos[tamanho] = 0;
            }
            tamanhosVendidos[tamanho] += item.quantidade;
        }
    });

    const historico = Object.keys(historicoDiario).sort().map(data => ({
        data,
        quantidade: historicoDiario[data]
    }));

    const tamanhos = Object.keys(tamanhosVendidos).map(tamanho => ({
        tamanho,
        quantidade: tamanhosVendidos[tamanho]
    })).sort((a, b) => b.quantidade - a.quantidade);

    return {
        modelo,
        historico,
        tamanhos,
        pedidos: vendasProduto.map(v => ({ id: v.id, data: v.data, valor: v.valorTotal }))
    };
}

// Funções utilitárias de data e formatação
export function getPeriodoDatas(periodo) {
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999); // Fim do dia
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0); // Início do dia

    switch (periodo) {
        case '7d':
            inicio.setDate(hoje.getDate() - 6);
            break;
        case '30d':
            inicio.setDate(hoje.getDate() - 29);
            break;
        case 'current_month':
            inicio.setDate(1);
            break;
        default: // 7d como fallback
            inicio.setDate(hoje.getDate() - 6);
            break;
    }

    return { start: inicio, end: hoje };
}

export function formatarData(data) {
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR');
}

export function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}