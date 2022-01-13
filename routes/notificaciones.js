const express = require('express')
const router = express.Router()
const { DateTime } = require("luxon");
var { verificarActivos } = require('../lib/equipos')
const notificacion = require('../lib/notificaciones.js')

router.post('/suscribir', (req, res, next) => {
    notificacion.suscribir(req.sqlite, req.body).then(d => {
        // Server's Response
        res.status(201).json();
    }).catch(e => {
        res.status(201).json();
    })
})
router.post('/disparar', (req, res, next) => {

    notificacion.dispararNotificacion(req.sqlite, req.body.text,"","","")
    return res.json({ ok: false })

})
router.get('/now', (req, res, next) => {
    let Notificaciones = req.sqlite.tabla('notificaciones')
    Notificaciones.select(null, null, null, null, null, 'fech_notificacion desc', '20').then(data => {

        if (req.query.fech_notificacion != undefined) {

            Notificaciones.select(null,
                "visto=false and fech_notificacion>'" + req.query.fech_notificacion + "'",
                null,
                null,
                null,
                'fech_notificacion desc',
                '20').then(d2 => {

                    return res.json({ data: data, new: d2, ok: true })

                }).catch(e => {

                    return res.json({ ok: false, error: e })
                })
        } else {
            return res.json({ data: data, ok: true })
        }
    }).catch(e => {

        return res.json({ ok: false, error: e })
    })

})
router.post('/', (req, res, next) => {


})

router.delete('/', (req, res, next) => {

    let Notificaciones = req.sqlite.tabla('notificaciones')
    Notificaciones.delete('1').
        then(data => {

            return res.json({ ok: true, data: [] })
        }).catch(e => {
            console.log(e)
            return res.json({ ok: true, error: e })
        })
})
router.put('/', (req, res, next) => {


})




module.exports = router
