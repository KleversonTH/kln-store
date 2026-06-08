const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

// Login admin
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  try {
    if (email !== process.env.ADMIN_EMAIL || senha !== process.env.ADMIN_SENHA) {
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
});

// Listar todos os clientes
router.get('/clientes', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nome, email, criado_em FROM clientes ORDER BY criado_em DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar clientes' });
  }
});

// Listar todos os pedidos
router.get('/pedidos', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.total, p.status, p.criado_em, c.nome AS cliente, c.email
       FROM pedidos p
       JOIN clientes c ON c.id = p.cliente_id
       ORDER BY p.criado_em DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar pedidos' });
  }
});

// Atualizar status do pedido
router.patch('/pedidos/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE pedidos SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar pedido' });
  }
});

module.exports = router;