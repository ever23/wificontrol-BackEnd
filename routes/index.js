var express = require('express');
var router = express.Router();
var usersRouter = require('./users')
var settings = require('./configuraciones')
var equipos = require('./equipos')
var notificaciones = require('./notificaciones')
var clientes = require('./clientes')
var mercusys = require('./mercusys')
const auth= require('../lib/auth.js');
/* GET home page. */
router.use('/user',usersRouter);
router.use('/notificaciones',auth,notificaciones);
router.use('/configuraciones',settings);
router.use('/equipos',equipos);
router.use('/clientes',clientes);
router.use('/mercusys',mercusys);
module.exports = router;
