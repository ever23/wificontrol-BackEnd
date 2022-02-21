const { DateTime } = require("luxon");
const webpush = require('./web-push.js')
function notificaciones(sqlite) {




}

function dispararNotificacion(sqlite, descripcion, href, icon, type) {
    let time = DateTime.now()
    let Notificaciones = sqlite.tabla('notificaciones')
    Notificaciones.insert(null, descripcion, href, icon, time.toFormat('yyyy/MM/dd H:mm:ss'), false).then(d => {
        dispararWebPush(sqlite, descripcion)
    })
}
function suscribir(sqlite, pushSubscripton) {
    return new Promise(async (resolve, reject) => {

        let Suscripciones = sqlite.tabla('suscripciones')
        Suscripciones.insert(pushSubscripton.keys.auth, pushSubscripton.expirationTime, JSON.stringify(pushSubscripton))
            .then(ok => {
                resolve(ok)
            }).catch(async error => {
                if (error.errno == 19) {
                    let suscriptor = await Suscripciones.selectOne("id='" + pushSubscripton.keys.auth + "'")

                    suscriptor.expired = pushSubscripton.expirationTime
                    suscriptor.json = JSON.stringify(pushSubscripton)
                    suscriptor.update().then(ok => {
                        resolve(ok)
                    }).catch(reject)
                }else{
                    reject(errror)
                }


            })
    })

}
function dispararWebPush(sqlite, descripcion) {
    let Suscripciones = sqlite.tabla('suscripciones')
    return Suscripciones.select().then(async d => {
        const payload = JSON.stringify({
            title: "Control De Wifi",
            message: descripcion
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