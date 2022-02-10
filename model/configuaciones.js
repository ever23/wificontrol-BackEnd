/**
* tabla notificaciones
* Fri Jan 25 2019 16:43:06 GMT-0400 (GMT-04:00)
*/
const tablaModel = require("tabla-model")
const configuraciones=new tablaModel("configuraciones",{
    colums:[
        {
            name:"id",
            type:"int(11)",
            primary:true,
            defaultNull:false 
        },
        {
            name:"url_router",
            type:"varchar(250)", 
            defaultNull:false,
        },
        {
            name:"pass_router",
            type:"varchar(250)",
            defaultNull:false,
        },
        {
            name:"costo_hora",
            type:"varchar(45)",
            defaultNull:false,
        },
        {
            name:"modo_oscuro",
            type:"BOOLEAN",
            defaultNull:false,
        }
    ]
})
configuraciones.insert(1,"http://192.168.1.1/","admin1","3",false)
module.exports = configuraciones