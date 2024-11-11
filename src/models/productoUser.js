const mongoose = require('mongoose')


const ProductoUserSchema = new mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref:'Usuario'
    },
    producto: {
        type: mongoose.Types.ObjectId,
        ref:'Producto'
    },
    cantidad: {
        type: Number
    },
    vencimiento: {
        type: String
    }
},{
    timestamps: true
})

const ProductoUserModel = mongoose.model('ProductoUser', ProductoUserSchema);

module.exports = ProductoUserModel;