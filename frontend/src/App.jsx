import { useState } from 'react';
import { io } from 'socket.io-client';
import './App.css';

const API_URL = 'http://localhost:3000';

function App() {

    const [token, setToken] = useState(
        localStorage.getItem('token')
    );

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');

    const [connected, setConnected] = useState(false);

    // ==========================================
    // LOGIN
    // ==========================================

    const handleLogin = async (e) => {

        e.preventDefault();

        setError('');

        try {

            const response = await fetch(
                `${API_URL}/auth/login`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || 'Error al iniciar sesión'
                );
            }

            localStorage.setItem(
                'token',
                data.token
            );

            setToken(data.token);

            conectarSocket(data.token);

        } catch (error) {

            setError(error.message);

        }

    };

    // ==========================================
    // SOCKET.IO
    // ==========================================

    const conectarSocket = (jwtToken) => {

        const newSocket = io(API_URL, {
            auth: {
                token: jwtToken
            }
        });

        newSocket.on('connect', () => {

            console.log(
                '🟢 Socket conectado:',
                newSocket.id
            );

            setConnected(true);

        });

        newSocket.on(
            'connect_error',
            (error) => {

                console.error(
                    'Error de conexión:',
                    error.message
                );

                setConnected(false);

            }
        );

        // Historial
        newSocket.on(
            'message-history',
            (history) => {

                setMessages(history);

            }
        );

        // Mensajes nuevos
        newSocket.on(
            'new-message',
            (newMessage) => {

                setMessages(
                    (currentMessages) => [
                        ...currentMessages,
                        newMessage
                    ]
                );

            }
        );

        setSocket(newSocket);

    };

    // ==========================================
    // CONECTAR AUTOMÁTICAMENTE SI EXISTE TOKEN
    // ==========================================

    if (token && !socket) {
        conectarSocket(token);
    }

    // ==========================================
    // ENVIAR MENSAJE
    // ==========================================

    const enviarMensaje = () => {

        if (
            !socket ||
            message.trim() === ''
        ) {
            return;
        }

        socket.emit(
            'new-message',
            message
        );

        setMessage('');

    };

    // ==========================================
    // LOGOUT
    // ==========================================

    const cerrarSesion = () => {

        if (socket) {
            socket.disconnect();
        }

        localStorage.removeItem('token');

        setToken(null);
        setSocket(null);
        setMessages([]);
        setConnected(false);

    };

    // ==========================================
    // LOGIN
    // ==========================================

    if (!token) {

        return (
            <div className="login-container">

                <div className="login-card">

                    <h1>EcoHome Store</h1>

                    <h2>Chat interno</h2>

                    <form onSubmit={handleLogin}>

                        <input
                            type="email"
                            placeholder="Correo electrónico"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            required
                        />

                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            required
                        />

                        <button type="submit">
                            Iniciar sesión
                        </button>

                    </form>

                    {error && (
                        <p className="error">
                            {error}
                        </p>
                    )}

                </div>

            </div>
        );

    }

    // ==========================================
    // CHAT
    // ==========================================

    return (
        <div className="chat-container">

            <header className="chat-header">

                <div>
                    <h1>EcoHome Store</h1>
                    <span>
                        Chat interno
                    </span>
                </div>

                <div>

                    <span
                        className={
                            connected
                                ? 'status connected'
                                : 'status'
                        }
                    >
                        {connected
                            ? '🟢 Conectado'
                            : '🔴 Desconectado'}
                    </span>

                    <button
                        onClick={cerrarSesion}
                    >
                        Cerrar sesión
                    </button>

                </div>

            </header>

            <main className="messages">

                {messages.length === 0 ? (

                    <p>
                        No hay mensajes disponibles.
                    </p>

                ) : (

                    messages.map((msg) => (

                        <div
                            className="message"
                            key={msg.id}
                        >

                            <strong>
                                {msg.username}
                            </strong>

                            <p>
                                {msg.text}
                            </p>

                            <small>
                                {new Date(
                                    msg.created_at
                                ).toLocaleString()}
                            </small>

                        </div>

                    ))

                )}

            </main>

            <footer className="message-input">

                <input
                    type="text"
                    placeholder="Escribe un mensaje..."
                    value={message}
                    onChange={(e) =>
                        setMessage(e.target.value)
                    }
                    onKeyDown={(e) => {

                        if (e.key === 'Enter') {
                            enviarMensaje();
                        }

                    }}
                />

                <button
                    onClick={enviarMensaje}
                >
                    Enviar
                </button>

            </footer>

        </div>
    );
}

export default App;