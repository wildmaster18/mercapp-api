// Configuración de Multer para la carga de imágenes de productos
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ruta absoluta a la carpeta de subidas del proyecto
const rutaUploads = path.join(__dirname, '..', 'uploads');

// Crea la carpeta uploads si no existe al iniciar el módulo
if (!fs.existsSync(rutaUploads)) {
    fs.mkdirSync(rutaUploads, { recursive: true });
}

// Almacenamiento en disco dentro de la carpeta uploads
const almacenamiento = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, rutaUploads);
    },
    filename: (req, file, cb) => {
        // Combina fecha y un número aleatorio para evitar nombres duplicados
        const sufijo = Date.now() + '-' + Math.round(Math.random() * 1000000);
        cb(null, sufijo + path.extname(file.originalname));
    }
});

// Acepta únicamente imágenes JPG, JPEG, PNG o GIF
const filtroArchivo = (req, file, cb) => {
    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (tiposPermitidos.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes JPG, PNG o GIF'));
    }
};

// Multer con límite de 5 MB por archivo
const subirImagen = multer({
    storage: almacenamiento,
    fileFilter: filtroArchivo,
    limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = subirImagen;
