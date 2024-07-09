const express = require("express");
require('dotenv').config()
const PORT =process.env.PORT || 5000
const Sequelize=require('./db');
const router = require("./routes");
const app = express();
const errorHandler =require('./middleware/ErrorHandlerMiddleware')


app.use(express.json());
app.use('/api',router)


app.use(errorHandler)

const start = async()=>{
    try{
        await Sequelize.authenticate()
        await Sequelize.sync()
        app.listen(PORT,()=>console.log(`Server started on port ${PORT}`));
    }catch(e){
        console.log(e)
    }
}
start()