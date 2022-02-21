const express = require('express')
const router = express.Router()
const auth = require('../lib/auth.js')
const bcrypt = require('bcrypt-nodejs')
const passport = require('../lib/passport/local-auth.js')
const SALT = 10;

router.post('/', (req, res, next) => {
    let user = req.body.user,
        pass = req.body.pass
    Users = req.sqlite.tabla('usuarios')
    Sessiones = req.sqlite.tabla('sessiones')

    Users.selectOne(`user='${user}'`)
        .then(data => {
            if (!data) {
                res.json({ login: false, error: "Nombre de Usuario  invalido" })
                return data
            }
            if (!bcrypt.compareSync(pass, data.hash)) {
                res.json({ login: false, error: "La contraseña es invalida" })
                return data
            }

            let resData = {
                id_user: data.id_usuarios,
                user: data.user,
                nombres: data.nombres,
                apellidos: data.apellidos,
                permisos: data.permisos,
                token: req.sessionID,
                login: true
            }
            //console.log(req.session,req.sessionID,data)
            req.session.user = resData
            req.session.user.hash = data.hash
            Sessiones.insert(req.sessionID, new Date(), data.id_usuarios)
                .then(ok => {

                    res.json({
                        login: true,
                        data: resData
                    })

                }).catch(e => {
                    req.session.destroy(function (err) {
                        console.log(err)
                        res.json({
                            login: false,
                            error: 'Sesion exixtente intente de nuevo'
                        })
                    })
                })
        }).catch(e => {
            console.log(e)
            res.json({
                login: '2',
                error: ` ${e}`
            }) 
        })
});

router.delete('/',async (req, res, next) => {
    let user = req.query.id_usuarios
    Users = req.sqlite.tabla('usuarios')
    let usuario = await Users.selectOne("id_usuarios="+user)
    if(!usuario){
        res.json({
            ok: false,
            error: "El usuario no existe"
        })
    }
    usuario.delete().then(ok=>{
        res.json({
            ok: true
        })
    }).catch(e=>{
        console.log(e)
        res.json({
            ok: false,
            error: "No fue posible eliminar"
        })
    })
    
});

router.get('/islogin', (req, res, next) => {
    
    auth.auth(req).then(data => {
        let resData = {
            id_user: data.id_usuarios,
            user: data.user,
            nombre: data.nombre,
            root: data.root,
            token: req.sessionID,
            login: true
        }
        res.json({
            login: true,
            data: resData
        })
    }).catch(e => {
        res.json({
            login: false,
            data: { login: false },
            e: e
        })
    })
})
router.get('/logout', (req, res, next) => {
    req.session.destroy(function (err) {
        res.json({ "logout": true })
    })
})
router.get('/isNew',(req, res, next) => {

    let Users = req.sqlite.tabla('usuarios')
    Users.select().then(data => {

        if(data.length==0){
            res.json({ok:false})
        }else{
            res.json({ok:true})
        }
        

    }).catch(e => {
        return res.json(e)
    })

})
router.post('/primerRegistro', async (req, res, next) => {

    let Request = req.body
    let Users = req.sqlite.tabla('usuarios')
    let result = Users.select()
    if(result.length<1){
        return res.json({ ok: false, error: "Ya existe un usuario registrado " })
    }

    if (Request['pass1'] != Request['pass2']) {
        return res.json({ ok: false, error: "Contraseñas no coiciden " })
    }
    const salt = await bcrypt.genSaltSync(SALT);
    const hash = await bcrypt.hashSync(Request['pass1'], salt);
    Users.insert(null, Request['user'], hash, Request['nombre'],true).then(ok => {
        return res.json({ ok: true, error: "" })

    }).catch(e => {
        return res.json({ ok: false, error: "Imposible registrar" })
    })

})

router.post('/registro',auth, async (req, res, next) => {

    let Request = req.body

    let Users = req.sqlite.tabla('usuarios')
    if (Request['pass1'] != Request['pass2']) {
        return res.json({ ok: false, error: "Contraseñas no coiciden " })
    }
    const salt = await bcrypt.genSaltSync(SALT);
    const hash = await bcrypt.hashSync(Request['pass1'], salt);
    Users.insert(null, Request['user'], hash, Request['nombre'],false).then(ok => {
        return res.json({ ok: true, error: "" })

    }).catch(e => {
        return res.json({ ok: false, error: "Imposible registrar" })
    })

})
router.get('/lista', auth,(req, res, next) => {

    let Users = req.sqlite.tabla('usuarios')
    Users.select().then(data => {

        return res.json(data)

    }).catch(e => {
        return res.json(e)
    })

})
module.exports = router
