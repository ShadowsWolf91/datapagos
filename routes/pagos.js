const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Usuario = require('../models/Usuario');
const Pago = require('../models/Pago');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');

// Ruta para mostrar todos los pagos (solo admin)
router.get('/', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const pagos = await Pago.find({})
      .populate('usuario', 'nombre email')
      .populate('registradoPor', 'nombre')
      .sort({ fecha: -1 });
    
    res.render('pagos/lista', { pagos });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error al obtener la lista de pagos');
    res.redirect('/dashboard');
  }
});

// Ruta para mostrar el formulario de registro de pago (solo admin)
router.get('/registrar', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    // Si es admin, mostrar lista de usuarios para seleccionar
    // Si es usuario estándar, solo puede registrar su propio pago
    let usuarios = [];
    if (req.user.rol === 'admin') {
      usuarios = await Usuario.find({}).sort({ nombre: 1 });
    }
    
    const { semana, año } = Pago.obtenerSemanaActual();
    
    res.render('pagos/registrar', { 
      usuarios,
      esAdmin: req.user.rol === 'admin',
      semanaActual: semana,
      añoActual: año
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error al cargar el formulario de registro de pago');
    res.redirect('/dashboard');
  }
});

// Ruta para procesar el registro de un pago (solo admin)
router.post('/registrar', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const { usuarioId, semana, año, monto, pagado, comentario } = req.body;
    
    // Determinar el ID del usuario según el rol
    const idUsuario = req.user.rol === 'admin' ? usuarioId : req.user.id;
    
    // Verificar si ya existe un pago para este usuario en esta semana y año
    const pagoExistente = await Pago.findOne({
      usuario: idUsuario,
      semana: parseInt(semana),
      año: parseInt(año)
    });
    
    if (pagoExistente) {
      // Actualizar pago existente
      pagoExistente.monto = monto || 3000;
      pagoExistente.pagado = pagado === 'on';
      pagoExistente.comentario = comentario;
      pagoExistente.registradoPor = req.user.id;
      pagoExistente.fecha = Date.now();
      
      await pagoExistente.save();
      req.flash('success_msg', 'Pago actualizado correctamente');
    } else {
      // Crear nuevo pago
      const nuevoPago = new Pago({
        usuario: idUsuario,
        semana: parseInt(semana),
        año: parseInt(año),
        monto: monto || 3000,
        pagado: pagado === 'on',
        comentario,
        registradoPor: req.user.id
      });
      
      await nuevoPago.save();
      req.flash('success_msg', 'Pago registrado correctamente');
    }
    
    if (req.user.rol === 'admin') {
      res.redirect('/pagos');
    } else {
      res.redirect('/pagos/mis-pagos');
    }
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error al registrar el pago');
    res.redirect('/pagos/registrar');
  }
});

// Ruta para mostrar los pagos del usuario actual (para usuarios estándar)
router.get('/mis-pagos', ensureAuthenticated, async (req, res) => {
  try {
    const pagos = await Pago.find({ usuario: req.user.id })
      .populate('registradoPor', 'nombre')
      .sort({ año: -1, semana: -1 });
    
    res.render('pagos/mis-pagos', { pagos });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error al obtener tus pagos');
    res.redirect('/dashboard');
  }
});

// Ruta para mostrar el estado de pagos de todos los usuarios (solo admin)
router.get('/estado', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    // Obtener la semana y año actual
    const { semana, año } = req.query.semana && req.query.año ? 
      { semana: parseInt(req.query.semana), año: parseInt(req.query.año) } : 
      Pago.obtenerSemanaActual();
    
    // Obtener todos los usuarios
    const usuarios = await Usuario.find({}).sort({ nombre: 1 });
    
    // Obtener pagos de la semana seleccionada
    const pagos = await Pago.find({ semana, año })
      .populate('usuario', 'nombre email');
    
    // Crear un mapa de pagos por usuario
    const pagosPorUsuario = {};
    pagos.forEach(pago => {
      if (pago.usuario) {
        pagosPorUsuario[pago.usuario._id.toString()] = pago;
      }
    });
    
    res.render('pagos/estado', { 
      usuarios, 
      pagosPorUsuario,
      semanaActual: semana,
      añoActual: año
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error al obtener el estado de pagos');
    res.redirect('/dashboard');
  }
});

// Ruta para exportar todos los pagos a PDF (solo admin)
router.get('/exportar-pdf', ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    // Obtener todos los pagos con información de usuario
    const pagos = await Pago.find({})
      .populate('usuario', 'nombre email')
      .sort({ año: -1, semana: -1 });
    
    // Configurar el documento PDF
    const doc = new PDFDocument();
    const filename = `pagos_${Date.now()}.pdf`;
    
    // Configurar cabeceras para la descarga
    res.setHeader('Content-disposition', `attachment; filename="${filename}"`); 
    res.setHeader('Content-type', 'application/pdf');
    
    // Pipe el PDF a la respuesta
    doc.pipe(res);
    
    // Agregar título
    doc.fontSize(20).text('Reporte de Pagos', { align: 'center' });
    doc.moveDown();
    
    // Agregar fecha de generación
    doc.fontSize(12).text(`Generado: ${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();
    
    // Definir columnas
    const columnas = [
      { header: 'Usuario', width: 150 },
      { header: 'Semana', width: 60 },
      { header: 'Año', width: 60 },
      { header: 'Monto', width: 80 },
      { header: 'Estado', width: 80 },
      { header: 'Fecha', width: 100 }
    ];
    
    // Dibujar encabezados
    doc.fontSize(12).font('Helvetica-Bold');
    let posX = 50;
    columnas.forEach(col => {
      doc.text(col.header, posX, doc.y, { width: col.width, align: 'left' });
      posX += col.width;
    });
    doc.moveDown();
    
    // Dibujar línea separadora
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();
    
    // Dibujar filas de datos
    doc.font('Helvetica');
    pagos.forEach(pago => {
      if (!pago.usuario) return; // Saltar si no hay usuario asociado
      
      posX = 50;
      const y = doc.y;
      
      // Verificar si necesitamos una nueva página
      if (y > 700) {
        doc.addPage();
      }
      
      // Usuario
      doc.text(pago.usuario.nombre, posX, doc.y, { width: columnas[0].width, align: 'left' });
      posX += columnas[0].width;
      
      // Semana
      doc.text(pago.semana.toString(), posX, doc.y, { width: columnas[1].width, align: 'left' });
      posX += columnas[1].width;
      
      // Año
      doc.text(pago.año.toString(), posX, doc.y, { width: columnas[2].width, align: 'left' });
      posX += columnas[2].width;
      
      // Monto
      doc.text(`$${pago.monto.toLocaleString()}`, posX, doc.y, { width: columnas[3].width, align: 'left' });
      posX += columnas[3].width;
      
      // Estado
      doc.text(pago.pagado ? 'Pagado' : 'Pendiente', posX, doc.y, { width: columnas[4].width, align: 'left' });
      posX += columnas[4].width;
      
      // Fecha
      doc.text(pago.fecha.toLocaleDateString(), posX, doc.y, { width: columnas[5].width, align: 'left' });
      
      doc.moveDown();
    });
    
    // Finalizar el PDF
    doc.end();
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error al generar el PDF');
    res.redirect('/pagos');
  }
});

module.exports = router;