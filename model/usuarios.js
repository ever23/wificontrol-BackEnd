/**
* tabla usuarios
* Fri Jan 25 2019 16:43:06 GMT-0400 (GMT-04:00)
*/
const tablaModel = require("tabla-model")
const usuarios=new tablaModel("usuarios",{
    colums:[
        {
            name:"id_usuarios",
            type:"int(11)",
            primary:true,
            defaultNull:false,
            autoincrement:true,
        },
        {
            name:"user",
            type:"varchar(45)",
            defaultNull:false,
        },
        {
            name:"hash",
            type:"varchar(255)",
            defaultNull:false,
        },
        {
            name:"nombre",
            type:"varchar(100)",
            defaultNull:false,
        },
        {
            name:"root",
            type:"BOOLEAN",
            defaultNull:false,
        }
    ],
})
usuarios.insert({
    "id_usuarios":1,
    "user":"root",
    "hash":"$2a$10$0WGqq2ELRjQ8Ib9dj3MAneRNrr8iP5JhIQWLmZ1jnLkHY4NNn.H9e",
    "nombre":"ever",
    "root":true
})
module.exports = usuarios
