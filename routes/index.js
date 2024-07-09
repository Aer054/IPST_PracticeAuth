const Router = require('express')
const router = new Router()
const authRouter= require('./authRouter')

router.use('/user',authRouter)
module.exports=router