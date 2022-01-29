const puppeteer = require('puppeteer-core');

class mercusys {
    constructor(browserP) {
        this.browserP = browserP
        this.url="http://192.168.1.1/"
    }
    async open() {
        let password = process.env.MERCUSYS_PASS
        this.page = await (await this.browserP).newPage();
        await this.page.setUserAgent('5.0 (Windows NT 10.0; Win32; 32) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36');
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
                let text = await response.text()
                if (text == "")
                    return;
                let json = this.procesarRespuesta(text)
                func(this.acomodarJson(json, tipo))
            }

        })
        

    }
    async verInvidatos() {
        await this.page.waitForSelector("#bEptGuestMenuLi");
        await this.page.click("#bEptGuestMenuLi");

    }
    async bloqueraEquipo(ip, tipo = "invitado") {


        let clase = "LHDG"
        if (tipo == "privado") {
            clase = "LHD"
        }
        await this.page.waitForSelector('.bEpt' + clase + 'Info > .bEptHostInfo > .bEptIp')
        let ok = await this.page.evaluate((ip, clase) => {
           
            var ips = document.querySelectorAll('.bEpt' + clase + 'Info > .bEptHostInfo > .bEptIp');
            let id = null;
            let inder = []
            for (let i in ips) {
              
                if (ips[i].outerText == "IP " + ip) {
                    id = i
                    break;
                }
            }
            if (id == null) {
                return false
            }
            var botones = document.querySelectorAll('.bEpt' + clase + 'Forbid > .bEptLSImgHandleC');
            botones[id].click()

            return true


        }, ip, clase);
      //  await this.page.waitForSelector("#bEptList > .bEptLHDInfo > .bEptLogoImg");
        return ok


    }
    async desbloqueraEquipo(mac) {
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
            let bloqueado =json.blocked[i]=="0"?false:true
            if (json.mac[i] == "" || json.online[i] == "0")
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
                        bloqueado:bloqueado
                    })
                } else if (t == "privado" && tipo == "privado") {
                    nuevo.push({
                        nombre: json.name[i],
                        mac: json.mac[i],
                        ip: json.ip[i],
                        type: tipo,
                        bloqueado:bloqueado
                    })
                }
            } else {
                nuevo.push({
                    nombre: json.name[i],
                    mac: json.mac[i],
                    ip: json.ip[i],
                    type: tipo,
                    bloqueado:bloqueado
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