const express = require('express')
const router = express.Router()
const auth = require('../lib/auth.js')

const mercusys = require("../lib/wifiScraping/mercusys.js")
const puppeteer = require('puppeteer-core');
router.get('/', async (req, res, next) => {

  
    let wifi = new mercusys()
    let page = await wifi.open()
    
    let respuesta = []
    wifi.equiposConectados(json => {

        res.json(json)
        wifi.close()
    }, "invitado")
   
})

router.post('/bloquear', auth, async (req, res, next) => {

    let wifi = new mercusys()
    let page = await wifi.open()
    await wifi.verInvidatos()
    let r = await wifi.bloqueraEquipo(req.body.ip)
    res.json({ ok: r })
    page.close()
})
router.post('/desbloquear', auth, async (req, res, next) => {

    let wifi = new mercusys()
    let page = await wifi.open()
    await wifi.verInvidatos()
    let r = await wifi.desbloqueraEquipo(req.body.mac)
    res.json({ ok: r })
    page.close()
})
router.post('/renombrar', async (req, res, next) => {

    let wifi = new mercusys()
    let page = await wifi.open()
    let url =""
    var id = "";
    page.on("response", async (response) => {
        if (response.url().includes('?code=2&asyn=1&id')) {
            id = response.url().split("&")[2].slice(3)
        }

    })
    await page.waitForSelector('.bEptLHDInfo > .bEptHostInfo > .bEptIp')
    let ok = await page.evaluate(async (id) => {
        
        return (await fetch("http://192.168.1.1/?code=0&asyn=0&id="+id, {
          body: "main staMgt -add mac:80-9b-20-c2-04-18 name:santi upload:0 download:0",
          method: 'POST',
          })).text();


    },id);

    res.json({ ok: ok,id:id })
    page.close()
})
module.exports = router
