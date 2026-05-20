require('dotenv').config();
const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de la conexión a Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Probar la conexión al arrancar
pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Error de conexión en Neon:', err.stack);
  }
  console.log('🚀 ¡Conexión exitosa a la base de datos de Neon!');
  release();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir tus archivos estáticos (HTML, CSS, JS del navegador)
app.use(express.static(__dirname));

// ==========================================
// RUTA 1: OBTENER TODOS LOS TALLERES (Para mostrarlos en la web)
// ==========================================
app.get('/api/talleres', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM talleres ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener los talleres de la base de datos' });
  }
});

// ==========================================
// RUTA 2: CREAR UN NUEVO TALLER (Desde el formulario de la clienta)
// ==========================================
app.post('/api/talleres', async (req, res) => {
  const { titulo, categoria, modalidad, fecha, direccion, precio, imagen_url, descripcion } = req.body;
  
  try {
    const query = `
      INSERT INTO talleres (titulo, categoria, modalidad, fecha, direccion, precio, imagen_url, descripcion)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [titulo, categoria, modalidad, fecha, direccion, precio, imagen_url, descripcion];
    const result = await pool.query(query, values);
    
    res.status(201).json({ message: '¡Taller guardado a fuego en Neon!', taller: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar el taller en la base de datos' });
  }
});

// ==========================================
// RUTA 3: APUNTAR A UN CLIENTE A UN TALLER (Reservas)
// ==========================================
app.post('/api/reservas', async (req, res) => {
  const { taller_id, nombre_cliente, email_cliente, telefono_cliente } = req.body;
  
  try {
    const query = `
      INSERT INTO reservas (taller_id, nombre_cliente, email_cliente, telefono_cliente)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [taller_id, nombre_cliente, email_cliente, telefono_cliente];
    const result = await pool.query(query, values);
    
    res.status(201).json({ message: '¡Cliente apuntado con éxito!', reserva: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar la reserva del cliente' });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});