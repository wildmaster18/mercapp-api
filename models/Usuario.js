// Esquema del usuario en MongoDB
const mongoose = require('mongoose');

const esquemaUsuario = new mongoose.Schema(
    {
        nomUsu: {
            type: String,
            required: [true, 'El nombre de usuario es obligatorio'],
            unique: true,
            trim: true
        },
        passUsu: {
            type: String,
            required: [true, 'La contraseña es obligatoria']
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Usuario', esquemaUsuario);
