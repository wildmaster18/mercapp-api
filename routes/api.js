// Rutas REST del API. Sirven datos en formato JSON al frontend Vue.
const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const Producto = require("../models/Producto");
const Categoria = require("../models/Categoria");
const subirImagen = require("../config/multer");

// Endpoint de salud para verificar que la API y la BD estan operativas
router.get("/health", async (req, res) => {
  try {
    const estadoBD = mongoose.connection.readyState;
    const estados = { 0: "desconectada", 1: "conectada", 2: "conectando", 3: "desconectando" };
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: estados[estadoBD] || "desconocido",
      uptime: Math.floor(process.uptime()) + "s"
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Convierte un documento de Producto al contrato del API
function mapearProducto(doc, req) {
  let urlImagen;
  if (!doc.imagen) {
    // Sin imagen registrada, usa el placeholder por defecto
    urlImagen = req.protocol + "://" + req.get("host") + "/images/default.jpg";
  } else if (doc.imagen.startsWith("http")) {
    // URL externa guardada directamente, se devuelve sin modificar
    urlImagen = doc.imagen;
  } else {
    // Nombre de archivo local, se construye la URL completa del servidor
    urlImagen =
      req.protocol + "://" + req.get("host") + "/uploads/" + doc.imagen;
  }

  return {
    id: doc._id,
    name: doc.nombre,
    description: doc.descripcion,
    price: doc.precio,
    imageUrl: urlImagen,
    categoryId: doc.categoryId || 1,
    stock: doc.stock || 0,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

// Reglas de validación reutilizadas en POST y PUT
const validarProducto = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ min: 3 })
    .withMessage("El nombre debe tener al menos 3 caracteres"),
  body("price")
    .notEmpty()
    .withMessage("El precio es obligatorio")
    .isFloat({ gt: 0 })
    .withMessage("El precio debe ser mayor a 0"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("La descripción es obligatoria")
    .isLength({ min: 10 })
    .withMessage("La descripción debe tener al menos 10 caracteres"),
  body("categoryId")
    .notEmpty()
    .withMessage("La categoría es obligatoria")
    .isInt({ min: 1 })
    .withMessage("La categoría debe ser un número entero válido"),
  body("stock")
    .optional({ checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage("El stock no puede ser negativo"),
  body("imageUrl")
    .optional({ checkFalsy: true })
    .isURL({ protocols: ["http", "https"] })
    .withMessage("La URL de imagen debe ser válida (http o https)"),
];

// Reglas parciales para PATCH: todos los campos son opcionales
const validarProductoParcial = [
  body("name")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 3 })
    .withMessage("El nombre debe tener al menos 3 caracteres"),
  body("price")
    .optional({ checkFalsy: true })
    .isFloat({ gt: 0 })
    .withMessage("El precio debe ser mayor a 0"),
  body("description")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 10 })
    .withMessage("La descripción debe tener al menos 10 caracteres"),
  body("categoryId")
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage("La categoría debe ser un número entero válido"),
  body("stock")
    .optional({ checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage("El stock no puede ser negativo"),
  body("imageUrl")
    .optional({ checkFalsy: true })
    .isURL({ protocols: ["http", "https"] })
    .withMessage("La URL de imagen debe ser válida (http o https)"),
];

// Captura el error de Multer y lo guarda en req para el handler
function procesarImagen(req, res, next) {
  subirImagen.single("imagen")(req, res, (err) => {
    if (err) {
      req.errorImagen = err.message;
    }
    next();
  });
}

// Devuelve la lista completa de productos
router.get("/products", async (req, res) => {
  try {
    const productos = await Producto.find().sort({ createdAt: -1 });
    const lista = productos.map((p) => mapearProducto(p, req));
    res.json(lista);
  } catch (error) {
    console.error("Error al obtener productos:", error.message);
    res
      .status(500)
      .json({ error: "Error al obtener productos", message: error.message });
  }
});

// Devuelve un producto específico por su id
router.get("/products/:id", async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res.json(mapearProducto(producto, req));
  } catch (error) {
    console.error("Error al obtener producto:", error.message);
    if (error.name === "CastError") {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res
      .status(500)
      .json({ error: "Error al obtener el producto", message: error.message });
  }
});

// Crea un nuevo producto a partir de un FormData
router.post("/products", procesarImagen, validarProducto, async (req, res) => {
  try {
    if (req.errorImagen) {
      return res.status(400).json({
        error: "Validación fallida",
        errors: [{ msg: "Imagen no válida: " + req.errorImagen }],
      });
    }

    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        error: "Validación fallida",
        errors: errores.array(),
      });
    }

    const { name, description, price, categoryId, stock, imageUrl } = req.body;
    // Prioriza el archivo subido; si no hay archivo usa la URL externa enviada
    const valorImagen = req.file
      ? req.file.filename
      : imageUrl
        ? imageUrl.trim()
        : "";
    const nuevoProducto = await Producto.create({
      nombre: name,
      descripcion: description,
      precio: parseFloat(price),
      imagen: valorImagen,
      categoryId: parseInt(categoryId),
      stock: stock ? parseInt(stock) : 0,
    });

    res.status(201).json(mapearProducto(nuevoProducto, req));
  } catch (error) {
    console.error("Error al crear producto:", error.message);
    res
      .status(500)
      .json({ error: "Error al crear producto", message: error.message });
  }
});

// Actualiza un producto completo
router.put(
  "/products/:id",
  procesarImagen,
  validarProducto,
  async (req, res) => {
    try {
      if (req.errorImagen) {
        return res.status(400).json({
          error: "Validación fallida",
          errors: [{ msg: "Imagen no válida: " + req.errorImagen }],
        });
      }

      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        return res.status(400).json({
          error: "Validación fallida",
          errors: errores.array(),
        });
      }

      const { name, description, price, categoryId, stock, imageUrl } =
        req.body;
      const datosActualizados = {
        nombre: name,
        descripcion: description,
        precio: parseFloat(price),
        categoryId: parseInt(categoryId),
        stock: stock !== undefined && stock !== "" ? parseInt(stock) : 0,
      };

      if (req.file) {
        // Archivo nuevo subido, reemplaza la imagen anterior
        datosActualizados.imagen = req.file.filename;
      } else if (imageUrl && imageUrl.trim() !== "") {
        // URL externa proporcionada, se guarda directamente
        datosActualizados.imagen = imageUrl.trim();
      }

      const productoActualizado = await Producto.findByIdAndUpdate(
        req.params.id,
        datosActualizados,
        { new: true, runValidators: true },
      );

      if (!productoActualizado) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      res.json(mapearProducto(productoActualizado, req));
    } catch (error) {
      console.error("Error al actualizar producto:", error.message);
      if (error.name === "CastError") {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      res
        .status(500)
        .json({
          error: "Error al actualizar producto",
          message: error.message,
        });
    }
  },
);

// Actualiza parcialmente un producto
router.patch(
  "/products/:id",
  procesarImagen,
  validarProductoParcial,
  async (req, res) => {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        return res.status(400).json({
          error: "Validación fallida",
          errors: errores.array(),
        });
      }

      const datosActualizados = {};
      if (req.body.name) datosActualizados.nombre = req.body.name;
      if (req.body.description)
        datosActualizados.descripcion = req.body.description;
      if (req.body.price) datosActualizados.precio = parseFloat(req.body.price);
      if (req.body.categoryId)
        datosActualizados.categoryId = parseInt(req.body.categoryId);
      if (req.body.stock !== undefined && req.body.stock !== "") {
        datosActualizados.stock = parseInt(req.body.stock);
      }

      if (req.file) {
        // Archivo nuevo subido, reemplaza la imagen anterior
        datosActualizados.imagen = req.file.filename;
      } else if (req.body.imageUrl && req.body.imageUrl.trim() !== "") {
        // URL externa proporcionada, se guarda directamente
        datosActualizados.imagen = req.body.imageUrl.trim();
      }

      const productoActualizado = await Producto.findByIdAndUpdate(
        req.params.id,
        datosActualizados,
        { new: true, runValidators: true },
      );

      if (!productoActualizado) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      res.json(mapearProducto(productoActualizado, req));
    } catch (error) {
      console.error("Error al actualizar producto:", error.message);
      if (error.name === "CastError") {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      res
        .status(500)
        .json({
          error: "Error al actualizar producto",
          message: error.message,
        });
    }
  },
);

// Elimina un producto por su id
router.delete("/products/:id", async (req, res) => {
  try {
    const productoEliminado = await Producto.findByIdAndDelete(req.params.id);
    if (!productoEliminado) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res.json({
      message: "Producto eliminado correctamente",
      product: { id: productoEliminado._id, name: productoEliminado.nombre },
    });
  } catch (error) {
    console.error("Error al eliminar producto:", error.message);
    if (error.name === "CastError") {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res
      .status(500)
      .json({ error: "Error al eliminar producto", message: error.message });
  }
});

// Devuelve todas las categorías
router.get("/categories", async (req, res) => {
  try {
    const categorias = await Categoria.find().sort({ idCat: 1 });
    const lista = categorias.map((c) => ({ id: c.idCat, name: c.nombre }));
    res.json(lista);
  } catch (error) {
    console.error("Error al obtener categorías:", error.message);
    res
      .status(500)
      .json({ error: "Error al obtener categorías", message: error.message });
  }
});

// Crea una nueva categoría con un id autoincremental
router.post(
  "/categories",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("El nombre de la categoría es obligatorio")
      .isLength({ min: 2 })
      .withMessage("El nombre debe tener al menos 2 caracteres"),
  ],
  async (req, res) => {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        return res
          .status(400)
          .json({ error: "Validación fallida", errors: errores.array() });
      }

      // Calcula el siguiente idCat buscando el máximo existente
      const ultima = await Categoria.findOne().sort({ idCat: -1 });
      const nuevoId = ultima ? ultima.idCat + 1 : 1;

      const nuevaCat = await Categoria.create({
        idCat: nuevoId,
        nombre: req.body.name.trim(),
      });

      res.status(201).json({ id: nuevaCat.idCat, name: nuevaCat.nombre });
    } catch (error) {
      console.error("Error al crear categoría:", error.message);
      res.status(500).json({ error: "Error al crear categoría" });
    }
  },
);

// Procesa la compra: descuenta el stock de cada producto del carrito
router.post("/checkout", async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "El carrito está vacío" });
    }

    // Recorre cada item y descuenta la cantidad comprada del stock
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const producto = await Producto.findById(item.id);
      if (!producto) continue;

      const nuevoStock = producto.stock - item.cantidad;
      producto.stock = nuevoStock >= 0 ? nuevoStock : 0;
      await producto.save();
    }

    res.json({ message: "Compra procesada correctamente" });
  } catch (error) {
    console.error("Error al procesar la compra:", error.message);
    res.status(500).json({ error: "Error al procesar la compra" });
  }
});

// AUTENTICACIÓN JSON PARA LA SPA

const Usuario = require("../models/Usuario");
const bcrypt = require("bcrypt");

// Registra un nuevo usuario y devuelve confirmación en JSON
router.post(
  "/auth/register",
  [
    body("nomUsu")
      .trim()
      .notEmpty()
      .withMessage("El nombre de usuario es obligatorio")
      .isLength({ min: 3 })
      .withMessage("El nombre debe tener al menos 3 caracteres"),
    body("passUsu")
      .isLength({ min: 6 })
      .withMessage("La contraseña debe tener al menos 6 caracteres"),
  ],
  async (req, res) => {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        return res
          .status(400)
          .json({ error: "Validación fallida", errors: errores.array() });
      }

      const { nomUsu, passUsu } = req.body;
      const existe = await Usuario.findOne({ nomUsu });
      if (existe) {
        return res
          .status(400)
          .json({ error: "El nombre de usuario ya está en uso" });
      }

      // Cifra la contraseña antes de almacenarla
      const passHasheada = await bcrypt.hash(passUsu, 10);
      const nuevoUsuario = await Usuario.create({
        nomUsu,
        passUsu: passHasheada,
      });

      // Guarda la sesión del usuario recién registrado
      req.session.usuario = {
        id: nuevoUsuario._id,
        nomUsu: nuevoUsuario.nomUsu,
      };

      res.status(201).json({
        message: "Usuario registrado correctamente",
        user: { id: nuevoUsuario._id, nomUsu: nuevoUsuario.nomUsu },
      });
    } catch (error) {
      console.error("Error al registrar:", error.message);
      res.status(500).json({ error: "Error al registrar usuario" });
    }
  },
);

// Inicia sesión y devuelve los datos del usuario en JSON
router.post(
  "/auth/login",
  [
    body("nomUsu")
      .notEmpty()
      .withMessage("El nombre de usuario es obligatorio"),
    body("passUsu").notEmpty().withMessage("La contraseña es obligatoria"),
  ],
  async (req, res) => {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        return res
          .status(400)
          .json({ error: "Validación fallida", errors: errores.array() });
      }

      const { nomUsu, passUsu } = req.body;
      const usuario = await Usuario.findOne({ nomUsu });
      if (!usuario) {
        return res
          .status(401)
          .json({ error: "Usuario o contraseña incorrectos" });
      }

      // Compara la contraseña enviada con el hash almacenado
      const passCorrecta = await bcrypt.compare(passUsu, usuario.passUsu);
      if (!passCorrecta) {
        return res
          .status(401)
          .json({ error: "Usuario o contraseña incorrectos" });
      }

      // Almacena los datos del usuario en la sesión
      req.session.usuario = { id: usuario._id, nomUsu: usuario.nomUsu };

      res.json({
        message: "Inicio de sesión exitoso",
        user: { id: usuario._id, nomUsu: usuario.nomUsu },
      });
    } catch (error) {
      console.error("Error en login:", error.message);
      res.status(500).json({ error: "Error al iniciar sesión" });
    }
  },
);

// Cierra la sesión activa del usuario
router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Sesión cerrada correctamente" });
  });
});

// Devuelve los datos del usuario autenticado o null
router.get("/auth/me", (req, res) => {
  if (req.session && req.session.usuario) {
    res.json({ user: req.session.usuario });
  } else {
    res.json({ user: null });
  }
});

module.exports = router;
