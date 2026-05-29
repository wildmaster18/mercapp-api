// Esquema de categoría en MongoDB
const mongoose = require('mongoose');

const esquemaCategoria = new mongoose.Schema(
    {
        idCat: {
            type: Number,
            required: true,
            unique: true
        },
        nombre: {
            type: String,
            required: [true, 'El nombre de la categoría es obligatorio'],
            trim: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Categoria', esquemaCategoria);
