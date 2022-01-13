const bcrypt = require('bcrypt-nodejs')

function auth(req)
{
    return new Promise((res,rej)=>
    {
        let usuarios=req.sqlite.tabla('usuarios')
      // console.log(req.session)
        usuarios.selectOne(`user='${req.session.user.user}' and hash='${req.session.user.hash}'`)
            .then(user=>
            {
               
                res(user)
            }).catch(e=>{
               
                rej(e)
            })
    })
}
function milware(req, res, next)
{
    //console.log(req.method)
    if(req.method=='OPTIONS')
        next()
    auth(req).then(d=>
    {
        return next()
    }).catch(e=>
    {
        return res.sendStatus(401)
    })
}
milware.auth=auth
module.exports=milware