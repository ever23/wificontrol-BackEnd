const { Server } = require('socket.io');

const mercusys = require("../lib/wifiScraping/mercusys.js")
module.exports = (app, server,sqlite) => {

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
        let okConexion = false
     
        let configuraciones = await sqlite.tabla('configuraciones').selectOne()
        let WIFI = new mercusys(configuraciones)
        try {
            let page = await WIFI.open()
        } catch (e) {
            console.log(e)
            io.emit('error-conexion', "")
            WIFI.close()
            return;

        }



        let Equipos = []
        WIFI.equiposConectados(json => {
            if (!okConexion) {
                io.emit('ok-conexion', "")
                okConexion = true
            }
            Equipos = json.sort(function (a, b) {
                return a.ip < b.ip;
            });
            io.emit('equipos', Equipos.filter(e => e.type == "invitado"))
            io.emit('equiposPrivados', Equipos.filter(e => e.type == "privado"))
        }, false)



        socket.on('bloquear', async (MAC) => {
            console.log('bloquear', MAC)
            let equipo = Equipos.find(e => e.mac == MAC)
            if (equipo != undefined) {
                equipo.bloqueado = true
                let r = await WIFI.actualizarEquipo(equipo)
                console.log("bloqueado", r, equipo)
            }

        });

        socket.on('desbloquear', async (MAC, nombre = null) => {
            console.log('desbloquear', MAC)
            let equipo = Equipos.find(e => e.mac == MAC)
            if (equipo != undefined) {
                equipo.bloqueado = false
                equipo.nombre = nombre == null ? equipo.nombre : nombre
                let r = await WIFI.actualizarEquipo(equipo)
                console.log("desbloqueado", r, equipo)
            }
        });

        socket.on('renombrar', async ({ MAC, nombre }) => {
            console.log('renombrar', MAC)
            let equipo = Equipos.find(e => e.mac == MAC)
            if (equipo != undefined) {
                equipo.nombre = nombre
                let r = await WIFI.actualizarEquipo(equipo)
                console.log("renombrar", r, equipo)
            }

        });
        socket.on('informacionInvitados', async (func) => {
            func(await WIFI.redInvitados())
        });
        socket.on('actualizarRedInvitados', async (data, func) => {
            console.log(data)
            func(await WIFI.actualizarRedInvitados(data)) 
        });


        socket.on('disconnect', function () {
            WIFI.close()
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