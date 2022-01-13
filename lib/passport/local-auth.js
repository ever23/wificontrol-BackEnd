const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt-nodejs')
passport.serializeUser((user, done) => {
    done(user.id_user)
})

passport.deserializeUser((id, done) => {

})

passport.use('local-signup', new LocalStrategy({
    nameField: "user",
    passwordField: "pass",
    passReqToCallback: true
},(req, user, pass, done) => {
    let Users = req.sqlite.tabla('usuarios')

    Users.selectOne(`user='${user}'`)
        .then(data => {
            if (!data) {
                done("Nombre de Usuario  invalido")
                return data
            }
            if (!bcrypt.compareSync(pass, data.hash)) {
                done("La contraseña es invalida")
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
            console.log("done")
            done(null, resData)

        }).catch(e => {
            done(e)
        })
}))
module.exports = passport