const express = require('express');
const router = express.Router();
const passport = require('passport');
const { ensureAuthenticated } = require('../middleware/auth');

// Página de inicio - Mostrar formulario de login si no está autenticado, o redirigir al dashboard
router.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  res.render('login');
});

// Página de dashboard - Requiere autenticación
router.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.render('dashboard', {
    nombre: req.user.nombre,
    rol: req.user.rol
  });
});

// Ruta para procesar el login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/',
    failureFlash: true
  })(req, res, next);
});

// Ruta para cerrar sesión
router.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.session.destroy((err) => {
      if (err) {
        console.error('Error al destruir la sesión:', err);
      }
      res.clearCookie('connect.sid');
      req.flash('success_msg', 'Has cerrado sesión correctamente');
      res.redirect('/');
    });
  });
});

module.exports = router;