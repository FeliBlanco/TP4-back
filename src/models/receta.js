const mongoose = require('mongoose')


const RecetaSchema = new mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'Usuario'
    },
    productos: [
        {
            type: mongoose.Types.ObjectId,
            ref: 'ProductoUser'
        }
    ]
},{
    timestamps: true
})

const RecetaModel = mongoose.model('Receta', RecetaSchema);

module.exports = RecetaModel;