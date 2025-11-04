const db = require('../database');

exports.registrarPagamento = async (req, res) => {
    try {
        const { id_pedido, id_forma_pagamento } = req.body;

        if (!id_pedido || !id_forma_pagamento) {
            return res.status(400).json({ error: 'ID do pedido, tipo de pagamento e ID da forma de pagamento são obrigatórios' });
        }

        // Calcular o valor total do pagamento
        const valorTotalResult = await db.query(
            `SELECT SUM(p.preco_unitario * pp.quantidade) AS valor_total
             FROM pedidohastenis pp
             JOIN produto p ON pp.id_tenis = p.id_tenis
             WHERE pp.id_pedido = $1`,
            [id_pedido]
        );

        const valorTotal = valorTotalResult.rows[0].valor_total;

        if (!valorTotal) {
            return res.status(400).json({ error: 'Não foi possível calcular o valor total do pedido' });
        }

        // Inserir o pagamento na tabela Pagamento
        const data_pagamento = new Date();
        await db.query(
            `INSERT INTO Pagamento (id_pedido, data_pagamento, valor_total_pagamento, status_pagamento) 
             VALUES ($1, $2, $3, 'concluido')`,
            [id_pedido, data_pagamento, valorTotal]
        );

        // Inserir a forma de pagamento na tabela PagamentoHasFormaPagamento
        await db.query(
            `INSERT INTO PagamentoHasFormaPagamento (id_pedido, id_forma_pagamento, valor_pago) 
             VALUES ($1, $2, $3)`,
            [id_pedido, id_forma_pagamento, valorTotal]
        );

        
        res.status(200).json({ message: 'Pagamento registrado e pedido concluído com sucesso!' });
    } catch (error) {
        console.error('Erro ao registrar pagamento:', error);
        res.status(500).json({ error: 'Erro ao registrar pagamento' });
    }
};