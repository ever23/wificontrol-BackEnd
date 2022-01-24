var express = require('express');
var router = express.Router();
var usersRouter = require('./users')
var settings = require('./settings')
var equipos = require('./equipos')
var notificaciones = require('./notificaciones')
var clientes = require('./clientes')
const auth= require('../lib/auth.js');
/* GET home page. */
router.use('/user',usersRouter);
router.use('/notificaciones',auth,notificaciones);
router.use('/settings',auth,settings);
router.use('/equipos',equipos);
router.use('/clientes',clientes);
module.exports = router;
