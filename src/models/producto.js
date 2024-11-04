const mongoose = require('mongoose')


const ProductoSchema = new mongoose.Schema({
    nombre: {
        required: true,
        type: String
    },
    imagen: {
        required: true,
        type: String
    },
    tipo: {
        type: String,
        required: true
    }
},{
    timestamps: true
})

const ProductoModel = mongoose.model('Producto', ProductoSchema);

module.exports = ProductoModel;