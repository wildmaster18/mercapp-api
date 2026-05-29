// Controlador de autenticación: registro, inicio y cierre de sesión
const Usuario = require('../models/Usuario');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');

// Muestra el formulario de inicio de sesión
const mostrarLogin = (req, res) => {
    if (req.session && req.session.usuario) {
        return res.redirect('/productos');
    }
    res.render('auth/login');
};

// Procesa el formulario de inicio de sesión
const procesarLogin = async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.render('auth/login', {
            errores: errores.array(),
            datos: req.body
        });
    }

    try {
        const { nomUsu, passUsu } = req.body;
        const usuarioEncontrado = await Usuario.findOne({ nomUsu });

        if (!usuarioEncontrado) {
            return res.render('auth/login', {
                error: 'Usuario o contraseña incorrectos',
                datos: req.body
            });
        }

        // Compara la contraseña enviada con el hash almacenado
        const passCorrecta = await bcrypt.compare(passUsu, usuarioEncontrado.passUsu);
        if (!passCorrecta) {
            return res.render('auth/login', {
                error: 'Usuario o contraseña incorrectos',
                datos: req.body
            });
        }

        // Almacena los datos básicos del usuario en la sesión
        req.session.usuario = {
            id: usuarioEncontrado._id,
            nomUsu: usuarioEncontrado.nomUsu
        };

        res.redirect('/productos');
    } catch (error) {
        console.error('Error al procesar el login:', error.message);
        res.status(500).render('auth/login', {
            error: 'Error interno del servidor',
            datos: req.body
        });
    }
};

// Muestra el formulario de registro de nuevo usuario
const mostrarRegistro = (req, res) => {
    if (req.session && req.session.usuario) {
        return res.redirect('/productos');
    }
    res.render('auth/registro');
};

// Procesa el formulario de registro
const procesarRegistro = async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.render('auth/registro', {
            errores: errores.array(),
            datos: req.body
        });
    }

    try {
        const { nomUsu, passUsu } = req.body;
        const usuarioExiste = await Usuario.findOne({ nomUsu });

        if (usuarioExiste) {
            return res.render('auth/registro', {
                error: 'El nombre de usuario ya está en uso',
                datos: req.body
            });
        }

        // Cifra la contraseña antes de almacenarla
        const passHasheada = await bcrypt.hash(passUsu, 10);
        await Usuario.create({ nomUsu, passUsu: passHasheada });

        res.redirect('/auth/login');
    } catch (error) {
        console.error('Error al registrar usuario:', error.message);
        res.status(500).render('auth/registro', {
            error: 'Error interno del servidor',
            datos: req.body
        });
    }
};

// Cierra la sesión activa del usuario
const cerrarSesion = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/auth/login');
    });
};

module.exports = {
    mostrarLogin,
    procesarLogin,
    mostrarRegistro,
    procesarRegistro,
    cerrarSesion
};
