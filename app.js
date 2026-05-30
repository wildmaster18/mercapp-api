// Servidor principal de MercApp: API REST + vistas Handlebars + chat Socket.io
require("dotenv").config();
const express = require("express");
const http = require("http");
const { engine } = require("express-handlebars");
const session = require("express-session");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const socketIo = require("socket.io");

const conectarBD = require("./config/database");

// Importa los archivos de rutas del proyecto
const rutasAuth = require("./routes/authRoutes");
const rutasProductos = require("./routes/prodRoutes");
const rutasChat = require("./routes/chatRoutes");
const rutasApi = require("./routes/api");

// Lista de origenes permitidos para CORS, leidos desde variables de entorno
const origenesPermitidos = [];
if (process.env.FRONTEND_URL) origenesPermitidos.push(process.env.FRONTEND_URL);
if (process.env.NETLIFY_URL) origenesPermitidos.push(process.env.NETLIFY_URL);

// En produccion debe existir al menos un origen valido, no se permite comodin
if (process.env.NODE_ENV === "production" && origenesPermitidos.length === 0) {
  throw new Error("FRONTEND_URL o NETLIFY_URL son obligatorios en produccion");
}

// En desarrollo se permite el frontend local de Vite
if (origenesPermitidos.length === 0)
  origenesPermitidos.push("http://localhost:5173");

// SESSION_SECRET no puede usar un valor por defecto en produccion
if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET es obligatorio en produccion");
}

// Crea la aplicación de Express y el servidor HTTP para Socket.io
const app = express();
const servidor = http.createServer(app);

// Confia en el proxy de Railway para que la cookie secure y el rate limit funcionen correctamente
app.set("trust proxy", 1);

const io = socketIo(servidor, {
  cors: {
    origin: origenesPermitidos,
    credentials: true,
  },
});

const puerto = process.env.PORT || 3000;

// Cabeceras de seguridad HTTP con Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  }),
);

// Limita la cantidad de peticiones al API para evitar abuso
const limitadorApi = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: "Demasiadas peticiones, intente mas tarde" },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limitadorApi);

// Habilita CORS restringido a los dominios configurados
app.use(
  cors({
    origin: origenesPermitidos,
    credentials: true,
  }),
);

// Configura el motor de plantillas Handlebars para las vistas del backend
app.engine(
  "hbs",
  engine({
    extname: ".hbs",
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "views/layouts"),
    partialsDir: path.join(__dirname, "views/partials"),
    helpers: {
      // Compara dos valores y renderiza el bloque cuando son iguales
      siIgual: function (a, b, options) {
        return a == b ? options.fn(this) : options.inverse(this);
      },
    },
    runtimeOptions: {
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true,
    },
  }),
);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

// Permite leer datos enviados desde formularios y JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sirve los archivos estáticos del backend
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Manejo de sesiones de usuario para las vistas Handlebars
app.use(
  session({
    secret: process.env.SESSION_SECRET || "claveSecretaMercAppDesarrollo",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

// Registra las rutas del proyecto
app.use("/auth", rutasAuth);
app.use("/productos", rutasProductos);
app.use("/chat", rutasChat);
app.use("/api", rutasApi);

// Construye el objeto de estado del servidor y la base de datos
const mongoose = require("mongoose");
function estadoSalud() {
  const estadoBD = mongoose.connection.readyState;
  const estados = {
    0: "desconectada",
    1: "conectada",
    2: "conectando",
    3: "desconectando",
  };
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    database: estados[estadoBD] || "desconocido",
    uptime: Math.floor(process.uptime()) + "s",
  };
}

// Endpoint de salud directo, util para revisiones rapidas del despliegue
app.get("/health", (req, res) => {
  res.json(estadoSalud());
});

// Ruta raiz: muestra una pagina informativa del API REST con enlaces utiles
app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MercApp API REST</title>
<style>
  body { font-family: 'Segoe UI', system-ui, sans-serif; background:#0f172a; color:#e2e8f0; margin:0; display:flex; align-items:center; justify-content:center; min-height:100vh; }
  .caja { background:#1e293b; padding:2.5rem; border-radius:14px; max-width:520px; width:90%; box-shadow:0 10px 30px rgba(0,0,0,0.3); }
  h1 { color:#a78bfa; margin:0 0 0.4rem; font-size:1.5rem; }
  .estado { display:inline-block; background:#065f46; color:#6ee7b7; padding:3px 12px; border-radius:20px; font-size:0.8rem; font-weight:600; margin-bottom:1rem; }
  p { color:#94a3b8; line-height:1.6; font-size:0.95rem; }
  a { display:block; background:#334155; color:#e2e8f0; text-decoration:none; padding:0.7rem 1rem; border-radius:8px; margin-top:0.6rem; font-size:0.9rem; }
  a:hover { background:#475569; }
  .app { background:#7c3aed; }
</style>
</head>
<body>
  <div class="caja">
    <h1>MercApp API REST</h1>
    <span class="estado">Servidor operativo</span>
    <p>Backend del proyecto MercApp. Entrega los datos en formato JSON que consume la aplicacion frontend. No es la interfaz de usuario.</p>
    <a class="app" href="https://iridescent-profiterole-b5ffbd.netlify.app" target="_blank">Ir a la aplicacion (Netlify)</a>
    <a href="/api/health" target="_blank">Estado del servidor: /api/health</a>
    <a href="/api/products" target="_blank">Productos en JSON: /api/products</a>
    <a href="/api/categories" target="_blank">Categorias en JSON: /api/categories</a>
  </div>
</body>
</html>`);
});

// Manejador para rutas API inexistentes
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Ruta de API no encontrada" });
});

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error("Error no controlado:", err.message);
  if (req.originalUrl.startsWith("/api")) {
    return res
      .status(500)
      .json({ error: "Error interno del servidor", message: err.message });
  }
  res.status(500).send("Error interno del servidor: " + err.message);
});

// Configuración del chat con Socket.io
io.on("connection", (socket) => {
  console.log("Nueva conexión al chat:", socket.id);

  // Almacena el nombre del usuario en el socket al conectarse
  socket.on("usuarioConectado", (nomUsu) => {
    socket.nomUsu = nomUsu;
    io.emit("mensajeSistema", nomUsu + " se ha unido al chat");
    console.log(nomUsu + " entró al chat");
  });

  // Retransmite el mensaje a todos los usuarios conectados
  socket.on("chatMensaje", (mensaje) => {
    const datosMensaje = {
      nomUsu: socket.nomUsu || "Anónimo",
      mensaje: mensaje,
      hora: new Date().toLocaleTimeString("es-EC", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    io.emit("chatMensaje", datosMensaje);
  });

  // Notifica cuando un usuario cierra la conexión
  socket.on("disconnect", () => {
    if (socket.nomUsu) {
      io.emit("mensajeSistema", socket.nomUsu + " ha salido del chat");
      console.log(socket.nomUsu + " salió del chat");
    }
  });
});

// Conexión a MongoDB y arranque del servidor
async function iniciarServidor() {
  try {
    await conectarBD();

    servidor.listen(puerto, () => {
      console.log("Servidor corriendo en http://localhost:" + puerto);
      console.log("API REST disponible en http://localhost:" + puerto + "/api");
    });
  } catch (error) {
    console.error("No se pudo iniciar el servidor:", error.message);
    process.exit(1);
  }
}

iniciarServidor();
