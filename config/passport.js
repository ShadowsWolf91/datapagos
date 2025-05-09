const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');

module.exports = function(passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        // Buscar usuario por email
        const usuario = await Usuario.findOne({ email });
        
        if (!usuario) {
          return done(null, false, { message: 'El correo no está registrado' });
        }

        // Verificar contraseña
        const isMatch = await bcrypt.compare(password, usuario.password);
        if (isMatch) {
          return done(null, usuario);
        } else {
          return done(null, false, { message: 'Contraseña incorrecta' });
        }
      } catch (err) {
        console.error(err);
        return done(err);
      }
    })
  );

  passport.serializeUser((usuario, done) => {
    done(null, usuario.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const usuario = await Usuario.findById(id);
      done(null, usuario);
    } catch (err) {
      done(err, null);
    }
  });
};