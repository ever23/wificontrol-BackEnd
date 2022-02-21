
const assert = require("assert")
describe("Test de clase Mercusys ", () => {
    const Mercusys = require("../../../lib/wifiScraping/mercusys")
    let WIFI = new Mercusys({ pass_router: "admin1", url_router: "http://192.168.1.1/" })
    it("verificacion de metodos ", () => {
        assert.equal(typeof WIFI.open, "function")
        assert.equal(typeof WIFI.iniciarSession, "function")
        assert.equal(typeof WIFI.close, "function")
        assert.equal(typeof WIFI.equiposConectados, "function")
        assert.equal(typeof WIFI.actualizarEquipo, "function")
        assert.equal(typeof WIFI.actualizarRedInvitados, "function")
        assert.equal(typeof WIFI.redInvitados, "function")

    })
    it("Iniciar session mercusys.open", () => {
        return new Promise(async (resolve,reject)=>{
            try{
                let page = await WIFI.open()
                page.close()
                resolve()
            }catch(e){
                reject(e)
            }
        })
    })
    it("Ver equipos conectados mercusys.equiposConectados", () => {
        return new Promise(async (resolve,reject)=>{
            let page = await WIFI.open()
            WIFI.equiposConectados(json => {
                page.close()
                
                resolve(json)
            }, false)
        })
    })
    it("bloquear equipo mercusys.actualizarEquipo", () => {
        return new Promise(async (resolve,reject)=>{
            let page = await WIFI.open()
            WIFI.equiposConectados(async json => {
                let ok =await WIFI.actualizarEquipo({ mac: "d0-27-88-02-4b-ba", nombre:"sala1", bloqueado: true })
                page.close()
                if(ok){
                    resolve(ok)
                }else{
                    reject()
                }
               
               
            }, false)
        })
    })
    it("desbloquear equipo mercusys.actualizarEquipo", () => {
        return new Promise(async (resolve,reject)=>{
            let page = await WIFI.open()
            WIFI.equiposConectados(async json => {
                let ok = await WIFI.actualizarEquipo({ mac: "d0-27-88-02-4b-ba", nombre:"sala2", bloqueado: false })
                page.close()
                if(ok){
                    resolve(ok)
                }else{
                    reject()
                }
            }, false)
        })
    })
    it("Red invitados redInvitados mercusys.redInvitados", () => {
        return new Promise(async (resolve,reject)=>{
            let page = await WIFI.open()
            let red =await WIFI.redInvitados()
            page.close()
            resolve(red)

        }).then(red=>{
            assert.equal(typeof red, "object","debe retornar un objeto")
            assert.equal(typeof red.activo, "boolean")
            assert.equal(typeof red.red, "string")
            assert.equal(typeof red.password, "string")
            assert.equal(typeof red.UploadSpeed, "string")
            assert.equal(typeof red.DownloadSpeed, "string")
            assert.equal(typeof red.seguridadActiva, "boolean")
        })
    })
    it("Modificar Red invitados actualizarRedInvitados mercusys.actualizarRedInvitados", () => {
        let datos ={
            activo:true,
            red:"WifiAlquiler",
            password:"febrero0212",
            UploadSpeed:"30",
            DownloadSpeed:"30",
            seguridadActiva:true
        }
        return new Promise(async (resolve,reject)=>{
            let page = await WIFI.open()
            let ok =await WIFI.actualizarRedInvitados(datos)
           
            page.close()
            resolve(ok,red)

        }).then((ok,red)=>{
            assert.ok(ok)
           
        })
    })

    it("Cerra browser", () => {
        WIFI.close()
    })


})
