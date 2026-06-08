const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware } = require('../middlewares/auth');

// Ver carrinho do cliente
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, p.nome, p.preco, p.emoji, c.quantidade,
       (p.preco * c.quantidade) AS subtotal
       FROM carrinho c
       JOIN produtos p ON p.id = c.produto_id
       WHERE c.cliente_id = $1`,
      [req.usuario.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar carrinho' });
  }
});

// Adicionar produto ao carrinho
router.post('/', authMiddleware, async (req, res) => {
  const { produto_id, quantidade } = req.body;
  try {
    const existe = await pool.query(
      'SELECT id FROM carrinho WHERE cliente_id = $1 AND produto_id = $2',
      [req.usuario.id, produto_id]
    );

    if (existe.rows.length > 0) {
      await pool.query(
        'UPDATE carrinho SET quantidade = quantidade + $1 WHERE cliente_id = $2 AND produto_id = $3',
        [quantidade || 1, req.usuario.id, produto_id]
      );
    } else {
      await pool.query(
        'INSERT INTO carrinho (cliente_id, produto_id, quantidade) VALUES ($1, $2, $3)',
        [req.usuario.id, produto_id, quantidade || 1]
      );
    }

    res.json({ mensagem: 'Produto adicionado ao carrinho' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao adicionar ao carrinho' });
  }
});

// Remover produto do carrinho
router.delete('/:produto_id', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM carrinho WHERE cliente_id = $1 AND produto_id = $2',
      [req.usuario.id, req.params.produto_id]
    );
    res.json({ mensagem: 'Produto removido do carrinho' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao remover do carrinho' });
  }
});

// Limpar carrinho
router.delete('/', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM carrinho WHERE cliente_id = $1', [req.usuario.id]);
    res.json({ mensagem: 'Carrinho limpo' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao limpar carrinho' });
  }
});

module.exports = router;