const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { authMiddleware } = require('../middlewares/auth');

// Cadastro
router.post('/cadastro', async (req, res) => {
  const { nome, email, senha } = req.body;
  try {
    const existe = await pool.query('SELECT id FROM clientes WHERE email = $1', [email]);
    if (existe.rows.length > 0) return res.status(400).json({ erro: 'Email já cadastrado' });

    const hash = await bcrypt.hash(senha, 10);
    const result = await pool.query(
      'INSERT INTO clientes (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email',
      [nome, email, hash]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao cadastrar cliente' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  try {
    const result = await pool.query('SELECT * FROM clientes WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(400).json({ erro: 'Email ou senha inválidos' });

    const cliente = result.rows[0];
    const senhaOk = await bcrypt.compare(senha, cliente.senha);
    if (!senhaOk) return res.status(400).json({ erro: 'Email ou senha inválidos' });

    const token = jwt.sign(
      { id: cliente.id, nome: cliente.nome, role: 'cliente' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, cliente: { id: cliente.id, nome: cliente.nome, email: cliente.email } });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
});

// Perfil (autenticado)
router.get('/perfil', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nome, email, criado_em FROM clientes WHERE id = $1', [req.usuario.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar perfil' });
  }
});

module.exports = router;