/**
* tabla sessiones
* Fri Jan 25 2019 16:43:06 GMT-0400 (GMT-04:00)
*/
const tablaModel = require("tabla-model")
const sessiones=new tablaModel("sessiones",{
    colums:[
        {
            name:"id_session",
            type:"varchar(50)",
            primary:true,
            defaultNull:false,
        },
        {
            name:"fecha",
            type:"datetime",
            defaultNull:false,
        },
        {
            name:"id_usuarios",
            type:"int(11)",
            defaultNull:false,
        }
    ],
    foreingKey:[
        {
            key:"id_usuarios",
            reference:"usuarios",
            keyReference:"id_usuarios",
        }
    ]
})
module.exports = sessiones