const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.json({ mensagem: 'rota clientes ok' }));

module.exports = router;