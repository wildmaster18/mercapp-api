// Rutas de productos para las vistas Handlebars
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const verificarSesion = require('../middlewares/verificarSesion');
const subirImagen = require('../config/multer');
const {
    listarProductos,
    mostrarFormNuevo,
    crearProducto,
    mostrarFormEditar,
    actualizarProducto,
    eliminarProducto
} = require('../controllers/productoController');

// Reglas comunes para los formularios de crear y editar
const validarProducto = [
    body('nombre')
        .notEmpty().withMessage('El nombre del producto es obligatorio')
        .isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres'),
    body('precio')
        .notEmpty().withMessage('El precio es obligatorio')
        .isFloat({ gt: 0 }).withMessage('El precio debe ser mayor a 0'),
    body('descripcion')
        .optional({ checkFalsy: true })
        .isLength({ min: 10 }).withMessage('La descripción debe tener al menos 10 caracteres'),
    body('stock')
        .optional({ checkFalsy: true })
        .isInt({ min: 0 }).withMessage('El stock no puede ser negativo'),
    body('categoryId')
        .notEmpty().withMessage('La categoría es obligatoria')
];

// Captura el error de Multer y lo expone al controlador
function procesarImagen(req, res, next) {
    subirImagen.single('imagen')(req, res, (err) => {
        if (err) {
            req.errorImagen = err.message;
        }
        next();
    });
}

router.get('/', verificarSesion, listarProductos);
router.get('/nuevo', verificarSesion, mostrarFormNuevo);
router.post('/', verificarSesion, procesarImagen, validarProducto, crearProducto);
router.get('/editar/:id', verificarSesion, mostrarFormEditar);
router.post('/editar/:id', verificarSesion, procesarImagen, validarProducto, actualizarProducto);
router.post('/eliminar/:id', verificarSesion, eliminarProducto);

module.exports = router;
