// Rutas relacionadas con la autenticación de usuarios
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    mostrarLogin,
    procesarLogin,
    mostrarRegistro,
    procesarRegistro,
    cerrarSesion
} = require('../controllers/authController');

// Validaciones del formulario de inicio de sesión
const validarLogin = [
    body('nomUsu')
        .notEmpty().withMessage('El nombre de usuario es obligatorio'),
    body('passUsu')
        .notEmpty().withMessage('La contraseña es obligatoria')
];

// Validaciones del formulario de registro
const validarRegistro = [
    body('nomUsu')
        .notEmpty().withMessage('El nombre de usuario es obligatorio')
        .isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres'),
    body('passUsu')
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
];

router.get('/login', mostrarLogin);
router.get('/registro', mostrarRegistro);
router.get('/logout', cerrarSesion);

router.post('/login', validarLogin, procesarLogin);
router.post('/registro', validarRegistro, procesarRegistro);

module.exports = router;
