require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/clientes', require('./src/routes/clientes'));
app.use('/api/produtos', require('./src/routes/produtos'));
app.use('/api/carrinho', require('./src/routes/carrinho'));
app.use('/api/pedidos', require('./src/routes/pedidos'));
app.use('/api/admin', require('./src/routes/admin'));

app.get('/', (req, res) => res.json({ status: 'KLN STORE API no ar!' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));