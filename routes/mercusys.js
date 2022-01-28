const express = require('express')
const router = express.Router()
const auth = require('../lib/auth.js')
const browser = require("../lib/wifiScraping/browser.js")
const mercusys = require("../lib/wifiScraping/mercusys.js")

router.get('/',async (req, res, next) => {
    
    let wifi = new mercusys(browser)
    let page = await wifi.open()
    let respuesta = []
    wifi.equiposConectados(json=>{
       
        res.json(json)
    },"invitado")
    await page.waitForSelector("#bEptList > .bEptLHDInfo > .bEptLogoImg");
    page.close()
    
})
router.post('/bloquear',async (req, res, next) => {
    
    let wifi = new mercusys(browser)
    let page = await wifi.open()
    await wifi.verInvidatos()
    let r=await wifi.bloqueraEquipo(req.body.ip)
    res.json({ok:r})
    page.close()
})
router.post('/desbloquear',async (req, res, next) => {
    
    let wifi = new mercusys(browser)
    let page = await wifi.open()
    await wifi.verInvidatos()
    let r=await wifi.desbloqueraEquipo(req.body.mac)
    res.json({ok:r})
    page.close()
})
module.exports = router
