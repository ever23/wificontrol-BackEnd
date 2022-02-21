const sqlite=require("sqlite3-tab")
const path = require('path')
const model1 = require('./model/usuarios.js')
const model = require("tabla-model")
const connect = new sqlite("./wifi.db")
const { DateTime } = require("luxon");
/*console.log(connect);
for (const model in connect.__models) {
  console.log(model1.sql({escapeChar:null, reserveIdentifiers:null, ar_aliased_tables:null, dbprefix:null, escapeString:null}));
}*/


connect.query('drop table configuraciones');

