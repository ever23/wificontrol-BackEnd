const express = require('express')
const router = express.Router()
const auth = require('../lib/auth.js')
const browser = require("../lib/wifiScraping/browser.js")
const mercusys = require("../lib/wifiScraping/mercusys.js")

router.get('/', auth, async (req, res, next) => {

    let wifi = new mercusys(browser)
    let page = await wifi.open()
    let respuesta = []
    wifi.equiposConectados(json => {

        res.json(json)
    }, "invitado")
    await page.waitForSelector("#bEptList > .bEptLHDInfo > .bEptLogoImg");
    page.close()

})

router.post('/bloquear', auth, async (req, res, next) => {

    let wifi = new mercusys(browser)
    let page = await wifi.open()
    await wifi.verInvidatos()
    let r = await wifi.bloqueraEquipo(req.body.ip)
    res.json({ ok: r })
    page.close()
})
router.post('/desbloquear', auth, async (req, res, next) => {

    let wifi = new mercusys(browser)
    let page = await wifi.open()
    await wifi.verInvidatos()
    let r = await wifi.desbloqueraEquipo(req.body.mac)
    res.json({ ok: r })
    page.close()
})
router.post('/renombrar', auth, async (req, res, next) => {

    let wifi = new mercusys(browser)
    let page = await wifi.open()
    let ok = await page.evaluate((ip, clase) => {
        const http = new XMLHttpRequest()
      


    }, ip, clase);

    res.json({ ok: r })
    page.close()
})
module.exports = router
