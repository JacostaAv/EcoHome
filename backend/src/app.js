const express = require('express');
const cors = require('cors');
const http = require('http');

const { Server } = require('socket.io');

const pool = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const authJWT = require('./middleware/authJWT');
const authorizeRole = require('./middleware/authorizeRole');
const configurarChat = require('./sockets/chatSocket');

const app = express();

app.use(cors({
    origin: 'http://localhost:5173'
}));

app.use(express.json());

app.use(express.static('public'));

app.use('/auth', authRoutes);

// ==========================================
// SERVIDOR HTTP + SOCKET.IO
// ==========================================

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173'
    }
});

configurarChat(io);

// ==========================================
// RUTA DE PRODUCTOS
// ==========================================

app.get('/products', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM products ORDER BY id'
        );

        res.json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Error al consultar los productos'
        });
    }
});

// ==========================================
// RUTA PROTEGIDA
// ==========================================

app.get('/protected', authJWT, (req, res) => {
    res.json({
        message: 'Acceso autorizado',
        user: req.user
    });
});

// ==========================================
// CREAR PRODUCTO
// ==========================================

app.post(
    '/products',
    authJWT,
    authorizeRole('admin'),
    async (req, res) => {

        try {

            const { name, price } = req.body;

            const result = await pool.query(
                `INSERT INTO products (name, price)
                 VALUES ($1, $2)
                 RETURNING *`,
                [name, price]
            );

            res.status(201).json(result.rows[0]);

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error: 'Error al crear producto'
            });
        }
    }
);

// ==========================================
// INICIAR SERVIDOR
// ==========================================

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});