//const puppeteer = require('puppeteer-core');
const puppeteer = require('puppeteer');

class mercusys {
    constructor(browserP) {

        this.url = "http://192.168.1.1/"
        this.tokenId = ""
        console.log('habriendo crome..')
        this.browserP = puppeteer.launch({
           // executablePath: process.env.BROWSER_PATH,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
            headless: process.env.BROWSER_VISIBLE == "true" ? true : false
        });
        

        
        
    }
    
    async open() {

        let password = process.env.MERCUSYS_PASS
        console.log('abriendo pagina ..')
        this.page = await (await this.browserP).newPage();
        //turns request interceptor on
        await this.page.goto(this.url);
        console.log('iniciando session  ..')
        await this.iniciarSession(password);
        console.log('session listo ..')

        // await this.page.waitForSelector(".basicMenuFRM");
        return this.page
    }
    async iniciarSession(password) {

        await this.page.waitForSelector("#lgPwd")
        await this.page.type("#lgPwd", password);
        await this.page.click("#loginSub");
    }
    async close() {
       
        (await this.browserP).close() 
    }

    equiposConectados(func, tipo) {

        this.page.on("response", async (response) => {
            if (response.url().includes(this.url+'?code=2&asyn=1&id')) {
                this.tokenId = response.url().split("&")[2].slice(3)
                let text = await response.text()
                if (text == "")
                    return;
                let json = this.procesarRespuesta(text)
                let respuesta = this.acomodarJson(json, tipo)
                func(respuesta)
                

            }

        })


    }
    async verInvidatos() {
        await this.page.waitForSelector("#bEptGuestMenuLi");
        await this.page.click("#bEptGuestMenuLi");

    }
    prepararDatosPeticion(equipo,code='0',asyn='0') {
        let body = "main staMgt -add mac:" + equipo.mac + " name:" + equipo.nombre + " upload:0 download:0"
        if (equipo.bloqueado) {
            body = body + " blocked"
        }
        let url = this.url + "?code="+code+"&asyn="+asyn+"&id=" + this.tokenId
        return { url: url, body: body ,resEsperada:`00000\r\n${equipo.nombre}`}
    }
    async actualizarEquipo(equipo,intentos=3) {

        if(this.intentosActualizarEquipos!=undefined && this.intentosActualizarEquipos>intentos){
            this.intentosActualizarEquipos=undefined
            return false
        }
        if(this.intentosActualizarEquipos==undefined)
        this.intentosActualizarEquipos=0
       
        let data = this.prepararDatosPeticion(equipo)

        console.log(data)
        let respuesta = await this.page.evaluate(async (url, body) => {
            return (await fetch(url, {
                body: body,
                method: 'POST',
            })).text();

        }, data.url, data.body);
        let res = respuesta.split('\r\n')
        let ok =res[0]=='00000' && res[1]==equipo.nombre
        if(!ok){
            this.intentosActualizarEquipos++
            console.log('intento de actualizar '+this.intentosActualizarEquipos+" "+data.url)
            return this.actualizarEquipo(equipo,intentos)
        }else{
            this.intentosActualizarEquipos=undefined
            return ok
        }
    }
    async redInvitados(){
        let url = this.url + "?code=2&asyn=0&id=" + this.tokenId

    
        let result = await this.page.evaluate(async (url, body) => {
            return (await fetch(url, {
                body: "35",
                method: 'POST',
            })).text();

        }, url);
        let procesado = this.procesarRespuestaRed(result)
        console.log(procesado)
        return procesado
    }
    procesarRespuestaRed(res) {
        let data = res.split('\r\n')
        let json = {}
        data.forEach((d, i) => {
            let d2 = d.split(' ')
            if (typeof json[d2[0]] != 'object') {
                json[d2[0]] = []
            }
            json[d2[0]].push(d2[1])

        })
        return {
            red:json.cSsid[0],
            password:json.cPskSecret[0],
            UploadSpeed:json.uMaxUploadSpeed[0],
            DownloadSpeed:json.uMaxDownloadSpeed[0]

        }
    }

    acomodarJson(json, t = null) {

        let nuevo = []
        for (let i in json.mac) {
            let bloqueado = json.blocked[i] == "0" ? false : true
            if (json.mac[i] == "00-00-00-00-00-00" || (json.online[i] == "0" && json.blocked[i] == "0"))
                continue;
            let tipo = "privado"
            if (json.type[i] == "2")
                tipo = "invitado"
            if (t) {
                if (t == "invitado" && tipo == "invitado") {
                    nuevo.push({
                        nombre: json.name[i],
                        mac: json.mac[i],
                        ip: json.ip[i],
                        type: tipo,
                        bloqueado: bloqueado,
                        up: json.up[i],
                        down: json.down[i],
                        upLimit: json.upLimit[i],
                        downLimit: json.downLimit[i]

                    })
                } else if (t == "privado" && tipo == "privado") {
                    nuevo.push({
                        nombre: json.name[i],
                        mac: json.mac[i],
                        ip: json.ip[i],
                        type: tipo,
                        bloqueado: bloqueado,
                        up: json.up[i],
                        down: json.down[i],
                        upLimit: json.upLimit[i],
                        downLimit: json.downLimit[i]
                    })
                }
            } else {
                nuevo.push({
                    nombre: json.name[i],
                    mac: json.mac[i],
                    ip: json.ip[i],
                    type: tipo,
                    bloqueado: bloqueado,
                    up: json.up[i],
                    down: json.down[i],
                    upLimit: json.upLimit[i],
                    downLimit: json.downLimit[i]
                })
            }


        }
        return nuevo
    }
    procesarRespuesta(res) {
        let data = res.split('\r\n')
        let json = {}
        data.forEach((d, i) => {
            let d2 = d.split(' ')
            if (typeof json[d2[0]] != 'object') {
                json[d2[0]] = []
            }
            json[d2[0]].push(d2[2])

        })
        return json
    }

}





module.exports = mercusys