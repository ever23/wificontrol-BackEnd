const express = require('express')
const router = express.Router()
const { DateTime } = require("luxon");
const { sqlite3Result } = require("sqlite3-tab")
const auth = require('../lib/auth.js');
const notificaciones = require('../lib/notificaciones.js');
const { calcularProgreso } = require('../lib/equipos.js');
const mercusys = require("../lib/wifiScraping/mercusys.js")

router.get('/estadisticas', auth, (req, res, next) => {
    let Equipos = req.sqlite.tabla('equipos')
    let Clientes = req.sqlite.tabla('clientes')
    let time = DateTime.now()
    Equipos.selectOne([
        'SUM(iif(activo,1,0)) as activos',
        "SUM(iif(fecha='" + time.toFormat('dd/LL/yyyy') + "' and  tPago!='',costo,0)) as gananciadia",
        "SUM(iif(fecha LIKE '%" + time.toFormat("LL/yyyy") + "%' and tPago!='',costo,0)) as gananciames",
        "SUM(iif(fecha LIKE '%" + time.toFormat("LL/yyyy") + "%' and tPago='Efectivo',costo,0)) as efectivo",
        "SUM(iif(fecha LIKE '%" + time.toFormat("LL/yyyy") + "%' and tPago='Pagomovil',costo,0)) as pagomovil",
        "SUM(iif(fecha LIKE '%" + time.toFormat("LL/yyyy") + "%' and tPago='',costo,0)) as deudas",
    ]).then(data => {

        return Clientes.selectOne(['count(id_cliente) as cantidad']).then(d3 => {
            let numberFormat = new Intl.NumberFormat('es-ES', {
                minimumFractionDigits: 2
            })
            return res.json({
                activos: data.activos,
                gananciaDia: numberFormat.format(data.gananciadia),
                gananciaMes: numberFormat.format(data.gananciames),
                efectivo: numberFormat.format(data.efectivo),
                pagomovil: numberFormat.format(data.pagomovil),
                deudas: numberFormat.format(data.deudas),
                clientes: d3.cantidad,
            })

        })
    }).catch(e => {
        console.log(e)
        return res.json({ok:false,error:"Error al consultar "})
    })


})


router.get('/hoy', auth, (req, res, next) => {

    let Equipos = req.sqlite.tabla('equipos')
    let time = DateTime.now()
    let fecha = time.toFormat('dd/LL/yyyy')
    Equipos.select(['clientes.nombre', 'equipos.*'], { '>clientes': 'id_cliente' }, "fecha='" + fecha + "'", null, null, "id_equipo DESC")
        .then(data => {

            return res.json(data)

        }).catch(e => {
            console.log(e)
            return res.json({ok:false,error:"Error al consultar "})
        })

})


router.get('/activos', (req, res, next) => {

    let Equipos = req.sqlite.tabla('equipos')
    let time = DateTime.now()
    let fecha = time.toFormat('dd/LL/yyyy')
    Equipos.select(['clientes.nombre', 'equipos.*'], { '>clientes': 'id_cliente' }, "fecha='" + fecha + "' and activo", null, null, "id_equipo DESC")
        .then(data => {

            return res.json(data)

        }).catch(e => {
            console.log(e)
            return res.json({ok:false,error:"Error al consultar "})
        })

})

router.get('/busqueda', auth, (req, res, next) => {

    let Equipos = req.sqlite.tabla('equipos')
    let time = DateTime.now()
    Equipos.busqueda(req.query.q,
        ['clientes.nombre', 'equipos.tpago', 'equipos.referencia', 'equipos.fecha'],
        ['clientes.nombre', 'equipos.*'],
        { '>clientes': 'id_cliente' },
        "fecha LIKE '%" + time.toFormat("LL/yyyy") + "%'",
        null,
        null,
        "id_equipo DESC")
        .then(data => {

            return res.json(data)

        }).catch(e => {
            console.log(e)
            return res.json({ok:false,error:"error en la busqueda"})
        })

})

router.get('/', auth, (req, res, next) => {

    let Equipos = req.sqlite.tabla('equipos')
    let time = DateTime.now()
    Equipos.select(['clientes.nombre', 'equipos.*'], { '>clientes': 'id_cliente' }, null, null, null, "id_equipo DESC")
        .then(data => {

            return res.json(data)

        }).catch(e => {
            console.log(e)
            return res.json({ok:false,error:"Error al consultar "})
        })

})
router.get('/cliente', auth, (req, res, next) => {

    let Equipos = req.sqlite.tabla('equipos')
    Equipos.select(['clientes.nombre', 'equipos.*'], { '>clientes': 'id_cliente' }, "id_cliente=" + req.query.id_cliente + "",null,null,"tPago, fecha ASC").then(data => {
        return res.json(data)

    }).catch(e => {
        console.log(e)
        return res.json({ok:false,error:"Error al consultar "})
    })

})
router.post('/', async (req, res, next) => {
    let Equipos = req.sqlite.tabla('equipos')
    let Clientes = req.sqlite.tabla('clientes')
    let resData = req.body
    let fecha = DateTime.now().toFormat('dd/LL/yyyy')
    let apertura = DateTime.now().toFormat('HH:mm')
    let cierre = ""
    if (resData.tiempo == "Indefinido") {
        cierre = "Indefinido"
        resData.costo = 0
    } else {
        let tiempoSplit = resData.tiempo.split(':')
        cierre = DateTime.now().plus({ hours: tiempoSplit[0], minutes: tiempoSplit[1] }).toFormat('HH:mm')
        resData.costo = ((Number(tiempoSplit[0]) + (Number(tiempoSplit[1]) / 60)) * req.configuraciones.costo_hora).toLocaleString('en')
    }

    if (resData.id_cliente == undefined) {
        try{
            await Clientes.insert(null, resData.nombre);
        }catch(e){
            console.log(e)
            return res.json({ ok: true, error: "Imposible agregar el cliente" }) 
        }
        
        let cliente = await Clientes.selectOne(null, null, null, null, null, "id_cliente DESC");
        resData.id_cliente = cliente.id_cliente
    }
    try{
        await Equipos.insert(null,
            resData.id_cliente,
            resData.tiempo,
            resData.costo,
            resData.tPago,
            resData.referencia,
            apertura,
            cierre,
            true,
            fecha,
            resData.mac,
            resData.ip
        );
    }catch(e){
        console.log(e)
        return res.json({ ok: true, error: "Imposible agregar el Equipo" }) 
    }
    
    let equipo = await  Equipos.selectOne(['clientes.nombre', 'equipos.*'], { '>clientes': 'id_cliente' }, null, null, null, "id_equipo DESC")
    req.io.emit("/equipo/registro", equipo)
    return res.json({ ok: true, data: equipo })


})

router.delete('/', auth, (req, res, next) => {

    let Equipos = req.sqlite.tabla('equipos')
    Equipos.delete({ id_equipo: req.query.id_equipo }).
        then(data => {

            return res.json({ ok: true})
        }).catch(e => {
            console.log(e)
            return res.json({ ok: true, error: "No se eliminó" })
        })

})
router.put('/tiempo', auth, async (req, res, next) => {
    let update = req.body
    try {
        let equipo = await req.sqlite.tabla('equipos').selectOne(['clientes.nombre', 'equipos.*'], { '>clientes': 'id_cliente' }, 'id_equipo="' + req.body.id_equipo + '"')
        if (equipo.id_equipo) {
            equipo.tiempo = update.tiempo
            let tiempoSplit = equipo.tiempo.split(':')
            let time=DateTime.fromFormat(equipo.apertura,'HH:mm')
            equipo.cierre = time.plus({ hours: tiempoSplit[0], minutes: tiempoSplit[1] }).toFormat('HH:mm')
            let progreso = calcularProgreso(equipo.tiempo, equipo.cierre)

            equipo.costo = ((Number(tiempoSplit[0]) + (Number(tiempoSplit[1]) / 60)) * req.configuraciones.costo_hora).toLocaleString('en')
            if (progreso == 0 || equipo.fecha != DateTime.now().toFormat('dd/LL/yyyy')) {
                equipo.activo = 0
            } else {
                equipo.activo = 1
            }

            await equipo.update()
            req.io.emit("/equipo/update/" + equipo.id_equipo, equipo)
            res.json({ ok: true, error: "", equipo: equipo })

        }
    } catch (e) {
        console.log(e)
        res.json({ ok: false, error: "No se actualizo el tiempo" })
    }

})
router.put('/pago', auth, async (req, res, next) => {
    let update = req.body
    try {
        let equipo = await req.sqlite.tabla('equipos').selectOne(['clientes.nombre', 'equipos.*'], { '>clientes': 'id_cliente' }, 'id_equipo="' + req.body.id_equipo + '"')
        if (equipo.id_equipo) {
            equipo.tPago = update.tPago
            equipo.referencia = update.referencia

            await equipo.update()
            req.io.emit("/equipo/update/" + equipo.id_equipo, equipo)
            res.json({ ok: true})

        }
    } catch (e) {
        console.log(e)
        res.json({ ok: false, error: "No se actualizo el pago" })
    }

})
router.put('/', auth, (req, res, next) => {
    let equipo = req.body
    let Equipos = req.sqlite.tabla('equipos')

    Equipos.update(equipo, { id_equipo: req.body.id_equipo }).then(async d => {

        res.json({ ok: true, error: "" })

        let eq = await Equipos.selectOne(['clientes.nombre', 'equipos.*'], { '>clientes': 'id_cliente' }, 'id_equipo="' + req.body.id_equipo + '"')
        req.io.emit("/equipo/update/" + eq.id_equipo, eq)
        if (eq.activo) {
            let wifi = new mercusys(req.configuraciones)
            let page = await wifi.open()
            wifi.equiposConectados(async json => {
                try {
                    let r = await wifi.actualizarEquipo({ mac: eq.mac, nombre: eq.nombre, bloqueado: false })
                } finally {
                    wifi.close()
                }


            }, "invitado")
        }


    }).catch(e => {
        console.log(e)
        return res.json({ ok: true, error: e })
    })

})

router.put('/cerrar', async (req, res, next) => {

    let id_equipo = req.body.id_equipo
    let Equipos = req.sqlite.tabla('equipos')

    try {
        let equipo = await Equipos.selectOne(['clientes.nombre', 'equipos.*'], { '>clientes': 'id_cliente' }, 'id_equipo="' + id_equipo + '"')
        let time = DateTime.fromFormat(equipo.apertura, 'HH:mm')
        let time2 = DateTime.now()
        equipo.tiempo = time2.diff(time).toFormat("hh:mm")
        equipo.activo = false
        equipo.cierre = DateTime.now().toFormat("HH:mm")
        let tiempoSplit = equipo.tiempo.split(":")
        equipo.costo = ((Number(tiempoSplit[0]) + (Number(tiempoSplit[1]) / 60)) * req.configuraciones.costo_hora).toLocaleString('en')


        let wifi = new mercusys( req.configuraciones)
        let page = await wifi.open()
        wifi.equiposConectados(async json => {
            try {
                let ok = await wifi.actualizarEquipo({ mac: equipo.mac, nombre: equipo.nombre, bloqueado: true })
                if (ok) {

                    await equipo.update();
                    req.io.emit("/equipo/update/" + equipo.id_equipo, equipo)
                    req.io.emit("notificacion", {
                        title: "Control De Wifi",
                        message: "Finalizo el tiempo de " + equipo.nombre + " " + equipo.ip + " " + equipo.mac
                    })
                } else {
                    return res.json({ ok: false, error: "no se finalizo la conexion" })
                }

            } finally {
                wifi.close()
            }

        }, "invitado")


        return res.json({ ok: true, data: equipo })
    } catch (e) {
        console.log(e)
        return res.json({ok:false,error:"error "})
    }
})


router.put('/desactivar', auth, (req, res, next) => {

    let id_equipo = req.body.id_equipo
    let Equipos = req.sqlite.tabla('equipos')
    Equipos.update({ activo: false }, { id_equipo: id_equipo }).then(d => {
        Equipos.selectOne(['clientes.nombre', 'equipos.*'], { '>clientes': 'id_cliente' }, "id_equipo='" + id_equipo + "'").then(async d2 => {
            notificaciones.dispararNotificacion(sqlite, "A finalizado el tiempo del equipo " + d2.nombre + "", "", "", "")
            let wifi = new mercusys(req.configuraciones)
            let page = await wifi.open()
            await wifi.verInvidatos()
            let r = await wifi.bloqueraEquipo(req.body.ip)
            res.json({ ok: r })
            page.close()
            return res.json({ ok: r, error: "" })
        }).catch(e => {
            console.log(e)
            return res.json({ ok: true, error: e })
        })



    }).catch(e => {
        console.log(e)
        return res.json({ ok: true, error: e })
    })

})
router.get('/equipo', (req, res, next) => {

    let Equipos = req.sqlite.tabla('equipos')
    Equipos.selectOne(['clientes.nombre', 'equipos.*'], { '>clientes': 'id_cliente' }, "id_equipo=" + req.query.id_equipo + " ").then(data => {

        return res.json(data)

    }).catch(e => {
        console.log(e)
        
        return res.json({ok:false,error:"error en la consulta"})
    })

})
router.get('/mac', (req, res, next) => {

    let Equipos = req.sqlite.tabla('equipos')
    Equipos.selectOne(['clientes.nombre', 'equipos.*', 'count(clientes.id_cliente) as conexiones'], { '>clientes': 'id_cliente' }, 'mac="' + req.query.mac + '"', null, null, "conexiones").then(data => {

        return res.json(data)

    }).catch(e => {
        
        console.log(e)
        
        return res.json({ok:false,error:"error en la consulta"})
    })

})

router.get('/mac-activa', (req, res, next) => {

    let Equipos = req.sqlite.tabla('equipos')
    Equipos.selectOne(['clientes.nombre', 'equipos.*'], { '>clientes': 'id_cliente' }, "mac='" + req.query.mac + "' and activo=true").then(data => {

        return res.json(data)
    }).catch(e => {
        console.log(e)
        
        return res.json({ok:false,error:"error en la consulta"})
    })

})

router.get('/cliente-activo', (req, res, next) => {

    let Equipos = req.sqlite.tabla('equipos')
    Equipos.select(['clientes.nombre', 'equipos.*'], { '>clientes': 'id_cliente' }, "id_cliente=" + req.query.id_cliente + " and activo=true").then(data => {

        if (data.length == 1) {

            return res.json(data[0])
        } else {
            console.log(e)
        
        return res.json({ok:false,error:"error en la consulta"})
        }

    }).catch(e => {
        console.log(e)
        
        return res.json({ok:false,error:"error en la consulta"})
    })

})
router.get('/pendientes', (req, res, next) => {

    let Equipos = req.sqlite.tabla('equipos')
    Equipos.select(['clientes.nombre', 'equipos.*'], { '>clientes': 'id_cliente' }, "id_cliente=" + req.query.id_cliente + " and activo=false and tpago=''").then(data => {


        return res.json(data)


    }).catch(e => {
        console.log(e)
        
        return res.json({ok:false,error:"error en la consulta"})
    })

})

module.exports = router
