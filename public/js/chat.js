// Cliente Socket.io del chat en tiempo real
var socket = io();

var cajaMensajes = document.getElementById('cajaMensajes');
var inpMensaje = document.getElementById('inpMensaje');
var btnEnviar = document.getElementById('btnEnviar');
var etiqConexion = document.getElementById('estadoConexion');

// Notifica al servidor el nombre del usuario al conectarse
socket.on('connect', function () {
    socket.emit('usuarioConectado', nomUsuActual);
    etiqConexion.className = 'badge bg-success';
    etiqConexion.innerHTML = '<i class="bi bi-circle-fill me-1" style="font-size:0.6rem;"></i>Conectado';
});

// Actualiza el indicador cuando se pierde la conexión
socket.on('disconnect', function () {
    etiqConexion.className = 'badge bg-danger';
    etiqConexion.innerHTML = '<i class="bi bi-circle-fill me-1" style="font-size:0.6rem;"></i>Desconectado';
});

// Renderiza un mensaje recibido del servidor
socket.on('chatMensaje', function (datos) {
    var esPropio = datos.nomUsu === nomUsuActual;

    var contenedor = document.createElement('div');
    contenedor.classList.add('mb-2', 'limpiarFloat');

    var burbujaDiv = document.createElement('div');
    burbujaDiv.classList.add('burbujaMensaje', esPropio ? 'burbujaPropia' : 'burbujaOtro');

    var horaElem = document.createElement('small');
    horaElem.classList.add('text-muted', 'd-block');
    if (esPropio) {
        horaElem.classList.add('text-end');
    }
    horaElem.textContent = datos.hora;

    var autorElem = document.createElement('span');
    autorElem.classList.add('fw-semibold');
    if (!esPropio) {
        autorElem.classList.add('text-primary');
    }
    autorElem.textContent = esPropio ? 'Tú: ' : datos.nomUsu + ': ';

    var textoElem = document.createElement('span');
    textoElem.textContent = datos.mensaje;

    burbujaDiv.appendChild(horaElem);
    burbujaDiv.appendChild(autorElem);
    burbujaDiv.appendChild(textoElem);
    contenedor.appendChild(burbujaDiv);

    cajaMensajes.appendChild(contenedor);
    cajaMensajes.scrollTop = cajaMensajes.scrollHeight;
});

// Muestra los mensajes del sistema cuando alguien entra o sale del chat
socket.on('mensajeSistema', function (texto) {
    var linea = document.createElement('p');
    linea.classList.add('text-center', 'text-muted', 'small', 'my-2', 'fst-italic');
    linea.textContent = '\u2014 ' + texto + ' \u2014';
    cajaMensajes.appendChild(linea);
    cajaMensajes.scrollTop = cajaMensajes.scrollHeight;
});

btnEnviar.addEventListener('click', function () {
    enviarMensaje();
});

inpMensaje.addEventListener('keypress', function (evento) {
    if (evento.key === 'Enter') {
        enviarMensaje();
    }
});

// Envía el mensaje si el campo no está vacío
function enviarMensaje() {
    var mensaje = inpMensaje.value.trim();
    if (mensaje === '') {
        return;
    }
    socket.emit('chatMensaje', mensaje);
    inpMensaje.value = '';
    inpMensaje.focus();
}
