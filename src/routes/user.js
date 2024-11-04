const { Router } = require('express');
const UserModel = require('../models/user');
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const OpenAI = require('openai')

const router = Router();

const secretKey = "raulihno"



const AIClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

const verifyToken = async (req, res, next) => {
    const header = req.header("Authorization") || "";
    const token = header.split(" ")[1];
    if(!token) return res.status(401).json({ message: "Token invalido" });
    try {
        console.log(token)
        const decodeToken = jwt.verify(token, secretKey);

        let userData = await UserModel
        .findOne({ _id: decodeToken.userid })
        .populate({
            path: "productos.producto",
            model: "Producto",
        });

        userData.productos = await Promise.all(userData.productos.map(value =>  ({...value, producto:{...value.producto, imagen: `${process.env.URL_IMAGEN}/productos/${value.producto.imagen}`}})))
        console.log(userData.productos)

        if(!userData) return res.status(401).json({ message: "Token invalido" });
        req.user = userData;
        next();
    } catch (error) {
        console.log(error)
        return res.status(403).json({ message: "Token not valid" });
    }
}

const generarTokenJWT = (userid) => {
    const token = jwt.sign({ userid }, secretKey);
    return token;
}

router.get('/recetas', async (req, res) => {
    try {

        const productos = [];
        const completion = await AIClient.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {"role": "user", "content": `
                    Tengo los siguientes productos en mi heladera: pechuga de pollo, dulce de leche, pure de tomate, manteca.

Genera un máximo de 12 recetas de postres y 12 recetas de comidas en formato JSON. Cada receta debe estar en el formato:

{
  "nombre": "Nombre de la receta",
  "tipo": "postre" o "comida",
  "ingredientes": ["lista de ingredientes"],
  "instrucciones": "Instrucciones de preparación"
}

Instrucciones adicionales:
- Si el parámetro "ingredientes_estrictos" es verdadero, solo utiliza los productos de la lista para las recetas. 
- Si "ingredientes_estrictos" es falso, permite que las recetas incluyan ingredientes adicionales, además de los productos que te proporcioné.
ingredientes_estrictos: false
  
Devuelve la respuesta en formato JSON.
                    `}
            ]
        });
        res.send(completion.choices[0].message)
    }
    catch(err) {
        console.log(err)
        res.status(503).send()
    }
})

router.get('/user_data', verifyToken, (req, res) => {
    try {
        res.send(req.user)
    }
    catch(err) {
        console.log(err)
        res.status(503).send()
    }
})

router.post('/agregar_producto', verifyToken, async (req, res) => {
    try {
        const {
            cantidad,
            vencimiento,
            id
        } = req.body;

        const result = await UserModel.updateOne({_id: req.user._id}, {$push: {productos: {producto: id, cantidad, vencimiento}}})
        res.send(result)
    }
    catch(err) {
        console.log(err)
        res.status(503).send()
    }
})

router.post('/login', async (req, res) => {
    try {

        const {
            correo,
            contra
        } = req.body;

        if(!correo || !contra) return res.status(503).send();


        const result = await UserModel.findOne({correo});
        if(!result) return res.status(500).send({err_msg: 'No se encontró ninguna cuenta con ese correo.', code: 'CORREO_NOT_FOUND'})

        if(await bcrypt.compare(contra, result.contra)) {
            const token = generarTokenJWT(result._id)
            res.send({token})
        } else {
            res.status(403).send({err_msg: 'Contraseña incorrecta', code:'INCORRECT_PASSWORD'})
        }
    }
    catch(err) {
        console.log(err)
        res.status(503).send()
    }
})

router.post('/', async (req, res) => {
    try {

        const {
            correo,
            contra,
            nombre
        } = req.body;

        if(!correo || !contra || !nombre) return res.status(503).send();

        const passEncode = await bcrypt.hash(contra, 15)

        const result = new UserModel({
            correo,
            contra: passEncode,
            nombre,
            productos: []
        });

        await result.save();

        const token = generarTokenJWT(result._id)
        res.send({token})
    }
    catch(err) {
        console.log(err)
        res.status(503).send()
    }
})

router.delete('/', (req, res) => {
    try {

        res.send("hola")
    }
    catch(err) {
        console.log(err)
        res.status(503).send()
    }
})

router.put('/', (req, res) => {
    try {

        res.send("hola")
    }
    catch(err) {
        console.log(err)
        res.status(503).send()
    }
})


module.exports = router