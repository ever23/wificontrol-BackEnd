const { DateTime } = require("luxon");
const { dispararNotificacion } = require("./notificaciones");

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
        Equipos.select(['equipos.*','clientes.nombre'],{'>clientes':'id_cliente'},'activo=1').then(data => {
           
            let desactivados = []
            for (let equipo of data) {
                if(equipo.cierre=="Indefinido")
                continue;
                let time = DateTime.fromFormat(equipo.fecha,'dd/LL/yyyy')
                let time2 = DateTime.now()

            
                let progreso = calcularProgreso(equipo.tiempo, equipo.cierre)
                console.log(DateTime.now().toFormat('dd/LL/yyyy'))
                if (progreso == 0 || equipo.fecha!=DateTime.now().toFormat('dd/LL/yyyy')) {
                    equipo.activo = 0
                    desactivados.push(equipo)
                    equipo.update().then(d => {
                        dispararNotificacion(sqlite, "A finalizado el tiempo del equipo " + equipo.nombre + "", "", "", "")
                    })

                }
            }
           
            resolve(desactivados)
        }).catch(e=>reject(e))
    })

}

function equipos() {


}
equipos.verificarActivos = verificarActivos

module.exports = equipos