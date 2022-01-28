const { DateTime } = require("luxon");
const { dispararNotificacion } = require("./notificaciones");
const wifi = require("./wifiScraping/wifi.js")
const browser = require("./wifiScraping/browser.js")
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
            bloquear(desactivados).then(d=>{
                resolve(desactivados)
            }).catch(e=>reject(e))
            
        }).catch(e=>reject(e))
    })

}
function bloquear(desactivados)
{
    return new Promise(async function(res,rej){
        if(desactivados.length>0){
            let wifi = new mercusys(browser)
            let page = await wifi.open(process.env.MERCUSYS_PASS)
            await wifi.verInvidatos()
            for(let des of desactivados){
                let r=await wifi.bloqueraEquipo(des.ip)
            }
            page.close()
        }
        res()
        
    })
    
   
}

function equipos() {


}
equipos.verificarActivos = verificarActivos

module.exports = equipos