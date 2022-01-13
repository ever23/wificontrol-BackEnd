const express = require('express')
const router = express.Router()
router.get('/', (req, res, next) => {
    let Clientes = req.sqlite.tabla('clientes')
    Clientes.select([
        'clientes.*',
        'SUM(equipos.activo) as activos','COUNT(equipos.id_equipo) as conecciones',
       // "CASE WHEN equipos.tPago='' THEN 0 ELSE equipos.costo END as deuda"
        "SUM(iif(equipos.tPago=='',equipos.costo,0)) as deuda"
    ],{'>equipos':'id_cliente'},null,'id_cliente').then(data => {

        return res.json(data)

    }).catch(e => {
       console.log(e)
        return res.json(e)
    })
})
router.delete('/', (req, res, next) => {
    let Clientes = req.sqlite.tabla('clientes')
    Clientes.delete({ id_cliente: req.query.id_cliente }).
        then(data => {

            return res.json({ ok: true, error: "" })
        }).catch(e => {
            return res.json({ ok: true, error: e })
        })

})
router.get('/busqueda', (req, res, next) => {
    let query = req.query.q
    let Clientes = req.sqlite.tabla('clientes')
    
    Clientes.busqueda(query,['nombre'],[
        'clientes.*',
        'SUM(equipos.activo) as activos','COUNT(equipos.id_equipo) as conecciones',
       // "CASE WHEN equipos.tPago='' THEN 0 ELSE equipos.costo END as deuda"
        "SUM(iif(equipos.tPago=='',equipos.costo,0)) as deuda"
    ],{'>equipos':'id_cliente'},null,'id_cliente').then(data => {

        return res.json(data)

    }).catch(e => {
        console.log(e)
        return res.json(e)
    })

})
module.exports = router