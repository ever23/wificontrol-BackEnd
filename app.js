require("dotenv").config()
const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const session = require('express-session')
const sqlite = require("sqlite3-tab")
const {bloquearFinalizados} = require("./lib/equipos.js")
const indexRouter = require('./routes/index')
const history = require('connect-history-api-fallback');
const passport = require('./lib/passport/local-auth.js')
const http = require('http')
const app = express();
const server = http.createServer(app)
const io = require('./sockets/wifi')(app, server);
// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs');
const port = process.env.PORT
const { DateTime } = require("luxon");


app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(session({
    secret: 'wifi',
    resave: false,
    saveUninitialized: false,
    cookie: {},

}));

app.use(cookieParser())
app.use(passport.initialize())
app.use(passport.session())
const staticFileMiddleware = express.static(path.join(__dirname, 'public'))


// Configurar cabeceras y cors
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:8081');
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});
app.disable('etag');




const connect = new sqlite("./wifi.db")
connect.connect(e => {
    console.log(e, "s")
})
connect.pathModels(path.dirname(__filename) + '/model')

app.use(function (req, res, next) {
    req.sqlite = connect
    next()
});

app.use(history({
    index: 'index.html',
    disableDotRule: true,
    verbose: true,
    htmlAcceptHeaders: ['text/html', 'application/xhtml+xml'],
}));
app.use(staticFileMiddleware);
app.use('/api', indexRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404))
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'dev' ? err : {}

    // render the error page
    res.status(err.status || 500)
    res.render('error')
});
app.use(function (err, req, res, next) {
    console.log(err)
    next()
});
function verificar (time){
    console.log('verificando...')
    bloquearFinalizados(connect,io).then(desconectados=>{

        console.log(desconectados)
      
    }).catch(e=>{
        console.log(e)
    }).finally(()=>{
        console.log(DateTime.now().toFormat("HH:mm:ss")+' listo...')
        setTimeout(()=>verificar(time),time)
    })
}
server.listen(port, (req, res) => {
    console.log("Iniciado en http://localhost:" + port)
   verificar(60000)

})

module.exports = app
