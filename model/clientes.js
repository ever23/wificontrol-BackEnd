/**
* tabla sessiones
* Fri Jan 25 2019 16:43:06 GMT-0400 (GMT-04:00)
*/
const tablaModel = require("tabla-model")
const clientes=new tablaModel("clientes",{
    colums:[
        {
            name:"id_cliente",
            type:"int(11)",
            primary:true,
            defaultNull:false,
            autoincrement:true,
        },
        {
            name:"nombre",
            type:"varchar(45)",
            defaultNull:false,
        }
    ]
})
module.exports = clientes