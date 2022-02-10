const { DateTime } = require("luxon");
const { dispararNotificacion } = require("./notificaciones");

const mercusys = require("./wifiScraping/mercusys.js")
function hFloat(tiempo) {

    let tiempoSplit = tiempo.split(":")
    return Number(tiempoSplit[0]) + (Number(tiempoSplit[1]) / 60)
}

function calcularProgreso(tiempo, cierre) {

    let tiempoFloat = hFloat(tiempo)

    let horaFloat = hFloat(DateTime.now().toFormat('HH:mm'))

    let cierreFloat = hFloat(cierre)
    let diferencia = cierreFloat - horaFloat;

    if (diferencia > 0) {

        return (diferencia / tiempoFloat) * 100
    }
    return 0

}

function verificarActivos(sqlite) {

    return new Promise(function (resolve, reject) {
        let Equipos = sqlite.tabla('equipos')
        Equipos.select(['equipos.*', 'clientes.nombre'], { '>clientes': 'id_cliente' }, 'activo=1').then(data => {

            let desactivados = [],
            proximos = [];
            for (let equipo of data) {
                if (equipo.cierre == "Indefinido")
                    continue;
                let time = DateTime.fromFormat(equipo.fecha, 'dd/LL/yyyy')
                let time2 = DateTime.now()


                let progreso = calcularProgreso(equipo.tiempo, equipo.cierre)
                console.log(DateTime.now().toFormat('dd/LL/yyyy'))
                if (progreso == 0 || equipo.fecha != DateTime.now().toFormat('dd/LL/yyyy')) {
                    equipo.activo = 0
                    desactivados.push(equipo)
                    equipo.update().then(d => {

                        dispararNotificacion(sqlite, "A finalizado el tiempo " + equipo.nombre + " " + equipo.ip + " " + equipo.mac, "", "", "")

                    })

                }else{
                    proximos.push(equipo)
                }
            }
            resolve(desactivados,proximos)


        }).catch(e => reject(e))
    })

}

function bloquearFinalizados(sqlite, io) {

    return new Promise(async (res, rej) => {
        let configuraciones = await sqlite.tabla('configuraciones').selectOne()
        let equipos ;
        try {
             equipos = await sqlite.tabla('equipos').select(['equipos.*', 'clientes.nombre'], { '>clientes': 'id_cliente' }, 'activo=1 and cierre!="Indefinido"')
        } catch (e) {
            rej(e)
        }
        let desactivados = [],
        proximos = [];

        let hoy = DateTime.now()
        for (let equipo of equipos) {

            let time = DateTime.fromFormat(equipo.fecha, 'dd/LL/yyyy')
            let progreso = calcularProgreso(equipo.tiempo, equipo.cierre)

            if (progreso == 0 || equipo.fecha != hoy.toFormat('dd/LL/yyyy')) {

                desactivados.push(equipo)
            }else{
                proximos.push(equipo)
            }
        }
        if (desactivados.length > 0) {
            let wifi = new mercusys(configuraciones)
            try {
                let page = await wifi.open()
            } catch (e) {
                wifi.close()
                rej(e)
            }

            wifi.equiposConectados(async json => {

                try {
                    for (let equipo of desactivados) {
                        io.emit("/equipo/update/" + equipo.id_equipo, equipo)
                        io.emit("notificacion", {
                            title: "Control De Wifi",
                            message: "Finalizo el tiempo de " + equipo.nombre + " " + equipo.ip + " " + equipo.mac
                        })
                        let ok = await wifi.actualizarEquipo({ mac: equipo.mac, nombre: equipo.nombre, bloqueado: true })
                        if (ok) {
                            equipo.activo = 0
                            equipo.update()
                        }
                    }
                    res(desactivados,proximos)
                } catch (e) {
                    rej(e)
                    console.log(e)
                } finally {
                    wifi.close()

                }

            }, "invitado")

        }else{
            res(desactivados)
        }

    })

}

function equipos() {


}
equipos.bloquearFinalizados = bloquearFinalizados
equipos.verificarActivos = verificarActivos
equipos.calcularProgreso =calcularProgreso
module.exports = equipos