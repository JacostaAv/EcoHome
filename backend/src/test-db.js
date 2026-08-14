const pool = require('./config/database');

async function testConnection() {
    try {
        const result = await pool.query('SELECT NOW()');

        console.log('✅ Conexión exitosa con PostgreSQL');
        console.log('Fecha del servidor:', result.rows[0]);

    } catch (error) {
        console.error('❌ Error de conexión:');
        console.error(error.message);

    } finally {
        await pool.end();
    }
}

testConnection();