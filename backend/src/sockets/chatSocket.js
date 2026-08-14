const jwt = require('jsonwebtoken');
const pool = require('../config/database');

function configurarChat(io) {

    // ==========================================
    // AUTENTICACIÓN DEL SOCKET
    // ==========================================

    io.use((socket, next) => {

        try {

            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Token no proporcionado'));
            }

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            socket.user = decoded;

            next();

        } catch (error) {

            console.error(
                '❌ Error de autenticación Socket.IO'
            );

            next(new Error('Token inválido o expirado'));
        }

    });

    // ==========================================
    // CONEXIÓN
    // ==========================================

    io.on('connection', async (socket) => {

        console.log(
            `🟢 Usuario conectado: ${socket.user.email} | ID: ${socket.user.id}`
        );

        // ==========================================
        // ENVIAR ÚLTIMOS 10 MENSAJES
        // ==========================================

        try {

            const result = await pool.query(
                `SELECT
                    m.id,
                    m.user_id,
                    u.name AS username,
                    m.text,
                    m.created_at
                 FROM messages m
                 INNER JOIN users u
                    ON m.user_id = u.id
                 ORDER BY m.id DESC
                 LIMIT 10`
            );

            const history = result.rows.reverse();

            socket.emit('message-history', history);

            console.log(
                `📚 Historial enviado: ${history.length} mensajes`
            );

        } catch (error) {

            console.error(
                '❌ Error al cargar historial:',
                error
            );

        }

        // ==========================================
        // NUEVO MENSAJE
        // ==========================================

        socket.on('new-message', async (message) => {

            try {

                if (!message || message.trim() === '') {
                    return;
                }

                const result = await pool.query(
                    `INSERT INTO messages (user_id, text)
                     VALUES ($1, $2)
                     RETURNING id, user_id, text, created_at`,
                    [
                        socket.user.id,
                        message.trim()
                    ]
                );

                const savedMessage = result.rows[0];

                console.log(
                    `💾 Mensaje guardado - Usuario: ${socket.user.id}`
                );

                // Obtener nombre del usuario
                const userResult = await pool.query(
                    `SELECT name
                     FROM users
                     WHERE id = $1`,
                    [socket.user.id]
                );

                const username = userResult.rows[0].name;

                io.emit('new-message', {
                    id: savedMessage.id,
                    user_id: savedMessage.user_id,
                    username: username,
                    text: savedMessage.text,
                    created_at: savedMessage.created_at
                });

            } catch (error) {

                console.error(
                    '❌ Error al guardar mensaje:',
                    error
                );

            }

        });

        // ==========================================
        // DESCONEXIÓN
        // ==========================================

        socket.on('disconnect', () => {

            console.log(
                `🔴 Usuario desconectado: ${socket.user.email}`
            );

        });

    });

}

module.exports = configurarChat;