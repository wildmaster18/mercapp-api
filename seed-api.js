// Script que inserta datos de prueba llamando a la API en produccion
// Ejecutar con: node seed-api.js

const URL_BASE = 'https://mercapp-api-production-56c5.up.railway.app'

const categorias = [
    'Tecnologia',
    'Alimentos',
    'Libreria',
    'Salud y Belleza',
    'Mascotas'
]

const productos = [
    { name: 'Teclado mecanico Redragon', price: 54.99, description: 'Teclado mecanico RGB con switches azules, ideal para gaming', stock: 15, catIndex: 0 },
    { name: 'Mouse gaming Logitech G203', price: 29.99, description: 'Mouse gaming con iluminacion LIGHTSYNC RGB y 6 botones programables', stock: 20, catIndex: 0 },
    { name: 'Audifonos Sony WH-1000XM4', price: 199.99, description: 'Audifonos inalambricos con cancelacion de ruido de alta calidad', stock: 8, catIndex: 0 },
    { name: 'Arroz integral El Granjero 1kg', price: 3.50, description: 'Arroz integral de grano largo, ideal para dietas saludables', stock: 50, catIndex: 1 },
    { name: 'Aceite de oliva extra virgen', price: 12.80, description: 'Aceite de oliva extra virgen importado, 500ml', stock: 30, catIndex: 1 },
    { name: 'Cuaderno universitario 100 hojas', price: 2.80, description: 'Cuaderno universitario con espiral y tapa dura, 100 hojas rayadas', stock: 40, catIndex: 2 },
    { name: 'Set de lapices de colores 24u', price: 6.50, description: 'Set de 24 lapices de colores de alta pigmentacion', stock: 25, catIndex: 2 },
    { name: 'Crema hidratante Nivea 400ml', price: 8.90, description: 'Crema hidratante corporal para piel seca, con vitamina E', stock: 35, catIndex: 3 },
    { name: 'Shampoo Pantene Pro-V', price: 7.20, description: 'Shampoo reparador con proteinas para cabello danado, 400ml', stock: 28, catIndex: 3 },
    { name: 'Alimento Royal Canin gatos 2kg', price: 18.50, description: 'Alimento seco premium para gatos adultos, formulado por veterinarios', stock: 12, catIndex: 4 },
    { name: 'Collar ajustable para perros', price: 9.99, description: 'Collar ajustable de nylon resistente para perros medianos y grandes', stock: 20, catIndex: 4 },
    { name: 'Auriculares JBL Tune 510BT', price: 49.99, description: 'Auriculares inalambricos con hasta 40 horas de bateria y plegables', stock: 10, catIndex: 0 },
]

// Crea una categoria y retorna los datos de la respuesta
async function crearCategoria(nombre) {
    const res = await fetch(URL_BASE + '/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nombre })
    })
    const datos = await res.json()
    console.log('Categoria creada:', nombre)
    return datos
}

// Crea un producto usando FormData porque el endpoint usa Multer
async function crearProducto(prod, idCategoria) {
    const form = new FormData()
    form.append('name', prod.name)
    form.append('price', String(prod.price))
    form.append('description', prod.description)
    form.append('stock', String(prod.stock))
    form.append('categoryId', idCategoria)

    const res = await fetch(URL_BASE + '/api/products', {
        method: 'POST',
        body: form
    })
    const datos = await res.json()
    console.log('Producto creado:', prod.name)
    return datos
}

// Funcion principal que coordina la insercion
async function main() {
    console.log('Conectando a la API en produccion:', URL_BASE)
    console.log('Insertando categorias...')

    const idsCategorias = []
    for (const nombre of categorias) {
        const cat = await crearCategoria(nombre)
        idsCategorias.push(cat._id || cat.id)
    }

    console.log('\nInsertando productos...')
    for (const prod of productos) {
        const idCat = idsCategorias[prod.catIndex]
        await crearProducto(prod, idCat)
    }

    console.log('\nDatos insertados correctamente en la API de produccion.')
    console.log('Verifica en:', URL_BASE + '/api/products')
}

main().catch(err => {
    console.error('Error al insertar datos:', err.message)
})
