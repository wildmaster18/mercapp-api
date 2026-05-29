// Permite el acceso únicamente a usuarios con sesión iniciada
function verificarSesion(req, res, next) {
    if (req.session && req.session.usuario) {
        next();
    } else {
        res.redirect('/auth/login');
    }
}

module.exports = verificarSesion;
