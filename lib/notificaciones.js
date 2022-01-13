const { DateTime } = require("luxon");
const webpush = require('./web-push.js')
function notificaciones(sqlite) {




}

function dispararNotificacion(sqlite, descripcion, href, icon, type) {
    let time = DateTime.now()
    let Notificaciones = sqlite.tabla('notificaciones')
    Notificaciones.insert(null, descripcion, href, icon, time.toFormat('yyyy/MM/dd H:mm:ss'), false).then(d=>{
        dispararWebPush(sqlite, descripcion)
    })
}
function suscribir(sqlite, pushSubscripton) {
    let Suscripciones = sqlite.tabla('suscripciones')

    return Suscripciones.insert(pushSubscripton.keys.auth,pushSubscripton.expirationTime, JSON.stringify(pushSubscripton))

}
 function dispararWebPush(sqlite, descripcion) {
    let Suscripciones = sqlite.tabla('suscripciones')
    return Suscripciones.select().then(async d => {
        const payload = JSON.stringify({
            title: "Control De Wifi",
            message:descripcion
        });
        for (suscriptor of d) {
            try {
               
                await webpush.sendNotification(JSON.parse(suscriptor.json), payload);
            } catch (error) {
                console.log(error);
            }
        }
    })
    // Payload Notification

}
notificaciones.dispararNotificacion = dispararNotificacion
notificaciones.suscribir = suscribir
module.exports = notificaciones  