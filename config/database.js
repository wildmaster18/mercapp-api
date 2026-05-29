// Conexión a MongoDB usando Mongoose
const mongoose = require('mongoose');

const conectarBD = async () => {
    try {
        const urlBD = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mercapp';
        await mongoose.connect(urlBD);
        console.log('Conexión a MongoDB establecida correctamente');
    } catch (error) {
        console.error('Error al conectar con MongoDB:', error.message);
        process.exit(1);
    }
};

module.exports = conectarBD;
