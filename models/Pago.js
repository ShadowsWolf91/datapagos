const mongoose = require('mongoose');

const PagoSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  fecha: {
    type: Date,
    required: true,
    default: Date.now
  },
  monto: {
    type: Number,
    required: true,
    default: 3000 // Valor predeterminado de 3000 pesos COP
  },
  pagado: {
    type: Boolean,
    required: true,
    default: false
  },
  semana: {
    type: Number,
    required: true
  },
  año: {
    type: Number,
    required: true
  },
  registradoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  comentario: {
    type: String,
    default: ''
  }
});

// Método estático para obtener la semana actual del año
PagoSchema.statics.obtenerSemanaActual = function() {
  const ahora = new Date();
  const inicio = new Date(ahora.getFullYear(), 0, 1);
  const dias = Math.floor((ahora - inicio) / (24 * 60 * 60 * 1000));
  const semana = Math.ceil((dias + inicio.getDay() + 1) / 7);
  return {
    semana,
    año: ahora.getFullYear()
  };
};

module.exports = mongoose.model('Pago', PagoSchema);