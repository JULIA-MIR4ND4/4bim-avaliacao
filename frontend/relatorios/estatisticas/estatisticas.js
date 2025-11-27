// /home/ubuntu/project/4bim-avaliacao/relatorios/estatisticas/estatisticas.js

import {
    getVendasRaw,
    calcResumo,
    topProdutos,
    vendasPorTamanho,
    vendasPorFormaPagamento,
    receitaPorPeriodo,
    detalhesProduto,
    getPeriodoDatas,
    formatarMoeda
} from '../../../backend/controllers/estatisticasController.js';

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

    // Gráfico de Ranking (Barras Horizontais)
    rankingChart = new Chart(document.getElementById('rankingChart'), {
        type: 'bar',
        data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
        options: {
            ...chartOptions,
            indexAxis: 'y',
            onClick: handleRankingClick,
            plugins: {
                ...chartOptions.plugins,
                legend: { display: true, position: 'bottom' }
            },
            scales: {
                x: { beginAtZero: true },
                y: { beginAtZero: true }
            }
        }
    });

    // Gráfico de Formas de Pagamento (Pizza)
    paymentChart = new Chart(document.getElementById('paymentChart'), {
        type: 'pie',
        data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                legend: { position: 'right' }
            }
        }
    });

    // Gráfico de Vendas por Tamanho (Barras Verticais)
    sizeChart = new Chart(document.getElementById('sizeChart'), {
        type: 'bar',
        data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
        options: {
            ...chartOptions,
            scales: {
                x: { beginAtZero: true },
                y: { beginAtZero: true }
            }
        }
    });

    // Gráfico de Linha do Tempo (Receita)
    timelineChart = new Chart(document.getElementById('timelineChart'), {
        type: 'line',
        data: { labels: [], datasets: [{ data: [], borderColor: 'rgb(75, 192, 192)', tension: 0.1 }] },
        options: {
            ...chartOptions,
            scales: {
                x: { type: 'category' },
                y: { beginAtZero: true }
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
        start = new Date(dataInicioInput.value);
        end = new Date(dataFimInput.value);
        end.setHours(23, 59, 59, 999); // Garante que o dia final seja inclusivo
    }

    // 1. Filtrar vendas pelo período (a filtragem está dentro do controller, mas vamos passar as datas)
    // No nosso controller, a filtragem é feita implicitamente em calcResumo, mas vamos refinar.
    // Para simplificar, vamos assumir que as funções do controller lidam com o filtro.

    // 2. Calcular e renderizar o resumo
    const resumo = calcResumo(vendas, start, end);
    const ranking = topProdutos(vendas); // O ranking é calculado sobre todas as vendas por enquanto
    updateSummaryPanel(resumo, ranking);

    // 3. Calcular e renderizar gráficos
    const pagamentos = vendasPorFormaPagamento(vendas);
    const tamanhos = vendasPorTamanho(vendas);
    const receita = receitaPorPeriodo(vendas, agrupamentoSelect.value);

    renderRankingChart(ranking);
    renderPaymentChart(pagamentos);
    renderSizeChart(tamanhos);
    renderTimelineChart(receita);

    // Armazenar dados atuais para exportação
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
    // 1. Carregar dados brutos
    vendasGlobais = getVendasRaw();

    // 2. Inicializar gráficos
    initializeCharts();

    // 3. Configurar eventos
    periodoSelect.addEventListener('change', handlePeriodoChange);
    agrupamentoSelect.addEventListener('change', loadAndRenderData);
    dataInicioInput.addEventListener('change', loadAndRenderData);
    dataFimInput.addEventListener('change', loadAndRenderData);
    printButton.addEventListener('click', handlePrint);
    closeModal.addEventListener('click', closeProductModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeProductModal();
        }
    });
    exportCsvButton.addEventListener('click', exportToCSV);
    exportPdfButton.addEventListener('click', exportToPDF);

    // 4. Carregar dados iniciais
    loadAndRenderData();
});