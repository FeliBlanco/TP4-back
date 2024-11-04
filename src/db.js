const { default: mongoose } = require("mongoose");

async function connectDB() {
    try {
        await mongoose.connect(process.env.DB_URI);
        console.log("BASE DE DATOS CONECTADA!")
    }
    catch(err) {
        console.log("ERROR CONEXION BASE DE DATOS")
        console.log(err);
    }
}

module.exports = connectDB;