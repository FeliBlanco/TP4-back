const express = require('express')
const cors = require('cors');
const connectDB = require('./db');
const bodyParser = require('body-parser')
const path = require('path')

const app = express();


app.use(cors({origin:'*'}))

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


connectDB()

app.use('/usuario', require('./routes/user.js'))
app.use('/producto', require('./routes/producto.js'))

app.use("/imagenes/", express.static(path.join(process.cwd(), "imagenes")));


module.exports = app;