/**
* tabla notificaciones
* Fri Jan 25 2019 16:43:06 GMT-0400 (GMT-04:00)
*/
const tablaModel = require("tabla-model")
const suscripciones=new tablaModel("suscripciones",{
    colums:[
        {
            name:"id",
            type:"varchar(50)",
            primary:true,
            defaultNull:false
        },
        {
            name:"expired",
            type:"varchar(20)",
            defaultNull:true,
        },
        {
            name:"json",
            type:"varchar(400)",
            defaultNull:false,
        }
    ]
})
module.exports = suscripciones