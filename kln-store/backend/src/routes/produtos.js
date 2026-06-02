const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

// Listar todos os produtos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM produtos ORDER BY criado_em DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar produtos' });
  }
});

// Buscar produto por ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM produtos WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ erro: 'Produto não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar produto' });
  }
});

// Criar produto (admin)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  const { nome, descricao, preco, preco_antigo, estoque, categoria, emoji, destaque } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO produtos (nome, descricao, preco, preco_antigo, estoque, categoria, emoji, destaque) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [nome, descricao, preco, preco_antigo, estoque, categoria, emoji, destaque]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar produto' });
  }
});

// Editar produto (admin)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { nome, descricao, preco, preco_antigo, estoque, categoria, emoji, destaque } = req.body;
  try {
    const result = await pool.query(
      'UPDATE produtos SET nome=$1, descricao=$2, preco=$3, preco_antigo=$4, estoque=$5, categoria=$6, emoji=$7, destaque=$8 WHERE id=$9 RETURNING *',
      [nome, descricao, preco, preco_antigo, estoque, categoria, emoji, destaque, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ erro: 'Produto não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao editar produto' });
  }
});

// Deletar produto (admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM produtos WHERE id = $1', [req.params.id]);
    res.json({ mensagem: 'Produto deletado com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao deletar produto' });
  }
});

module.exports = router;