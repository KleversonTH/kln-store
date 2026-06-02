const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.json({ mensagem: 'rota admin ok' }));

module.exports = router;