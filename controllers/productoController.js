// Controlador de productos para las vistas Handlebars
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const { validationResult } = require('express-validator');

// Lista todos los productos ordenados por fecha de creación
const listarProductos = async (req, res) => {
    try {
        const productos = await Producto.find().sort({ createdAt: -1 });
        res.render('productos/lista', {
            productos,
            usuario: req.session.usuario
        });
    } catch (error) {
        console.error('Error al listar productos:', error.message);
        res.status(500).send('Error al obtener los productos');
    }
};

// Muestra el formulario para crear un nuevo producto
const mostrarFormNuevo = async (req, res) => {
    try {
        const categorias = await Categoria.find().sort({ idCat: 1 });
        res.render('productos/nuevo', {
            categorias,
            usuario: req.session.usuario
        });
    } catch (error) {
        console.error('Error al cargar categorías:', error.message);
        res.render('productos/nuevo', {
            categorias: [],
            usuario: req.session.usuario
        });
    }
};

// Guarda un nuevo producto en la base de datos
const crearProducto = async (req, res) => {
    const errores = validationResult(req);
    const categorias = await Categoria.find().sort({ idCat: 1 });

    // Trata el error de Multer como un error de validación más
    if (!errores.isEmpty() || req.errorImagen) {
        const listaErrores = errores.array();
        if (req.errorImagen) {
            listaErrores.push({ msg: 'Imagen no válida: ' + req.errorImagen });
        }
        return res.render('productos/nuevo', {
            errores: listaErrores,
            datos: req.body,
            categorias,
            usuario: req.session.usuario
        });
    }

    try {
        const { nombre, precio, descripcion, stock, categoryId } = req.body;
        const nomImagen = req.file ? req.file.filename : '';

        await Producto.create({
            nombre,
            precio,
            descripcion,
            imagen: nomImagen,
            stock: stock ? parseInt(stock) : 0,
            categoryId: categoryId ? parseInt(categoryId) : 1
        });

        res.redirect('/productos');
    } catch (error) {
        console.error('Error al crear el producto:', error.message);
        res.status(500).render('productos/nuevo', {
            error: 'Error al guardar el producto',
            datos: req.body,
            categorias,
            usuario: req.session.usuario
        });
    }
};

// Carga el formulario de edición con los datos actuales del producto
const mostrarFormEditar = async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id);
        if (!producto) {
            return res.redirect('/productos');
        }

        const categorias = await Categoria.find().sort({ idCat: 1 });
        res.render('productos/editar', {
            producto,
            categorias,
            usuario: req.session.usuario
        });
    } catch (error) {
        console.error('Error al buscar producto para editar:', error.message);
        res.redirect('/productos');
    }
};

// Actualiza los datos de un producto existente
const actualizarProducto = async (req, res) => {
    const errores = validationResult(req);

    if (!errores.isEmpty() || req.errorImagen) {
        try {
            const listaErrores = errores.array();
            if (req.errorImagen) {
                listaErrores.push({ msg: 'Imagen no válida: ' + req.errorImagen });
            }
            const producto = await Producto.findById(req.params.id);
            const categorias = await Categoria.find().sort({ idCat: 1 });
            return res.render('productos/editar', {
                errores: listaErrores,
                producto,
                categorias,
                usuario: req.session.usuario
            });
        } catch (errorBusqueda) {
            return res.redirect('/productos');
        }
    }

    try {
        const { nombre, precio, descripcion, stock, categoryId } = req.body;
        const datosActualizados = {
            nombre,
            precio,
            descripcion,
            stock: stock ? parseInt(stock) : 0,
            categoryId: categoryId ? parseInt(categoryId) : 1
        };

        // Reemplaza la imagen solo cuando el usuario sube una nueva
        if (req.file) {
            datosActualizados.imagen = req.file.filename;
        }

        await Producto.findByIdAndUpdate(req.params.id, datosActualizados, {
            new: true,
            runValidators: true
        });

        res.redirect('/productos');
    } catch (error) {
        console.error('Error al actualizar el producto:', error.message);
        res.redirect('/productos');
    }
};

// Elimina el producto seleccionado
const eliminarProducto = async (req, res) => {
    try {
        await Producto.findByIdAndDelete(req.params.id);
        res.redirect('/productos');
    } catch (error) {
        console.error('Error al eliminar el producto:', error.message);
        res.redirect('/productos');
    }
};

module.exports = {
    listarProductos,
    mostrarFormNuevo,
    crearProducto,
    mostrarFormEditar,
    actualizarProducto,
    eliminarProducto
};
