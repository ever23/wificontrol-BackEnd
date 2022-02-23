//const puppeteer = require('puppeteer-core');
const puppeteer = require('puppeteer');

class mercusys {
    constructor(config) {

        this.url = config.url_router
        this.password = config.pass_router
        this.tokenId = ""
        console.log('habriendo crome..')
        this.browserP = puppeteer.launch({
            // executablePath: process.env.BROWSER_PATH,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
            headless: process.env.BROWSER_VISIBLE == "true" ? true : false
        });




    }

    async open() {


        console.log('abriendo pagina ..')
        this.page = await (await this.browserP).newPage();
        //turns request interceptor on
        await this.page.goto(this.url);
        console.log('iniciando session  ..')
        await this.iniciarSession(this.password);
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

            if (response.url().includes(this.url + '?code=2&asyn=1&id')) {
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
    prepararDatosPeticion(equipo, code = '0', asyn = '0') {
        let body = "main staMgt -add mac:" + equipo.mac + " name:" + equipo.nombre
        if (equipo.upLimit) {
            body = body + " upload:" + equipo.upLimit
        } else {
            body = body + " upload:0"
        }
        if (equipo.downLimit) {
            body = body + " download:" + equipo.downLimit
        } else {
            body = body + " download:0"
        }
        if (equipo.bloqueado) {
            body = body + " blocked"
        }
        let url = this.url + "?code=" + code + "&asyn=" + asyn + "&id=" + this.tokenId
        return { url: url, body: body, resEsperada: `00000\r\n${equipo.nombre}` }
    }
    async actualizarEquipo(equipo, intentos = 3) {

        if (this.intentosActualizarEquipos != undefined && this.intentosActualizarEquipos > intentos) {
            this.intentosActualizarEquipos = undefined
            return false
        }
        if (this.intentosActualizarEquipos == undefined)
            this.intentosActualizarEquipos = 0

        let data = this.prepararDatosPeticion(equipo)

        console.log(data)
        let respuesta = await this.page.evaluate(async (url, body) => {
            return (await fetch(url, {
                body: body,
                method: 'POST',
            })).text();

        }, data.url, data.body);
        let res = respuesta.split('\r\n')
        let ok = res[0] == '00000' && res[1] == equipo.nombre
        if (!ok) {
            this.intentosActualizarEquipos++
            console.log('intento de actualizar ' + this.intentosActualizarEquipos + " " + data.url)
            return this.actualizarEquipo(equipo, intentos)
        } else {
            this.intentosActualizarEquipos = undefined
            return ok
        }
    }
    async actualizarRedInvitados(red) {
        let result = await this.page.evaluate(async (url, body) => {
            return (await fetch(url, {
                body: "35",
                method: 'POST',
            })).text();

        }, this.url + "?code=2&asyn=0&id=" + this.tokenId);
        let procesado = this.procesarRespuestaRed(result)
        procesado.cSsid = typeof red.red !== undefined ? red.red : procesado.cSsid

        procesado.cPskSecret = typeof red.password !== undefined ? red.password : procesado.cPskSecret
        procesado.uMaxUploadSpeed = typeof red.UploadSpeed !== undefined ? red.UploadSpeed : procesado.uMaxUploadSpeed
        procesado.uMaxDownloadSpeed = typeof red.DownloadSpeed !== undefined ? red.DownloadSpeed : procesado.uMaxDownloadSpeed
        procesado.bEnable = typeof red.activo !== undefined ? Number(red.activo) : procesado.bEnable
        procesado.bSecurityEnable = typeof red.seguridadActiva !== undefined ? Number(red.seguridadActiva) : procesado.bSecurityEnable
        let data = ''

        for (let i in procesado) {
            if (i == "uTimeTable" || i == "00000" || i == "")
                continue;
            data += i + " " + procesado[i] + '\r\n'
        }
        data += 'uTimeTable 1 0\r\n'
        data += 'uTimeTable 2 0\r\n'
        data += 'uTimeTable 3 0\r\n'
        data += 'uTimeTable 4 0\r\n'
        data += 'uTimeTable 5 0\r\n'
        data += 'uTimeTable 6 0\r\n'
        console.log(data)
        let result2 = await this.page.evaluate(async (url, body) => {
            return (await fetch(url, {
                body: body,
                method: 'POST',
            })).text();

        }, this.url + "?code=1&asyn=0&id=" + this.tokenId, data);
        if (result2 == '00000\r\n') {
            return true
        } else {
            return false
        }


    }

    async redInvitados() {
        let url = this.url + "?code=2&asyn=0&id=" + this.tokenId


        let result = await this.page.evaluate(async (url, body) => {
            return (await fetch(url, {
                body: "35",
                method: 'POST',
            })).text();

        }, url);
        let procesado = this.procesarRespuestaRed(result)
        console.log(procesado)
        return {
            activo: procesado.bEnable == '1' ? true : false,
            red: procesado.cSsid,
            password: procesado.cPskSecret,
            UploadSpeed: procesado.uMaxUploadSpeed,
            DownloadSpeed: procesado.uMaxDownloadSpeed,
            seguridadActiva: procesado.bSecurityEnable == '1' ? true : false

        }
    }
    procesarRespuestaRed(res) {
        let data = res.split('\r\n')
        let json = {}
        data.forEach((d, i) => {
            let d2 = d.split(' ')
            let elemento = d2[0]

            json[elemento] = d2.splice(1).join(' ')

        })
        return json
    }

    acomodarJson(json, t = null) {
       
        let nuevo = []
        for (let i in json.mac) {
            let bloqueado = json.blocked[i] == "0" ? false : true
            let online = json.online[i] == "0" ? false : true
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
                        downLimit: json.downLimit[i],
                        online: online,

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
                        downLimit: json.downLimit[i],
                        online: online,
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
                    downLimit: json.downLimit[i],
                    online: online,
                })
            }
        }
        return nuevo.sort(((a, b) => a.ip.slice(-3) - b.ip.slice(-3)))
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