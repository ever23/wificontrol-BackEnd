const express = require('express')
const router = express.Router()
const { DateTime } = require("luxon");
const axios = require("axios")
const { sqlite3Result } = require("sqlite3-tab")


router.get('/router', (req, res, next) => {

    axios.post(`http://192.168.1.1/?code=2&asyn=1&id=${req.query.id}`, "13", {
        headers: {}
    })
        .then(response => {
            let data = response.data.split('\r\n')
            let json = {}
            data.forEach((d, i) => {
                let d2 = d.split(' ')
                if (typeof json[d2[0]] != 'object') {
                    json[d2[0]] = []
                }
                json[d2[0]].push(d2[2])

            })
            console.log(json)
            return res.json(response.data)
        })
        .catch(error => {
            console.log(error)
        })
})

router.get('/estadisticas', (req, res, next) => {
    let Equipos = req.sqlite.tabla('equipos')
    let Clientes = req.sqlite.tabla('equipos')
    let time = DateTime.now()
    Equipos.selectOne(['count(id_equipo) as activos'], 'activo=1').then(d => {

        return Equipos.selectOne(['SUM(costo) as ganancia'], "fecha='" + time.toLocaleString() + "' and tPago!=''").then(d1 => {
            console.log(time.toFormat("L/y"),time.toLocaleString())
            console.log("fecha LIKE '"+time.toFormat("L/y")+"' and tPago!=''")
            return Equipos.selectOne(['SUM(costo) as ganancia'], 
            "fecha LIKE '%"+time.toFormat("L/y")+"%' and tPago!=''").then(d2 => {

                return Clientes.selectOne(['count() as cantidad']).then(d3 => {

                    return res.json({ activos: d.activos, gananciaDia: d1.ganancia, gananciaMes: d2.ganancia, clientes: d3.cantidad })

                })
            })

        })
    }).catch(e => {
        console.log(e)
        return res.json(e)
    })


})


router.get('/hoy', (req, res, next) => {
    console.log(req.session)
    let Equipos = req.sqlite.tabla('equipos')
    let time = DateTime.now()
    let fecha = time.toFormat('dd/LL/yyyy')
    Equipos.select(['clientes.nombre', 'equipos.*'], { '>clientes': 'id_cliente' }, "fecha='" + fecha + "'", null, null, "id_equipo DESC")
    .then(data => {

        return res.json(data)

    }).catch(e => {
        return res.json(e)
    })

})
router.get('/busqueda', (req, res, next) => {

    let Equipos = req.sqlite.tabla('equipos')
    let time = DateTime.now()
    Equipos.busqueda(req.query.q,
        ['clientes.nombre','equipos.tpago','equipos.referencia','equipos.fecha'],
        ['clientes.nombre', 'equipos.*'], 
        { '>clientes': 'id_cliente' }, 
        "fecha LIKE '%"+time.toFormat("LL/yyyy")+"%'", 
        null, 
        null, 
        "id_equipo DESC")
    .then(data => {

        return res.json(data)

    }).catch(e => {
        return res.json(e)
    })

})

router.get('/', (req, res, next) => {

    let Equipos = req.sqlite.tabla('equipos')
    let time = DateTime.now()
    Equipos.select(['clientes.nombre', 'equipos.*'], { '>clientes': 'id_cliente' }, null, null, null, "id_equipo DESC")
    .then(data => {

        return res.json(data)

    }).catch(e => {
        return res.json(e)
    })

})
router.get('/cliente', (req, res, next) => {

    let Equipos = req.sqlite.tabla('equipos')
    Equipos.select(['clientes.nombre', 'equipos.*'], { '>clientes': 'id_cliente' }, "id_cliente=" + req.query.id_cliente + "").then(data => {

        return res.json(data)

    }).catch(e => {
        return res.json(e)
    })

})
router.post('/', (req, res, next) => {
    let Equipos = req.sqlite.tabla('equipos')
    let Clientes = req.sqlite.tabla('clientes')
    let resData = req.body
    let fecha = DateTime.now()
    if (resData.id_cliente != undefined) {
        Equipos.insert(null,
            resData.id_cliente,
            resData.tiempo,
            resData.costo,
            resData.tPago,
            resData.referencia,
            resData.apertura,
            resData.cierre,
            true,
            fecha.toFormat('dd/LL/yyyy')
        )
            .then(d => {

                Equipos.selectOne(['clientes.nombre', 'equipos.*'], { '>clientes': 'id_cliente' }, null, null, null, "id_equipo DESC").then(data => {
                    return res.json({ ok: true, data: data })
                }).catch(e => {
                    return res.json({ ok: false, error: e })
                })

            }).catch(e => {
                console.log(e)
                return res.json({ ok: false, error: e })

            })
    } else {
        Clientes.insert(null, resData.nombre).then(d => {
            Clientes.selectOne(null, null, null, null, null, "id_cliente DESC").then(newCliente => {
                Equipos.insert(null,
                    newCliente.id_cliente,
                    resData.tiempo,
                    resData.costo,
                    resData.tPago,
                    resData.referencia,
                    resData.apertura,
                    resData.cierre,
                    true,
                    fecha.toLocaleString()
                ).then(d => {

                    Equipos.selectOne(['clientes.nombre', 'equipos.*'], { '>clientes': 'id_cliente' }, null, null, null, "id_equipo DESC").then(data => {
                        return res.json({ ok: true, data: data })
                    }).catch(e => {
                        return res.json({ ok: false, error: e })
                    })

                }).catch(e => {
                    console.log(e)
                    return res.json({ ok: false, error: e })

                })

            }).catch(e => {
                return res.json({ ok: false, error: e })
            })
        }).catch(e => {
            console.log(e)
            return res.json({ ok: false, error: e })

        })
    }


})

router.delete('/', (req, res, next) => {

    let Equipos = req.sqlite.tabla('equipos')
    Equipos.delete({ id_equipo: req.query.id_equipo }).
        then(data => {

            return res.json({ ok: true, error: "" })
        }).catch(e => {
            return res.json({ ok: true, error: e })
        })

})
router.put('/', (req, res, next) => {
    let equipo = req.body
    let Equipos = req.sqlite.tabla('equipos')

    Equipos.update(equipo, { id_equipo: req.body.id_equipo }).then(d => {
        return res.json({ ok: true, error: "" })
    }).catch(e => {
        console.log(e)
        return res.json({ ok: true, error: e })
    })

})

router.put('/desactivar', (req, res, next) => {

    let id_equipo = req.body.id_equipo
    let Equipos = req.sqlite.tabla('equipos')
    Equipos.update({ activo: false }, { id_equipo: id_equipo }).then(d => {
        return res.json({ ok: true, error: "" })
    }).catch(e => {
        console.log(e)
        return res.json({ ok: true, error: e })
    })

})



module.exports = router
