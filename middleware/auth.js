// Middleware para verificar si el usuario está autenticado
module.exports = {
  // Asegurar que el usuario esté autenticado
  ensureAuthenticated: function(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash('error_msg', 'Por favor inicia sesión para acceder a esta página');
    res.redirect('/');
  },
  
  // Verificar si el usuario es administrador
  ensureAdmin: function(req, res, next) {
    if (req.isAuthenticated() && req.user.rol === 'admin') {
      return next();
    }
    req.flash('error_msg', 'Acceso denegado. Se requieren permisos de administrador');
    res.redirect('/dashboard');
  }
};