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
// Origen local para desarrollo
if (origenesPermitidos.length === 0)
  origenesPermitidos.push("http://localhost:5173");

// Crea la aplicación de Express y el servidor HTTP para Socket.io
const app = express();
const servidor = http.createServer(app);
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
    secret: process.env.SESSION_SECRET || "claveSecretaMercApp",
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

// Ruta raíz: redirige según el estado de la sesión
app.get("/", (req, res) => {
  if (req.session && req.session.usuario) {
    res.redirect("/productos");
  } else {
    res.redirect("/auth/login");
  }
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
