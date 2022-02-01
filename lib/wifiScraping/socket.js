const { Server } = require('socket.io');

const mercusys = require("./mercusys.js")
module.exports = (app, server) => {

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
        let WIFI = new mercusys()
        let page = await WIFI.open()
        let Equipos = []
        WIFI.equiposConectados(json => {
            Equipos = json.sort(function (a, b) {
                return a.ip < b.ip;
            });
            io.emit('equipos', Equipos)
        }, "invitado")
       

        socket.on('bloquear', async (MAC) => {
            console.log('bloquear',MAC)
            let equipo = Equipos.find(e => e.mac == MAC)
            if(equipo!=undefined){
                equipo.bloqueado = true
                let r = await WIFI.actualizarEquipo(equipo)
                console.log("bloqueado", r, equipo)
            }
           
        });

        socket.on('desbloquear', async (MAC) => {
            console.log('desbloquear',MAC)
            let equipo = Equipos.find(e => e.mac == MAC)
            if(equipo!=undefined){
                equipo.bloqueado = false
                let r = await WIFI.actualizarEquipo(equipo)
                console.log("desbloqueado", r, equipo)
            }
        });

        socket.on('renombrar', async ({MAC,nombre}) => {
            console.log('renombrar',MAC)
            let equipo = Equipos.find(e => e.mac == MAC)
            if(equipo!=undefined){
                equipo.nombre = nombre
                let r = await WIFI.actualizarEquipo(equipo)
                console.log("renombrar", r, equipo)
            }
           
        });

        socket.on('disconnect', function () {
            WIFI.close()
        });

    });

    return io;


}