const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const passport = require('passport');
require('dotenv').config();

// Inicializar la aplicación
const app = express();
const PORT = process.env.PORT || 3000;

// Configurar conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sistema_pagos', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('Conectado a MongoDB');
    
    // Verificar si existe un usuario administrador, si no, crearlo
    const Usuario = require('./models/Usuario');
    const bcrypt = require('bcryptjs');
    
    Usuario.findOne({ rol: 'admin' })
      .then(async (adminExistente) => {
        if (!adminExistente) {
          // Crear usuario administrador por defecto
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash('admin123', salt);
          
          const nuevoAdmin = new Usuario({
            nombre: 'Administrador',
            email: 'admin@sistema.com',
            password: hashedPassword,
            rol: 'admin'
          });
          
          await nuevoAdmin.save();
          console.log('Usuario administrador por defecto creado');
        }
      })
      .catch(err => console.error('Error al verificar/crear usuario admin:', err));
  })
  .catch(err => console.error('Error al conectar a MongoDB:', err));

// Configurar middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Configurar sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false
}));

// Configurar passport
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

// Configurar flash messages
app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

// Rutas
app.use('/', require('./routes/index'));
app.use('/usuarios', require('./routes/usuarios'));
app.use('/pagos', require('./routes/pagos'));

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`);
});