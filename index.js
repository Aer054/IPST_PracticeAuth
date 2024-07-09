const express = require("express");
require('dotenv').config()
const PORT =process.env.PORT || 5000
const Sequelize=require('./db');
const router = require("./routes/index");
const app = express();
const errorHandler =require('./middleware/ErrorHandlerMiddleware')
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Authentication API',
        version: '1.0.0',
        description: 'APIs to authenticate users',
      },
      servers: [
        {
          url: `http://${process.env.DB_HOST}:${process.env.PORT}`,
          description: 'Development server',
        },
      ],
    },
    apis: ['./routes/index.js', './routes/authRouter.js'], 
  };

const swaggerSpec = swaggerJsdoc(swaggerOptions);
  
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(express.json());
app.use('/api',router)


app.use(errorHandler)

const start = async()=>{
    try{
        await Sequelize.authenticate()
        await Sequelize.sync({ force: true })
        await Sequelize.query(`ALTER TABLE "UserTable" SET (autovacuum_enabled=true);`);
        app.listen(PORT,()=>console.log(`Server started on port ${PORT}`));
    }catch(e){
        console.log(e)
    }
}
start()