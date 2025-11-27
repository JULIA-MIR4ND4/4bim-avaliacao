// backend/controllers/vendasController.js

/**
 * Mock de dados de vendas para simular a resposta do banco de dados.
 * É o mesmo mock usado no frontend, mas aqui simula a fonte de dados do servidor.
 */
const generateMockSalesData = () => {
    const products = ["Air Max 90", "Jordan 1 Retro", "Adidas Ultraboost", "Nike Dunk Low", "Puma Suede"];
    const payments = ["Cartão", "Pix", "Dinheiro"];
    const statuses = ["Confirmado", "Pendente", "Cancelado"];
    const mockData = [];

    for (let i = 1; i <= 50; i++) { // Gerando mais dados no backend mock
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // Últimos 30 dias
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

const salesData = generateMockSalesData();

/**
 * Retorna todos os dados de vendas.
 * @param {Object} req - Objeto de requisição (pode conter filtros de query).
 * @param {Object} res - Objeto de resposta.
 */
const getAllSales = (req, res) => {
    // Simula a lógica de filtragem do lado do servidor, se houver query params
    let filteredData = [...salesData];

    // Exemplo de filtro por data (simplificado)
    const { startDate, endDate } = req.query;
    if (startDate && endDate) {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        filteredData = filteredData.filter(sale => {
            const saleDate = new Date(sale.data).getTime();
            return saleDate >= start && saleDate <= end;
        });
    }

    // Em um ambiente real, aqui haveria a chamada ao banco de dados
    res.json(filteredData);
};

// Exporta as funções do controller
module.exports = {
    getAllSales,
    // Outras funções como filterSales, getTotals, etc., seriam adicionadas aqui
};
