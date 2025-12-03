// /home/ubuntu/project/4bim-avaliacao/relatorios/estatisticas/estatisticas.js

// Este arquivo foi adaptado para buscar os dados reais do backend (PostgreSQL)
const API = window.API_BASE_URL || 'http://localhost:3001';

// --- Helpers (implementações client-side dos algoritmos de estatísticas) ---
function formatarMoeda(valor) {
    return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getPeriodoDatas(periodo) {
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);

    switch (periodo) {
        case '7d': inicio.setDate(hoje.getDate() - 6); break;
        case '30d': inicio.setDate(hoje.getDate() - 29); break;
        case 'current_month': inicio.setDate(1); break;
        default: inicio.setDate(hoje.getDate() - 6); break;
    }
    return { start: inicio, end: hoje };
}

function calcResumo(vendas, start, end) {
    const vendasFiltradas = vendas.filter(v => {
        const d = new Date(v.data_do_pedido || v.data);
        return d >= start && d <= end;
    });

    const totalPedidos = vendasFiltradas.length;
    const totalArrecadado = vendasFiltradas.reduce((acc, v) => acc + (parseFloat(v.valor_total) || 0), 0);
    const ticketMedio = totalPedidos > 0 ? totalArrecadado / totalPedidos : 0;
    return { totalPedidos, totalArrecadado, ticketMedio };
}

function topProdutos(vendas, n = 10) {
    const contagem = {};
    let total = 0;
    vendas.forEach(v => {
        (v.itens || []).forEach(i => {
            const modelo = i.nome_tenis || i.modelo || 'Sem nome';
            const qtd = parseInt(i.quantidade) || 0;
            total += qtd;
            contagem[modelo] = (contagem[modelo] || 0) + qtd;
        });
    });

    const ranking = Object.keys(contagem).map(modelo => ({ modelo, qtd: contagem[modelo], percentual: (contagem[modelo] / (total||1)) * 100 }));
    ranking.sort((a, b) => b.qtd - a.qtd);
    return ranking.slice(0, n);
}

function vendasPorTamanho(vendas) {
    const map = {};
    let total = 0;
    vendas.forEach(v => (v.itens || []).forEach(i => {
        const tamanho = i.tamanho || 'N/D';
        const qtd = parseInt(i.quantidade) || 0;
        total += qtd;
        map[tamanho] = (map[tamanho] || 0) + qtd;
    }));
    return Object.keys(map).map(t => ({ tamanho: t, qtd: map[t], percentual: (map[t] / (total||1)) * 100 }));
}

function vendasPorFormaPagamento(vendas) {
    const map = {};
    vendas.forEach(v => {
        const forma = v.formaPagamento || v.forma_pagamento || 'Outro';
        map[forma] = map[forma] || { contagem: 0, totalArrecadado: 0 };
        map[forma].contagem += 1;
        map[forma].totalArrecadado += parseFloat(v.valor_total) || 0;
    });
    const total = vendas.length || 1;
    return Object.keys(map).map(k => ({ forma: k, contagem: map[k].contagem, totalArrecadado: map[k].totalArrecadado, percentual: (map[k].contagem / total) * 100 }));
}

function receitaPorPeriodo(vendas, agrupamento = 'day') {
    const serie = {};
    vendas.forEach(v => {
        const d = new Date(v.data_do_pedido || v.data);
        let chave;
        if (agrupamento === 'day') chave = d.toISOString().split('T')[0];
        else if (agrupamento === 'week') { const dia = d.getDate() - d.getDay(); const inicio = new Date(d); inicio.setDate(dia); chave = inicio.toISOString().split('T')[0]; }
        else chave = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        serie[chave] = (serie[chave] || 0) + (parseFloat(v.valor_total) || 0);
    });
    return Object.keys(serie).sort().map(k => ({ periodo: k, receita: serie[k] }));
}

function isValidDate(d) {
    return d instanceof Date && !isNaN(d.getTime());
}

function detalhesProduto(vendas, modelo) {
    const vendasProd = vendas.filter(v => (v.itens || []).some(i => (i.nome_tenis || i.modelo) === modelo));
    const historico = {};
    const tamanhos = {};
    vendasProd.forEach(v => {
        const data = (v.data_do_pedido || v.data).split('T')[0];
        const it = (v.itens || []).find(i => (i.nome_tenis || i.modelo) === modelo);
        if (!it) return;
        historico[data] = (historico[data] || 0) + (parseInt(it.quantidade)||0);
        const tam = it.tamanho || 'N/D';
        tamanhos[tam] = (tamanhos[tam] || 0) + (parseInt(it.quantidade)||0);
    });
    return { modelo, historico: Object.keys(historico).sort().map(d=>({data:d,quantidade:historico[d]})), tamanhos: Object.keys(tamanhos).map(t=>({tamanho:t,quantidade:tamanhos[t]})), pedidos: vendasProd.map(v=>({ id: v.id_pedido || v.id, data: v.data_do_pedido || v.data, valor: v.valor_total })) };
}

// Busca vendas do backend e monta vendasGlobais no formato esperado
// accept optional start/end ISO dates to pass to the API
async function fetchVendasFromApi(startDate, endDate) {
    try {
        const qs = new URLSearchParams();
        if (startDate) qs.set('startDate', startDate);
        if (endDate) qs.set('endDate', endDate);
        const url = `${API}/relatorios/api/vendas${qs.toString() ? '?' + qs.toString() : ''}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Erro ao buscar vendas do backend: ' + res.status);
        const rows = await res.json();
        // rows é array de pedidos com campos: id_pedido, data_do_pedido, valor_total, cliente, funcionario, itens
        const vendas = rows.map(r => ({
            id_pedido: r.id_pedido,
            data_do_pedido: r.data_do_pedido || r.data,
            valor_total: parseFloat(r.valor_total) || 0,
            cliente: r.cliente,
            funcionario: r.funcionario,
            itens: (r.itens || []).map(i => ({ nome_tenis: i.nome_tenis || i.modelo, quantidade: i.quantidade, preco_unitario: i.preco_unitario, tamanho: i.tamanho }))
        }));
        return vendas;
    } catch (error) {
        console.error('Falha ao buscar vendas do API:', error);
        // Não usar dados mock — requisito: usar somente o banco de dados do usuário
        throw error;
    }
}

// Busca as estatísticas agregadas do backend (total pedidos, arrecadado, etc.)
async function fetchEstatisticasFromApi(startDate, endDate) {
    try {
        const qs = new URLSearchParams();
        if (startDate) qs.set('startDate', startDate);
        if (endDate) qs.set('endDate', endDate);
        const url = `${API}/relatorios/api/estatisticas${qs.toString() ? '?' + qs.toString() : ''}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Erro ao buscar estatísticas: ' + res.status);
        return await res.json();
    } catch (err) {
        console.error('Falha ao buscar estatísticas do API:', err);
        throw err;
    }
}

// Busca receita agrupada por mês diretamente do backend
async function fetchReceitaPorMesFromApi(startDate, endDate) {
    try {
        const qs = new URLSearchParams();
        if (startDate) qs.set('startDate', startDate);
        if (endDate) qs.set('endDate', endDate);
        const url = `${API}/relatorios/api/receita-mes${qs.toString() ? '?' + qs.toString() : ''}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Erro ao buscar receita por mês: ' + res.status);
        return await res.json();
    } catch (err) {
        console.error('Falha ao buscar receita por mês do API:', err);
        throw err;
    }
}

// Variáveis globais para os gráficos
let rankingChart, paymentChart, sizeChart, timelineChart, modalSalesChart;
let vendasGlobais = [];
let dadosAtuais = {};

// Elementos do DOM
const periodoSelect = document.getElementById('periodo');
const agrupamentoSelect = document.getElementById('agrupamento');
const dataInicioInput = document.getElementById('data-inicio');
const dataFimInput = document.getElementById('data-fim');
const printButton = document.getElementById('print-button');
const exportPdfButton = document.getElementById('export-pdf');
const exportCsvButton = document.getElementById('export-csv');
const modal = document.getElementById('product-modal');
const closeModal = document.querySelector('.close-button');

// --- Funções de Inicialização e Renderização ---

/**
 * Inicializa os gráficos Chart.js
 */
function initializeCharts() {
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.x !== undefined) {
                            label += context.parsed.x.toLocaleString('pt-BR');
                        } else if (context.parsed !== undefined) {
                            label += context.parsed.toLocaleString('pt-BR');
                        }
                        return label;
                    }
                }
            }
        }
    };

    // Gráfico de Ranking (Barras Horizontais) - visual reforçado
    rankingChart = new Chart(document.getElementById('rankingChart'), {
        type: 'bar',
        data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
        options: {
            ...chartOptions,
            indexAxis: 'y',
            onClick: handleRankingClick,
            plugins: {
                ...chartOptions.plugins,
                legend: { display: false },
                title: { display: true, text: 'Top Produtos Vendidos', font: { size: 16 } }
            },
            scales: {
                x: { beginAtZero: true, ticks: { font: { size: 12 }, callback: value => value.toLocaleString('pt-BR') } },
                y: { beginAtZero: true, ticks: { font: { size: 12 } } }
            },
            layout: { padding: { top: 8, right: 8, bottom: 8, left: 8 } }
        }
    });

    // Observação: removemos os gráficos de Forma de Pagamento e Vendas por Tamanho
    // do relatório de Estatísticas para melhorar foco. Esses elementos não existem
    // no HTML desta página e são renderizados apenas no relatório de Vendas.

    // Gráfico de Linha do Tempo (Receita) - visual limpo
    timelineChart = new Chart(document.getElementById('timelineChart'), {
        type: 'line',
        data: { labels: [], datasets: [{ data: [], borderColor: '#004d7a', backgroundColor: 'rgba(0,77,122,0.08)', fill: true, tension: 0.2, pointRadius: 3 }] },
        options: {
            ...chartOptions,
            plugins: { ...chartOptions.plugins, title: { display: true, text: 'Receita ao Longo do Tempo', font: { size: 14 } } },
            scales: {
                x: { type: 'category', ticks: { font: { size: 12 } } },
                y: { beginAtZero: true, ticks: { font: { size: 12 }, callback: val => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) } }
            }
        }
    });

    // Gráfico do Modal (inicializado apenas para ter a variável)
    modalSalesChart = new Chart(document.getElementById('modal-sales-chart'), {
        type: 'line',
        data: { labels: [], datasets: [{ data: [], borderColor: 'rgb(255, 99, 132)', tension: 0.1 }] },
        options: {
            ...chartOptions,
            scales: {
                x: { type: 'category' },
                y: { beginAtZero: true }
            }
        }
    });
}

/**
 * Atualiza o painel de resumo (cards).
 * @param {Object} resumo - Dados de resumo.
 * @param {Array<Object>} ranking - Dados do ranking.
 */
function updateSummaryPanel(resumo, ranking) {
    document.getElementById('total-pedidos').textContent = resumo.totalPedidos.toLocaleString('pt-BR');
    document.getElementById('total-arrecadado').textContent = formatarMoeda(resumo.totalArrecadado);
    document.getElementById('ticket-medio').textContent = formatarMoeda(resumo.ticketMedio);

    if (ranking.length > 0) {
        document.getElementById('top-produto-nome').textContent = ranking[0].modelo;
        document.getElementById('top-produto-qtd').textContent = `${ranking[0].qtd.toLocaleString('pt-BR')} unidades`;
    } else {
        document.getElementById('top-produto-nome').textContent = 'Nenhum';
        document.getElementById('top-produto-qtd').textContent = '0 unidades';
    }
}

/**
 * Renderiza o gráfico de ranking.
 * @param {Array<Object>} ranking - Dados do ranking.
 */
function renderRankingChart(ranking) {
    const labels = ranking.map(item => `${item.modelo} (${item.qtd.toLocaleString('pt-BR')} - ${item.percentual.toFixed(1)}%)`);
    const data = ranking.map(item => item.qtd);
    const backgroundColors = ranking.map((_, index) => index === 0 ? 'rgba(0, 77, 122, 0.8)' : 'rgba(0, 123, 255, 0.6)');

    rankingChart.data.labels = labels;
    rankingChart.data.datasets[0].data = data;
    rankingChart.data.datasets[0].backgroundColor = backgroundColors;
    rankingChart.update();
}

/**
 * Renderiza o gráfico de formas de pagamento.
 * @param {Array<Object>} pagamentos - Dados de formas de pagamento.
 */
function renderPaymentChart(pagamentos) {
    const labels = pagamentos.map(item => `${item.forma} (${item.percentual.toFixed(1)}%)`);
    const data = pagamentos.map(item => item.contagem);
    const backgroundColors = ['#004d7a', '#007bff', '#28a745', '#ffc107']; // Cores consistentes

    paymentChart.data.labels = labels;
    paymentChart.data.datasets[0].data = data;
    paymentChart.data.datasets[0].backgroundColor = backgroundColors.slice(0, data.length);
    paymentChart.update();
}

/**
 * Renderiza o gráfico de vendas por tamanho.
 * @param {Array<Object>} tamanhos - Dados de vendas por tamanho.
 */
function renderSizeChart(tamanhos) {
    const labels = tamanhos.map(item => item.tamanho);
    const data = tamanhos.map(item => item.qtd);
    const backgroundColors = tamanhos.map(() => 'rgba(40, 167, 69, 0.7)'); // Cor verde para tamanhos

    sizeChart.data.labels = labels;
    sizeChart.data.datasets[0].data = data;
    sizeChart.data.datasets[0].backgroundColor = backgroundColors;
    sizeChart.update();
}

/**
 * Renderiza o gráfico de linha do tempo (receita).
 * @param {Array<Object>} receita - Dados de receita por período.
 */
function renderTimelineChart(receita) {
    const labels = receita.map(item => item.periodo);
    const data = receita.map(item => item.receita);

    timelineChart.data.labels = labels;
    timelineChart.data.datasets[0].data = data;
    timelineChart.update();
}

/**
 * Função principal para carregar e renderizar todos os dados.
 */
async function loadAndRenderData() {
    const vendas = vendasGlobais;
    let { start, end } = getPeriodoDatas(periodoSelect.value);

    if (periodoSelect.value === 'custom') {
        const inicioVal = dataInicioInput.value;
        const fimVal = dataFimInput.value;
        if (!inicioVal || !fimVal) {
            if (apiErrorEl) { apiErrorEl.style.display = 'block'; apiErrorEl.textContent = 'Selecione datas de início e fim válidas.'; }
            return; // aborta a renderização até o usuário corrigir as datas
        }
        start = new Date(inicioVal);
        end = new Date(fimVal);
        if (!isValidDate(start) || !isValidDate(end)) {
            if (apiErrorEl) { apiErrorEl.style.display = 'block'; apiErrorEl.textContent = 'Datas inválidas. Verifique o formato.'; }
            return;
        }
        end.setHours(23, 59, 59, 999); // Garante que o dia final seja inclusivo
    }

    // Mostrar e limpar mensagens de erro
    const apiErrorEl = document.getElementById('api-error');
    if (apiErrorEl) { apiErrorEl.style.display = 'none'; apiErrorEl.textContent = ''; }

    const sISO = isValidDate(start) ? start.toISOString().split('T')[0] : null;
    const eISO = isValidDate(end) ? end.toISOString().split('T')[0] : null;

    // 0. Buscar estatísticas agregadas do servidor e atualizar cards (mais eficiente)
    try {
        const stats = await fetchEstatisticasFromApi(sISO, eISO);
        document.getElementById('total-pedidos').textContent = (stats.total_pedidos || 0).toLocaleString('pt-BR');
        document.getElementById('total-arrecadado').textContent = formatarMoeda(parseFloat(stats.total_arrecadado) || 0);
        const qtdEl = document.getElementById('qtd-produtos');
        if (qtdEl) qtdEl.textContent = (stats.quantidade_produtos_vendidos || 0).toLocaleString('pt-BR');
        if (stats.produto_mais_vendido) {
            document.getElementById('top-produto-nome').textContent = stats.produto_mais_vendido.nome_tenis || stats.produto_mais_vendido.nome || '—';
            document.getElementById('top-produto-qtd').textContent = `${stats.produto_mais_vendido.total_vendido || stats.produto_mais_vendido.total_vendido || 0} unidades`;
        }
    } catch (err) {
        console.error('Erro ao carregar estatísticas agregadas:', err);
        if (apiErrorEl) { apiErrorEl.style.display = 'block'; apiErrorEl.textContent = 'Erro ao carregar estatísticas do servidor.'; }
        // continue: ainda tentamos carregar vendas para os gráficos, mas cards ficam com valores anteriores
    }
    // 1. Filtrar vendas pelo período (a filtragem está dentro do controller, mas vamos passar as datas)
    // No nosso controller, a filtragem é feita implicitamente em calcResumo, mas vamos refinar.
    // Para simplificar, vamos assumir que as funções do controller lidam com o filtro.

    // 2. Calcular e renderizar o resumo
    // 2. Buscar vendas para os gráficos (a API já filtra por datas se fornecidas)
    try {
        vendasGlobais = await fetchVendasFromApi(sISO, eISO);
    } catch (err) {
        console.error('Erro ao buscar vendas para gráficos:', err);
        if (apiErrorEl) { apiErrorEl.style.display = 'block'; apiErrorEl.textContent = 'Erro ao carregar dados de vendas para gráficos.'; }
        vendasGlobais = [];
    }

    const resumo = calcResumo(vendasGlobais, start, end);
    const ranking = topProdutos(vendasGlobais);
    updateSummaryPanel(resumo, ranking);

    // 3. Calcular e renderizar gráficos
    // Nota: neste relatório removemos os gráficos de "Forma de Pagamento" e "Vendas por Tamanho"
    // para melhorar foco e visualização; estes gráficos permanecem no relatório de Vendas.
    let receita = receitaPorPeriodo(vendas, agrupamentoSelect.value);
    // Se o agrupamento for por mês, preferimos os dados agregados do servidor
    if (agrupamentoSelect.value === 'month') {
        try {
            const s = sISO; const e = eISO;
            const rows = await fetchReceitaPorMesFromApi(s, e);
            receita = rows.map(r => ({ periodo: r.periodo, receita: r.receita }));
        } catch (err) {
            console.warn('Falha ao obter receita por mês do servidor, usando agregação local:', err);
        }
    }

    renderRankingChart(ranking);
    renderTimelineChart(receita);

    // Armazenar dados atuais para exportação
    const pagamentos = vendasPorFormaPagamento(vendasGlobais);
    const tamanhos = vendasPorTamanho(vendasGlobais);
    dadosAtuais = { resumo, ranking, pagamentos, tamanhos, receita };
}

// --- Funções de Eventos ---

/**
 * Manipula o clique no gráfico de ranking para abrir o modal.
 */
function handleRankingClick(event, elements) {
    if (elements.length > 0) {
        const index = elements[0].index;
        const modelo = dadosAtuais.ranking[index].modelo;
        showProductModal(modelo);
    }
}

/**
 * Mostra o modal de detalhes do produto.
 * @param {string} modelo - Nome do modelo do produto.
 */
function showProductModal(modelo) {
    const detalhes = detalhesProduto(vendasGlobais, modelo);
    document.getElementById('modal-title').textContent = `Detalhes de Vendas: ${modelo}`;

    // 1. Gráfico de Vendas Diárias
    const historico = detalhes.historico;
    modalSalesChart.data.labels = historico.map(item => item.data);
    modalSalesChart.data.datasets[0].data = historico.map(item => item.quantidade);
    modalSalesChart.update();

    // 2. Tabela de Tamanhos
    const sizeTableBody = document.querySelector('#modal-size-table tbody');
    sizeTableBody.innerHTML = '';
    detalhes.tamanhos.forEach(item => {
        const row = sizeTableBody.insertRow();
        row.insertCell().textContent = item.tamanho;
        row.insertCell().textContent = item.quantidade.toLocaleString('pt-BR');
    });

    modal.style.display = 'block';
}

/**
 * Fecha o modal.
 */
function closeProductModal() {
    modal.style.display = 'none';
}

/**
 * Manipula a mudança no seletor de período.
 * Esta é a função que exibe/oculta os campos de data.
 */
function handlePeriodoChange() {
    const isCustom = periodoSelect.value === 'custom';
    dataInicioInput.style.display = isCustom ? 'inline-block' : 'none';
    dataFimInput.style.display = isCustom ? 'inline-block' : 'none';

    if (!isCustom) {
        loadAndRenderData();
    }
}

/**
 * Manipula a impressão do relatório.
 */
function handlePrint() {
    window.print();
}

/**
 * Exporta os dados atuais para CSV.
 */
function exportToCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Resumo
    csvContent += "Métrica,Valor\n";
    csvContent += `Total de Pedidos,${dadosAtuais.resumo.totalPedidos}\n`;
    csvContent += `Total Arrecadado,${dadosAtuais.resumo.totalArrecadado}\n`;
    csvContent += `Ticket Médio,${dadosAtuais.resumo.ticketMedio}\n\n`;

    // Ranking
    csvContent += "Ranking de Produtos,Quantidade,Percentual\n";
    dadosAtuais.ranking.forEach(item => {
        csvContent += `${item.modelo},${item.qtd},${item.percentual.toFixed(2)}%\n`;
    });
    csvContent += "\n";

    // Formas de Pagamento
    csvContent += "Forma de Pagamento,Contagem,Percentual\n";
    dadosAtuais.pagamentos.forEach(item => {
        csvContent += `${item.forma},${item.contagem},${item.percentual.toFixed(2)}%\n`;
    });
    csvContent += "\n";

    // Vendas por Tamanho
    csvContent += "Tamanho,Quantidade,Percentual\n";
    dadosAtuais.tamanhos.forEach(item => {
        csvContent += `${item.tamanho},${item.qtd},${item.percentual.toFixed(2)}%\n`;
    });
    csvContent += "\n";

    // Receita por Período
    csvContent += "Período,Receita\n";
    dadosAtuais.receita.forEach(item => {
        csvContent += `${item.periodo},${item.receita}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "relatorio_estatisticas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Exporta os dados atuais para PDF (simulação, pois Chart.js e jsPDF seriam necessários).
 */
function exportToPDF() {
    alert("Funcionalidade de Exportar PDF não implementada. Seria necessário usar uma biblioteca como jsPDF e html2canvas para capturar os gráficos.");
    // Implementação real envolveria:
    // 1. Capturar os gráficos como imagens (usando chart.js toBase64Image ou html2canvas)
    // 2. Usar jsPDF para criar o documento e adicionar as imagens e tabelas.
}

// --- Inicialização ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar gráficos
    initializeCharts();

    // 2. Buscar dados brutos do backend e configurar eventos
    periodoSelect.addEventListener('change', handlePeriodoChange);
    agrupamentoSelect.addEventListener('change', loadAndRenderData);
    dataInicioInput.addEventListener('change', loadAndRenderData);
    dataFimInput.addEventListener('change', loadAndRenderData);
    printButton.addEventListener('click', handlePrint);
    // Aplicar filtros -> refaz a consulta ao backend com as datas selecionadas
    const btnApply = document.getElementById('apply-filters');
    if (btnApply) btnApply.addEventListener('click', async () => {
        // if custom, take date inputs (with validation)
        let s = null, e = null;
        if (periodoSelect.value === 'custom') {
            const inicioVal = dataInicioInput.value;
            const fimVal = dataFimInput.value;
            const apiErrorEl = document.getElementById('api-error');
            if (!inicioVal || !fimVal) {
                if (apiErrorEl) { apiErrorEl.style.display = 'block'; apiErrorEl.textContent = 'Selecione datas de início e fim válidas.'; }
                return;
            }
            const d1 = new Date(inicioVal);
            const d2 = new Date(fimVal);
            if (!isValidDate(d1) || !isValidDate(d2)) {
                if (apiErrorEl) { apiErrorEl.style.display = 'block'; apiErrorEl.textContent = 'Datas inválidas. Verifique o formato.'; }
                return;
            }
            s = d1.toISOString().split('T')[0];
            e = d2.toISOString().split('T')[0];
        }
        vendasGlobais = await fetchVendasFromApi(s, e);
        loadAndRenderData();
    });
    closeModal.addEventListener('click', closeProductModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeProductModal();
        }
    });
    exportCsvButton.addEventListener('click', exportToCSV);
    exportPdfButton.addEventListener('click', exportToPDF);
    // 3. Buscar vendas do backend e carregar dados (sem fallback para mock)
    fetchVendasFromApi().then(v => {
        vendasGlobais = v || [];
        loadAndRenderData();
    }).catch(err => {
        console.error('Erro ao carregar vendas para estatísticas:', err);
        vendasGlobais = [];
        loadAndRenderData();
    });

    // Back to menu button
    const backBtn = document.getElementById('back-to-menu');
    if (backBtn) backBtn.addEventListener('click', () => { window.location.href = '/'; });
});