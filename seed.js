// Script de semilla. Crea 5 categorías, 12 productos y un usuario admin.
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Producto = require('./models/Producto');
const Categoria = require('./models/Categoria');
const Usuario = require('./models/Usuario');

const categoriasIniciales = [
    { idCat: 1, nombre: 'Tecnologia' },
    { idCat: 2, nombre: 'Alimentos' },
    { idCat: 3, nombre: 'Libreria' },
    { idCat: 4, nombre: 'Salud y Belleza' },
    { idCat: 5, nombre: 'Mascotas' }
];

const productosIniciales = [
    {
        nombre: 'Teclado mecanico Redragon',
        precio: 54.99,
        descripcion: 'Teclado mecanico RGB con switches azules, layout en español y estructura metalica resistente.',
        imagen: '',
        stock: 15,
        categoryId: 1
    },
    {
        nombre: 'Monitor Samsung 24 pulgadas',
        precio: 189.00,
        descripcion: 'Monitor LED Full HD de 24 pulgadas con panel IPS, brillo de 250 nits y tiempo de respuesta de 5ms.',
        imagen: '',
        stock: 8,
        categoryId: 1
    },
    {
        nombre: 'Mouse inalambrico Logitech M280',
        precio: 18.50,
        descripcion: 'Mouse inalambrico ergonomico con receptor USB nano, bateria de hasta 18 meses de duracion.',
        imagen: '',
        stock: 40,
        categoryId: 1
    },
    {
        nombre: 'Aceite de oliva extra virgen 500ml',
        precio: 8.75,
        descripcion: 'Aceite de oliva importado prensado en frio, ideal para ensaladas y cocina mediterranea.',
        imagen: '',
        stock: 60,
        categoryId: 2
    },
    {
        nombre: 'Chocolate Pacari 70% cacao',
        precio: 4.50,
        descripcion: 'Barra de chocolate organico ecuatoriano de 50 gramos con 70 porciento de cacao fino de aroma.',
        imagen: '',
        stock: 100,
        categoryId: 2
    },
    {
        nombre: 'Cuaderno universitario A4 200 hojas',
        precio: 3.25,
        descripcion: 'Cuaderno de tapa dura con hojas cuadriculadas, ideal para apuntes de clase y proyectos.',
        imagen: '',
        stock: 80,
        categoryId: 3
    },
    {
        nombre: 'Mochila escolar Totto 25L',
        precio: 45.00,
        descripcion: 'Mochila resistente al agua con compartimento para laptop de 15 pulgadas y bolsillos organizadores.',
        imagen: '',
        stock: 20,
        categoryId: 3
    },
    {
        nombre: 'Estuche de colores Prismacolor 24',
        precio: 22.00,
        descripcion: 'Set de 24 lapices de colores profesionales con pigmentos de alta calidad y mina suave.',
        imagen: '',
        stock: 30,
        categoryId: 3
    },
    {
        nombre: 'Protector solar SPF 50',
        precio: 12.90,
        descripcion: 'Protector solar facial de amplio espectro, resistente al agua y de rapida absorcion.',
        imagen: '',
        stock: 45,
        categoryId: 4
    },
    {
        nombre: 'Shampoo anticaspa Head Shoulders',
        precio: 6.80,
        descripcion: 'Shampoo anticaspa de 375ml con formula clinicamente probada para uso diario.',
        imagen: '',
        stock: 55,
        categoryId: 4
    },
    {
        nombre: 'Alimento para perro adulto 4kg',
        precio: 15.99,
        descripcion: 'Alimento balanceado para perros adultos de todas las razas, enriquecido con vitaminas y minerales.',
        imagen: '',
        stock: 25,
        categoryId: 5
    },
    {
        nombre: 'Rompecabezas 1000 piezas',
        precio: 14.50,
        descripcion: 'Rompecabezas de paisaje natural con piezas de carton grueso, ideal para armar en familia.',
        imagen: '',
        stock: 18,
        categoryId: 3
    }
];

// Ejecuta la semilla conectando a la BD, limpiando y poblando datos
async function ejecutarSemilla() {
    try {
        const urlBD = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mercapp';
        await mongoose.connect(urlBD);
        console.log('Conexion a MongoDB establecida');

        // Limpia las colecciones para evitar duplicados al volver a ejecutar
        await Categoria.deleteMany({});
        await Producto.deleteMany({});
        await Usuario.deleteMany({});
        console.log('Colecciones limpias');

        await Categoria.insertMany(categoriasIniciales);
        console.log('Se insertaron ' + categoriasIniciales.length + ' categorias');

        await Producto.insertMany(productosIniciales);
        console.log('Se insertaron ' + productosIniciales.length + ' productos');

        // Crea el usuario administrador de prueba con contraseña hasheada
        const passHasheada = await bcrypt.hash('admin', 10);
        await Usuario.create({ nomUsu: 'admin', passUsu: passHasheada });
        console.log('Usuario de prueba creado: admin / admin');

        await mongoose.disconnect();
        console.log('Semilla completada con exito');
        process.exit(0);
    } catch (error) {
        console.error('Error al ejecutar la semilla:', error.message);
        process.exit(1);
    }
}

ejecutarSemilla();
