require("dotenv").config()
const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const session = require('express-session')
const sqlite = require("sqlite3-tab")
const equipos = require("./lib/equipos.js")
var indexRouter = require('./routes/index')
const history = require('connect-history-api-fallback');

const passport = require('./lib/passport/local-auth.js')
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs');
const port = process.env.PORT



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
    disableDotRule: true,
    verbose: true,
    htmlAcceptHeaders: ['text/html', 'application/xhtml+xml'],
}));
app.use(staticFileMiddleware);
app.use('/api', indexRouter)
app.get('/', function (req, res) {
    res.render(path.join(__dirname + '/public/index.html'));
});

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
const http = require('http')
const browser = require("./lib/wifiScraping/browser.js")
const mercusys = require("./lib/wifiScraping/mercusys.js")
const server = http.createServer(app).listen(port, (req, res) => {
    console.log("Iniciado en http://localhost:" + port)
    var io  = require('./lib/wifiScraping/socket')(app, server);
    setInterval(() => {
        console.log('verificando...')
        equipos.verificarActivos(connect).then(async desactivados => {


            if (desactivados.length > 0) {
                let wifi = new mercusys(browser)
                let page = await wifi.open()
                wifi.equiposConectados(json => { }, "invitado")
                await page.waitForSelector('.bEptLHDInfo > .bEptHostInfo > .bEptIp')
                for (let des of desactivados) {
                    io.emit("notificacion",{
                        title: "Control De Wifi",
                        message:"Finalizo el tiempo de "+des.nombre+" "+des.ip+" "+des.mac
                    })

                    let r = await wifi.actualizarEquipo({ mac: des.mac, nombre: des.nombre, bloqueado: true })

                }
                page.close()
            }
            console.log('listo!')

        })
    }, 60000);
})


module.exports = app
