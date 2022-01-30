const puppeteer = require('puppeteer-core');

class mercusys {
    constructor(browserP) {
        this.browserP = browserP
        this.url = "http://192.168.1.1/"
        this.tokenId = ""
    }
    async open() {
        let password = process.env.MERCUSYS_PASS
        this.page = await (await this.browserP).newPage();
        await this.page.setUserAgent('5.0 (Windows NT 10.0; Win32; 32) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36');
        //turns request interceptor on
        

        await this.page.goto(this.url);
        await this.page.waitForSelector(".lgCon");
        await this.page.type("#lgPwd", password);
        await this.page.click("#loginSub");
        // await this.page.waitForSelector(".basicMenuFRM");
        return this.page
    }
    async close() {
        return await this.page.close()
    }
    equiposConectados(func, tipo) {

        this.page.on("response", async (response) => {
            if (response.url().includes('?code=2&asyn=1&id')) {
                this.tokenId = response.url().split("&")[2].slice(3)
                let text = await response.text()
                if (text == "")
                    return;
                let json = this.procesarRespuesta(text)
                let respuesta = this.acomodarJson(json, tipo)
                if(respuesta.length>0)
                func(respuesta)
            }

        })


    }
    async verInvidatos() {
        await this.page.waitForSelector("#bEptGuestMenuLi");
        await this.page.click("#bEptGuestMenuLi");

    }
    prepararDatosPeticion(equipo) {
        let body = "main staMgt -add mac:" + equipo.mac + " name:" + equipo.nombre + " upload:0 download:0"
        if (equipo.bloqueado) {
            body = body + " blocked"
        }
        let url = this.url + "?code=0&asyn=0&id=" + this.tokenId
        return { url: url, body: body }
    }
    async actualizarEquipo(equipo) {
        await this.page.waitForSelector('.bEptLHDInfo > .bEptHostInfo > .bEptIp')
        let data = this.prepararDatosPeticion(equipo)


        let ok = await this.page.evaluate(async (url, body) => {
            return (await fetch(url, {
                body: body,
                method: 'POST',
            })).text();

        }, data.url, data.body);

        return ok


    }
    async desbloquearEquipo(mac) {
        await this.page.waitForSelector("#bEptForbidMenuLi");
        await this.page.click("#bEptForbidMenuLi");
        await this.page.waitForSelector('.bEptList > .bEptLHDFInfo > .bEptHostDetl')

        let ok = await this.page.evaluate((mac) => {

            var macs = document.querySelectorAll('.bEptList > .bEptLHDFInfo > .bEptHostDetl > span');
            let id = null;

            for (let i in macs) {

                if (macs[i].outerText == "MAC " + mac.toUpperCase()) {
                    id = i
                    break;
                }

            }

            if (id == null) {
                return false
            }
            var botones = document.querySelectorAll('.bEptLHDFUnForbid > .bEptLSImgHandleC');
            botones[id].click()

            return true


        }, mac);
        //  await this.page.waitForSelector("#bEptList > .bEptLHDInfo > .bEptLogoImg");
        return ok
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
                        down: json.down[i]

                    })
                } else if (t == "privado" && tipo == "privado") {
                    nuevo.push({
                        nombre: json.name[i],
                        mac: json.mac[i],
                        ip: json.ip[i],
                        type: tipo,
                        bloqueado: bloqueado,
                        up: json.up[i],
                        down: json.down[i]
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
                    down: json.down[i]
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