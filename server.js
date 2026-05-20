const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const FILE_PATH = path.join(__dirname, 'talleres.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir tus archivos estáticos (tu index.html, style.css, app.js, etc.)
app.use(express.static(__dirname));

const leerTalleres = () => {
    if (!fs.existsSync(FILE_PATH)) return [];
    const data = fs.readFileSync(FILE_PATH, 'utf-8');
    return JSON.parse(data || '[]');
};

// RUTA PARA OBTENER LOS TALLERES
app.get('/api/workshops', (req, res) => {
    res.json(leerTalleres());
});

// RUTA PARA AÑADIR UN TALLER
app.post('/api/workshops', (req, res) => {
    const talleres = leerTalleres();
    const nuevoTaller = {
        id: Date.now().toString(),
        title: req.body.title,
        price: req.body.price,
        date: req.body.date,
        location: req.body.location,
        tags: req.body.tags || [],
        description: req.body.description
    };
    
    talleres.push(nuevoTaller);
    fs.writeFileSync(FILE_PATH, JSON.stringify(talleres, null, 2));
    res.status(201).json({ success: true, workshop: nuevoTaller });
});

// RUTA PARA ELIMINAR UN TALLER
app.delete('/api/workshops/:id', (req, res) => {
    let talleres = leerTalleres();
    talleres = talleres.filter(t => t.id !== req.params.id);
    fs.writeFileSync(FILE_PATH, JSON.stringify(talleres, null, 2));
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Servidor de La Peculiar corriendo en http://localhost:${PORT}`);
});