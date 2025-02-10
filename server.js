const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(session({
    secret: 'segredo-super-seguro',
    resave: false,
    saveUninitialized: true
}));

// Servir a homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'homepage.html'));
});

// Verificar se o usuário está logado
app.get('/api/check-login', (req, res) => {
    if (req.session.usuario) {
        res.json({ loggedIn: true, usuario: req.session.usuario });
    } else {
        res.json({ loggedIn: false });
    }
});

// Realizar login
app.post('/api/login', (req, res) => {
    const { usuario } = req.body;

    if (usuario && usuario.trim() !== '') {
        req.session.usuario = usuario;
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
