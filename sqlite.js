const sqlite=require("sqlite3-tab")
const path = require('path')
const model1 = require('./model/usuarios.js')
const model = require("tabla-model")
const connect = new sqlite("./wifi.db")

connect.pathModels(path.dirname(__filename)+'/model/')
/*console.log(connect);
for (const model in connect.__models) {
  console.log(model1.sql({escapeChar:null, reserveIdentifiers:null, ar_aliased_tables:null, dbprefix:null, escapeString:null}));
}*/

let usuarios=connect.tabla('usuarios',e=>{
 
  //console.log(usuarios)
  usuarios.selectOne(`user=1`)
      .then(data=>
      {
       console.log(data)
          //connect.end()
      }).catch(e=>
      {
          console.log(e,'érror')
          //  connect.end()

      })

},true);
