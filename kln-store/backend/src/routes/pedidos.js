const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware } = require('../middlewares/auth');

// Finalizar pedido (usa itens do carrinho)
router.post('/', authMiddleware, async (req, res) => {
  const cliente_id = req.usuario.id;
  try {
    // Busca itens do carrinho
    const carrinho = await pool.query(
      `SELECT c.produto_id, c.quantidade, p.preco
       FROM carrinho c
       JOIN produtos p ON p.id = c.produto_id
       WHERE c.cliente_id = $1`,
      [cliente_id]
    );

    if (carrinho.rows.length === 0) {
      return res.status(400).json({ erro: 'Carrinho vazio' });
    }

    // Calcula total
    const total = carrinho.rows.reduce((acc, item) => {
      return acc + (parseFloat(item.preco) * item.quantidade);
    }, 0);

    // Cria o pedido
    const pedido = await pool.query(
      'INSERT INTO pedidos (cliente_id, total) VALUES ($1, $2) RETURNING *',
      [cliente_id, total]
    );

    const pedido_id = pedido.rows[0].id;

    // Insere os itens do pedido
    for (const item of carrinho.rows) {
      await pool.query(
        'INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)',
        [pedido_id, item.produto_id, item.quantidade, item.preco]
      );
    }

    // Limpa o carrinho
    await pool.query('DELETE FROM carrinho WHERE cliente_id = $1', [cliente_id]);

    res.status(201).json({ mensagem: 'Pedido criado com sucesso!', pedido: pedido.rows[0] });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar pedido' });
  }
});

// Listar pedidos do cliente
router.get('/', authMiddleware, async (req, res) => {
  try {
    const pedidos = await pool.query(
      'SELECT * FROM pedidos WHERE cliente_id = $1 ORDER BY criado_em DESC',
      [req.usuario.id]
    );
    res.json(pedidos.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar pedidos' });
  }
});

// Detalhe de um pedido
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const pedido = await pool.query(
      'SELECT * FROM pedidos WHERE id = $1 AND cliente_id = $2',
      [req.params.id, req.usuario.id]
    );

    if (pedido.rows.length === 0) return res.status(404).json({ erro: 'Pedido não encontrado' });

    const itens = await pool.query(
      `SELECT pi.quantidade, pi.preco_unitario, p.nome, p.emoji
       FROM pedido_itens pi
       JOIN produtos p ON p.id = pi.produto_id
       WHERE pi.pedido_id = $1`,
      [req.params.id]
    );

    res.json({ ...pedido.rows[0], itens: itens.rows });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar pedido' });
  }
});

module.exports = router;