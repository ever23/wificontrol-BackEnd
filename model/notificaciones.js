/**
* tabla notificaciones
* Fri Jan 25 2019 16:43:06 GMT-0400 (GMT-04:00)
*/
const tablaModel = require("tabla-model")
const notificaciones=new tablaModel("notificaciones",{
    colums:[
        {
            name:"id_notificacion",
            type:"int(11)",
            primary:true,
            defaultNull:false,
            autoincrement:true,
        },
        {
            name:"desc_notificacion",
            type:"varchar(250)",
            defaultNull:false,
        },
        {
            name:"href_notificacion",
            type:"varchar(250)",
            defaultNull:false,
        },
        {
            name:"icon_notification",
            type:"varchar(45)",
            defaultNull:false,
        },
        {
            name:"fech_notificacion",
            type:"DATETIME",
            defaultNull:false,
        },
        {
            name:"visto",
            type:"BOOLEAN",
            defaultNull:false,
        }
    ]
})
module.exports = notificaciones