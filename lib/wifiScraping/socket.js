const {Server} = require('socket.io');
const browser = require("./browser.js")
const mercusys = require("./mercusys.js")
module.exports=(app,server)=>{
    
    const io = new Server(server, {
        cors: {
          origin: "http://localhost:8081",
          methods: ["GET", "POST"],
          credentials: true
        },
        allowEIO3: true
      })
    app.use((req,res,next)=>{
        req.io=io
        next()
    })
    io.on('connection', async (socket) => {
        console.log('nuevo conectado ')
        let WIFI = new mercusys(browser)
        let page = await WIFI.open()
        WIFI.equiposConectados(json =>  io.emit('equipos', json), "invitado")
        socket.on('bloquear', async (IP) => {
            console.log('bloquear',IP)
            await WIFI.verInvidatos()
            let r = await WIFI.bloqueraEquipo(IP)
            console.log("bloqueado",r)
        });
        socket.on('desbloquear',async (MAC) => {
            console.log("desbloquear ",MAC)
            let r = await WIFI.desbloqueraEquipo(MAC)
            console.log("desbloqueado",r)
        });
        socket.on('disconnect', function () {
            WIFI.close()
        });

    });
    
   


}