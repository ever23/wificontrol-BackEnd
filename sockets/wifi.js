const { Server } = require('socket.io');

const mercusys = require("../lib/wifiScraping/mercusys.js")

async function openBrowser(configuraciones, Conectados) {
    return new Promise(async (resolve, rejec) => {
        let WIFI = new mercusys(configuraciones)
        let okConexion = false;
        try {
            let page = await WIFI.open()

        } catch (e) {
            console.log(e)
            WIFI.close()
            rejec(e)

        }
        WIFI.equiposConectados(json => {
            if (!okConexion) {
                resolve(WIFI)
                okConexion = true
            }
            Conectados(json)
        }, false)
        setTimeout(() => {
            if (!okConexion) {
                WIFI.close()
                rejec("exedido el tiempo de 5000ms")
            }
        }, 5000)
    })


}


module.exports = (app, server, sqlite) => {

    const io = new Server(server, {
        cors: {
            origin: "http://localhost:8081",
            methods: ["GET", "POST"],
            credentials: true
        },
        allowEIO3: true
    })
    app.use((req, res, next) => {
        req.io = io
        next()
    })


    io.on('connection', async (socket) => {

        console.log('nuevo conectado ')


        let configuraciones = await sqlite.tabla('configuraciones').selectOne()
        var WIFI = null;
        let Equipos = [];
        try {

            WIFI = openBrowser(configuraciones, (json) => {
                Equipos = json
                Equipos.forEach(element => {

                    io.emit('equipo/wifi/' + element.mac, element)
                });
                io.emit('equipos', Equipos)
            })


        } catch (e) {
            console.log(e)
            io.emit('error-conexion', "")
            socket
            return;

        }
        WIFI.then(w => {
            io.emit('ok-conexion', "")
            return w
        }).catch(e => {
            io.emit('error-conexion', "")
        })






        socket.on('bloquear', async (MAC) => {
            console.log('bloquear', MAC)
            let equipo = {}
            if (typeof MAC == "object") {
                equipo = MAC
            } else {
                equipo = Equipos.find(e => e.mac == MAC)
            }
            equipo.upLimit = 0
            equipo.downLimit = 0
            equipo.bloqueado = true
            let r = await (await WIFI).actualizarEquipo(equipo)
            console.log("bloqueado", r, equipo)


        });

        socket.on('desbloquear', async (MAC, nombre = null) => {
            console.log('desbloquear', MAC)
            let equipo = {}
            if (typeof MAC == "object") {
                equipo = MAC
            } else {
                equipo = Equipos.find(e => e.mac == MAC)
            }
            equipo.bloqueado = false
            equipo.nombre = nombre == null ? equipo.nombre : nombre
            let equipo2 = Equipos.find(e => e.mac == equipo.mac)
            if (equipo2 != undefined && equipo2.type == "invitado") {
                configuraciones = await sqlite.tabla('configuraciones').selectOne()
                equipo.upLimit = configuraciones.uplimit
                equipo.downLimit = configuraciones.downlimit
            }
            let r = await (await WIFI).actualizarEquipo(equipo)
            console.log("desbloqueado", r, equipo)

        });

        socket.on('renombrar', async ({ MAC, nombre }) => {
            console.log('renombrar', MAC)
            let equipo = Equipos.find(e => e.mac == MAC)
            if (equipo != undefined) {
                equipo.nombre = nombre
                let r = await (await WIFI).actualizarEquipo(equipo)
                console.log("renombrar", r, equipo)
            }

        });
        socket.on('informacionInvitados', async (func) => {
            func(await (await WIFI).redInvitados())
        });
        socket.on('actualizarRedInvitados', async (data, func) => {
            console.log(data)
            func(await (await WIFI).actualizarRedInvitados(data))
        });


        socket.on('disconnect', async function () {

            (await WIFI).close()


        });

    });

    return io;

    /**{
                        activo:1,
                red:'ever',
                password:'ever',
                UploadSpeed:1,
                DownloadSpeed:1
                    } */
}