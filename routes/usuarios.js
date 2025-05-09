const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
const Pago = require('../models/Pago');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');

// Ruta para mostrar el formulario de registro (solo accesible por administradores)
router.get('/registro', ensureAuthenticated, ensureAdmin, (req, res) => {
  res.render('usuarios/registro');
});

// Ruta para procesar el registro de un nuevo usuario
router.post('/registro', ensureAuthenticated, ensureAdmin, async (req, res) => {
  const { nombre, email, password, password2, rol } = req.body;
  let errors = [];

  // Validación de campos
  if (!nombre || !email || !password || !password2) {
    errors.push({ msg: 'Por favor complete todos los campos' });
  }

  if (password !== password2) {
    errors.push({ msg: 'Las contraseñas no coinciden' });
  }

  if (password.length < 6) {
    errors.push({ msg: 'La contraseña debe tener al menos 6 caracteres' });
  }

  if (errors.length > 0) {
    return res.render('usuarios/registro', {
      errors,
      nombre,
      email,
      rol
    });
  }

  try {
    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({ email });

    if (usuarioExistente) {
      errors.push({ msg: 'El email ya está registrado' });
      return res.render('usuarios/registro', {
        errors,
        nombre,
        email,
        rol
      });
    }

    // Crear nuevo usuario
    const nuevoUsuario = new Usuario({
      nombre,
      email,
      password,
      rol: rol || 'estandar'
    });

    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    nuevoUsuario.password = await bcrypt.hash(password, salt);
    await nuevoUsuario.save();

    req.flash('success_msg', 'Usuario registrado correctamente');
    res.redirect('/usuarios');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error al registrar el usuario');
    res.redirect('/usuarios/registro');
  }
});

// Ruta para listar todos los usuarios (solo accesible por administradores)
router.get('/', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const usuarios = await Usuario.find({}).sort({ fechaRegistro: -1 });
    
    // Obtener todos los pagos para calcular el total por usuario y semana
    const pagos = await Pago.find({}).populate('usuario');
    
    // Crear un objeto para almacenar los totales por usuario
    const totalesPorUsuario = {};
    
    // Calcular el total de pagos por usuario agrupados por semana
    pagos.forEach(pago => {
      if (!pago.usuario) return;
      
      const usuarioId = pago.usuario._id.toString();
      const semanaKey = `${pago.año}-${pago.semana}`;
      
      if (!totalesPorUsuario[usuarioId]) {
        totalesPorUsuario[usuarioId] = {};
      }
      
      if (!totalesPorUsuario[usuarioId][semanaKey]) {
        totalesPorUsuario[usuarioId][semanaKey] = {
          total: 0,
          pagado: 0
        };
      }
      
      totalesPorUsuario[usuarioId][semanaKey].total += pago.monto;
      if (pago.pagado) {
        totalesPorUsuario[usuarioId][semanaKey].pagado += pago.monto;
      }
    });
    
    res.render('usuarios/lista', { usuarios, totalesPorUsuario });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error al obtener la lista de usuarios');
    res.redirect('/dashboard');
  }
});

// Ruta para mostrar el formulario de edición de un usuario
router.get('/editar/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) {
      req.flash('error_msg', 'Usuario no encontrado');
      return res.redirect('/usuarios');
    }
    res.render('usuarios/editar', { usuario });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error al obtener los datos del usuario');
    res.redirect('/usuarios');
  }
});

// Ruta para actualizar un usuario
router.put('/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { nombre, email, rol, password } = req.body;
    const usuario = await Usuario.findById(req.params.id);

    if (!usuario) {
      req.flash('error_msg', 'Usuario no encontrado');
      return res.redirect('/usuarios');
    }

    // Actualizar campos
    usuario.nombre = nombre;
    usuario.email = email;
    usuario.rol = rol;

    // Si se proporciona una nueva contraseña, actualizarla
    if (password && password.length >= 6) {
      const salt = await bcrypt.genSalt(10);
      usuario.password = await bcrypt.hash(password, salt);
    }

    await usuario.save();
    req.flash('success_msg', 'Usuario actualizado correctamente');
    res.redirect('/usuarios');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error al actualizar el usuario');
    res.redirect('/usuarios');
  }
});

// Ruta para eliminar un usuario
router.delete('/:id', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    await Usuario.findByIdAndDelete(req.params.id);
    req.flash('success_msg', 'Usuario eliminado correctamente');
    res.redirect('/usuarios');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error al eliminar el usuario');
    res.redirect('/usuarios');
  }
});

module.exports = router;