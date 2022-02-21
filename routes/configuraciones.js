const express = require('express')
const router = express.Router()
const auth = require('../lib/auth.js');

router.get('/', (req, res, next)=>{
    return res.json( req.configuraciones)
});
router.put('/',auth, (req, res, next)=>{

    req.configuraciones.url_router=req.body.url_router
    req.configuraciones.pass_router=req.body.pass_router
    req.configuraciones.costo_hora=req.body.costo_hora
    req.configuraciones.banco=req.body.banco
    req.configuraciones.cedula=req.body.cedula
    req.configuraciones.telefono=req.body.telefono
    req.configuraciones.uplimit=req.body.uplimit
    req.configuraciones.downlimit=req.body.downlimit
    req.configuraciones.update().then(ok=>{
        return res.json({ok:true})
    }).catch(e=>{
        console.log(e)
        return res.json({ok:false,error:"No fue posible actualizar"})
    })
    
});
router.put('/modo-oscuro',auth, (req, res, next)=>{

    req.configuraciones.modo_oscuro=true
    req.configuraciones.update().then(ok=>{
        return res.json({ok:true})
    }).catch(e=>{
        return res.json({ok:false,error:"No fue posible actualizar"})
    })
    
});
router.put('/modo-normal',auth, (req, res, next)=>{

    req.configuraciones.modo_oscuro=false
    req.configuraciones.update().then(ok=>{
        return res.json({ok:true})
    }).catch(e=>{
        return res.json({ok:false,error:"No fue posible actualizar"})
    })
    
});
module.exports = router
