// Esquema del producto en MongoDB
const mongoose = require('mongoose');

const esquemaProducto = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: [true, 'El nombre del producto es obligatorio'],
            trim: true
        },
        precio: {
            type: Number,
            required: [true, 'El precio es obligatorio'],
            min: [0.01, 'El precio debe ser mayor a 0']
        },
        descripcion: {
            type: String,
            trim: true,
            default: ''
        },
        imagen: {
            type: String,
            default: ''
        },
        stock: {
            type: Number,
            default: 0,
            min: [0, 'El stock no puede ser negativo']
        },
        categoryId: {
            type: Number,
            default: 1
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Producto', esquemaProducto);
