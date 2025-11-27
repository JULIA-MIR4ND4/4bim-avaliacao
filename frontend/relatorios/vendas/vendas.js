// Arquivo vendas.js - Lógica principal do Relatório de Vendas

// Variáveis globais
let allSalesData = []; // Dados brutos de todas as vendas
let filteredSalesData = []; // Dados após a aplicação dos filtros
let currentPage = 1;
const rowsPerPage = 10;
let currentSort = { column: 'data', direction: 'desc' }; // Ordenação padrão

// -----------------------------------------------------------------------------
// 1. Funções de Utilitário
// -----------------------------------------------------------------------------

/**
 * Formata um valor numérico para a moeda brasileira (BRL).
 * @param {number} value - O valor a ser formatado.
 * @returns {string} O valor formatado como R$ X.XXX,XX.
 */
const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(value);
};

/**
 * Formata uma data/hora para o formato dd/mm/aaaa HH:MM.
 * @param {string} dateString - A string de data (ex: ISO 8601).
 * @returns {string} A data formatada.
 */
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
};

// -----------------------------------------------------------------------------
// 2. Mock de Dados (para localStorage)
// -----------------------------------------------------------------------------

/**
 * Gera um conjunto de dados de vendas mock para testes.
 * @returns {Array<Object>} Um array de objetos de vendas.
 */
const generateMockSalesData = () => {
    const products = ["Air Max 90", "Jordan 1 Retro", "Adidas Ultraboost", "Nike Dunk Low", "Puma Suede"];
    const payments = ["Cartão", "Pix", "Dinheiro"];
    const statuses = ["Confirmado", "Pendente", "Cancelado"];
    const mockData = [];

    for (let i = 1; i <= 25; i++) {
        const date = new Date();
        // Ajusta a data para simular vendas nos últimos 7 dias
        date.setDate(date.getDate() - Math.floor(Math.random() * 7));
        date.setHours(Math.floor(Math.random() * 24));
        date.setMinutes(Math.floor(Math.random() * 60));

        const precoUnit = parseFloat((Math.random() * 300 + 150).toFixed(2));
        const qtd = Math.floor(Math.random() * 3) + 1;
        const total = parseFloat((qtd * precoUnit).toFixed(2));

        mockData.push({
            id: String(1000 + i),
            data: date.toISOString(),
            cliente: Math.random() > 0.3 ? `Cliente ${i}` : "Anônimo",
            produto: products[Math.floor(Math.random() * products.length)],
            numero: String(38 + Math.floor(Math.random() * 5)),
            qtd: qtd,
            precoUnit: precoUnit,
            total: total,
            pagamento: payments[Math.floor(Math.random() * payments.length)],
            status: statuses[Math.floor(Math.random() * statuses.length)],
        });
    }
    return mockData;
};

/**
 * Carrega os dados de vendas, priorizando localStorage.
 */
const loadSalesData = async () => {
    let data = [];
    try {
        const localData = localStorage.getItem('relatorioVendas');
        if (localData) {
            data = JSON.parse(localData);
        } else {
            // Se não houver dados no localStorage, gera mock e salva
            data = generateMockSalesData();
            localStorage.setItem('relatorioVendas', JSON.stringify(data));
        }
    } catch (error) {
        console.error("Erro ao carregar dados do localStorage:", error);
        // Fallback para API (se implementada) ou mock
        // Implementação futura: fetch('/api/vendas')
        data = generateMockSalesData();
    }

    allSalesData = data;
    applyFiltersAndRender();
};

// -----------------------------------------------------------------------------
// 3. Funções de Renderização e Lógica da UI
// -----------------------------------------------------------------------------

/**
 * Renderiza a tabela de vendas com base nos dados filtrados e paginados.
 */
const renderSalesTable = () => {
    const tableBody = document.getElementById('sales-table-body');
    tableBody.innerHTML = '';

    if (filteredSalesData.length === 0) {
        document.getElementById('no-orders-message').style.display = 'block';
        document.getElementById('sales-table').style.display = 'none';
        document.getElementById('pagination-controls').innerHTML = '';
        document.getElementById('sales-table-footer').innerHTML = '';
        return;
    }

    document.getElementById('no-orders-message').style.display = 'none';
    document.getElementById('sales-table').style.display = 'table';

    // Paginação
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedData = filteredSalesData.slice(start, end);

    paginatedData.forEach(item => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td data-label="ID">${item.id}</td>
            <td data-label="Data e Hora">${formatDate(item.data)}</td>
            <td data-label="Cliente">${item.cliente}</td>
            <td data-label="Produto">${item.produto}</td>
            <td data-label="Número">${item.numero}</td>
            <td data-label="Quantidade">${item.qtd}</td>
            <td data-label="Preço Unitário">${formatCurrency(item.precoUnit)}</td>
            <td data-label="Total do Pedido">${formatCurrency(item.total)}</td>
            <td data-label="Forma de Pagamento">${item.pagamento}</td>
            <td data-label="Status">${item.status}</td>
        `;
    });

    renderTotalsRow();
    renderPaginationControls();
};

/**
 * Renderiza a linha de totais abaixo da tabela.
 */
const renderTotalsRow = () => {
    const footer = document.getElementById('sales-table-footer');
    footer.innerHTML = '';

    if (filteredSalesData.length === 0) return;

    const totalOrders = filteredSalesData.length;
    const totalRevenue = filteredSalesData.reduce((sum, item) => sum + item.total, 0);
    const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const row = footer.insertRow();
    row.innerHTML = `
        <td colspan="3">Totais:</td>
        <td colspan="2">Pedidos: ${totalOrders}</td>
        <td colspan="2">Soma Total: ${formatCurrency(totalRevenue)}</td>
        <td colspan="3">Média por Pedido: ${formatCurrency(averageOrder)}</td>
    `;
};

/**
 * Renderiza os controles de paginação.
 */
const renderPaginationControls = () => {
    const controls = document.getElementById('pagination-controls');
    controls.innerHTML = '';

    const totalPages = Math.ceil(filteredSalesData.length / rowsPerPage);

    if (totalPages <= 1) return;

    const prevButton = document.createElement('button');
    prevButton.textContent = 'Anterior';
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            renderSalesTable();
        }
    };

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Próxima';
    nextButton.disabled = currentPage === totalPages;
    nextButton.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderSalesTable();
        }
    };

    const pageInfo = document.createElement('span');
    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;

    controls.appendChild(prevButton);
    controls.appendChild(pageInfo);
    controls.appendChild(nextButton);
};

/**
 * Aplica filtros e ordenação e chama a renderização da tabela e gráficos.
 */
const applyFiltersAndRender = () => {
    // Lógica de filtragem
    let data = [...allSalesData];

    // 1. Filtro de Intervalo de Datas
    const startDate = document.getElementById('date-start').value;
    const endDate = document.getElementById('date-end').value;

    if (startDate && endDate) {
        const start = new Date(startDate).getTime();
        // Adiciona 23:59:59.999 ao final do dia para incluir o dia inteiro
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        const endTimestamp = end.getTime();

        data = data.filter(sale => {
            const saleDate = new Date(sale.data).getTime();
            return saleDate >= start && saleDate <= endTimestamp;
        });
    }

    // 2. Filtro de Forma de Pagamento
    const paymentMethod = document.getElementById('payment-method').value;
    if (paymentMethod) {
        data = data.filter(sale => sale.pagamento === paymentMethod);
    }

    // 3. Filtro de Status
    const statusFilter = document.getElementById('status-filter').value;
    if (statusFilter) {
        data = data.filter(sale => sale.status === statusFilter);
    }

    // 4. Filtro de Busca por Produto/Cliente
    const textSearch = document.getElementById('text-search').value.toLowerCase();
    if (textSearch) {
        data = data.filter(sale =>
            sale.produto.toLowerCase().includes(textSearch) ||
            sale.cliente.toLowerCase().includes(textSearch)
        );
    }

    filteredSalesData = data;

    // Aplica ordenação
    filteredSalesData.sort((a, b) => {
        const col = currentSort.column;
        const dir = currentSort.direction === 'asc' ? 1 : -1;

        let valA = a[col];
        let valB = b[col];

        if (col === 'data') {
            valA = new Date(a.data).getTime();
            valB = new Date(b.data).getTime();
        }

        if (valA < valB) return -1 * dir;
        if (valA > valB) return 1 * dir;
        return 0;
    });

    currentPage = 1; // Volta para a primeira página após filtrar/ordenar
    renderSalesTable();
    renderCharts();
};

// -----------------------------------------------------------------------------
// 4. Inicialização e Event Listeners
// -----------------------------------------------------------------------------

/**
 * Inicializa a página.
 */
const init = () => {
    loadSalesData();

    // Event Listener para o botão de impressão
    document.getElementById('print-button').addEventListener('click', () => {
        window.print();
    });

    // Event Listener para o botão de exportar CSV
    document.getElementById('export-csv-button').addEventListener('click', exportToCSV);

    // Event Listeners para ordenação
    document.querySelectorAll('#sales-table th[data-sort]').forEach(header => {
        header.addEventListener('click', () => {
            const column = header.getAttribute('data-sort');
            let direction = 'asc';

            if (currentSort.column === column) {
                direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            }

            currentSort = { column, direction };
            applyFiltersAndRender();
        });
    });

        // Event Listeners para filtros
    document.getElementById('apply-filters-button').addEventListener('click', applyFiltersAndRender);
    document.getElementById('text-search').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyFiltersAndRender();
        }
    });
};

/**
 * Exporta os dados filtrados para um arquivo CSV.
 */
const exportToCSV = () => {
    if (filteredSalesData.length === 0) {
        alert("Não há dados para exportar.");
        return;
    }

    const headers = [
        "ID do pedido", "Data e Hora", "Cliente", "Produto", "Número",
        "Quantidade", "Preço unitário", "Total do pedido", "Forma de pagamento", "Status"
    ];

    const csvRows = [];
    csvRows.push(headers.join(';')); // Cabeçalho com separador ';'

    for (const item of filteredSalesData) {
        const row = [
            item.id,
            formatDate(item.data),
            item.cliente,
            item.produto,
            item.numero,
            item.qtd,
            item.precoUnit.toFixed(2).replace('.', ','), // Formato numérico para CSV
            item.total.toFixed(2).replace('.', ','),
            item.pagamento,
            item.status
        ];
        csvRows.push(row.join(';'));
    }

    const csvString = csvRows.join('\\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'relatorio_vendas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// -----------------------------------------------------------------------------
// 5. Funções de Gráficos (Chart.js)
// -----------------------------------------------------------------------------

let salesByDayChart;
let paymentMethodChart;

/**
 * Renderiza os gráficos de resumo visual.
 */
const renderCharts = () => {
    // 1. Gráfico de Vendas por Dia (Bar Chart)
    const salesByDay = calculateSalesByDay(filteredSalesData);
    if (salesByDayChart) {
        salesByDayChart.data.labels = salesByDay.labels;
        salesByDayChart.data.datasets[0].data = salesByDay.data;
        salesByDayChart.update();
    } else {
        const ctx = document.getElementById('salesByDayChart').getContext('2d');
        salesByDayChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: salesByDay.labels,
                datasets: [{
                    label: 'Total de Vendas (R$)',
                    data: salesByDay.data,
                    backgroundColor: 'rgba(0, 31, 63, 0.8)', // Cor primária (azul marinho)
                    borderColor: 'rgba(0, 31, 63, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += formatCurrency(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    // 2. Gráfico de Participação por Forma de Pagamento (Pie Chart)
    const paymentDistribution = calculatePaymentDistribution(filteredSalesData);
    if (paymentMethodChart) {
        paymentMethodChart.data.labels = paymentDistribution.labels;
        paymentMethodChart.data.datasets[0].data = paymentDistribution.data;
        paymentMethodChart.update();
    } else {
        const ctx = document.getElementById('paymentMethodChart').getContext('2d');
        paymentMethodChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: paymentDistribution.labels,
                datasets: [{
                    data: paymentDistribution.data,
                    backgroundColor: [
                        'rgba(0, 116, 217, 0.8)', // Azul Claro
                        'rgba(46, 204, 64, 0.8)', // Verde (Pix)
                        'rgba(255, 65, 54, 0.8)'  // Vermelho (Dinheiro)
                    ],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(2) + '%';
                                return `${label}: ${formatCurrency(value)} (${percentage})`;
                            }
                        }
                    }
                }
            }
        });
    }
};

/**
 * Calcula o total de vendas por dia (últimos 7 dias ou intervalo selecionado).
 * @param {Array<Object>} data - Dados de vendas filtrados.
 * @returns {Object} Labels e dados para o gráfico.
 */
const calculateSalesByDay = (data) => {
    const salesMap = new Map();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Inicializa os últimos 7 dias
    const labels = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateString = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        labels.push(dateString);
        salesMap.set(dateString, 0);
    }

    // Soma as vendas
    data.forEach(sale => {
        const saleDate = new Date(sale.data);
        const dateString = saleDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        if (salesMap.has(dateString)) {
            salesMap.set(dateString, salesMap.get(dateString) + sale.total);
        }
    });

    const salesData = labels.map(label => salesMap.get(label) || 0);

    return { labels, data: salesData };
};

/**
 * Calcula a distribuição de vendas por forma de pagamento.
 * @param {Array<Object>} data - Dados de vendas filtrados.
 * @returns {Object} Labels e dados para o gráfico.
 */
const calculatePaymentDistribution = (data) => {
    const paymentMap = new Map();

    data.forEach(sale => {
        const payment = sale.pagamento;
        paymentMap.set(payment, (paymentMap.get(payment) || 0) + sale.total);
    });

    const labels = Array.from(paymentMap.keys());
    const salesData = Array.from(paymentMap.values());

    return { labels, data: salesData };
};

// Inicia a aplicação
document.addEventListener('DOMContentLoaded', init);
