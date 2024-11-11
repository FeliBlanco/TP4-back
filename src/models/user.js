const mongoose = require('mongoose')


const UserSchema = new mongoose.Schema({
    nombre: {
        required: true,
        type: String
    },
    correo: {
        required: true,
        type: String
    },
    contra: {
        required: true,
        type: String
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

const UserModel = mongoose.model('Usuario', UserSchema);

module.exports = UserModel;