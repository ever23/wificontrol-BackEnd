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
connect.pathModels(path.dirname(__filename) + '/model')
let equipos=connect.tabla('equipos',e=>{

  equipos.select()
  .then( data=>
  {
    for(equipo of data){
      equipo.fecha=DateTime.fromFormat(equipo.fecha,'d/L/y').toFormat('dd/LL/yyyy')
      equipo.update()
    }
      //connect.end()
  }).catch(e=>
  {
      console.log(e,'érror')
      //  connect.end()
  
  })

},true);

