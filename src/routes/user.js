const { Router } = require('express');
const UserModel = require('../models/user');
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const OpenAI = require('openai');
const ProductoUserModel = require('../models/productoUser');
const RecetaModel = require('../models/receta');
const mongoose = require('mongoose')


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
        .findOne({ _id: decodeToken.userid });

        const productos = await ProductoUserModel.find({user: userData._id}).select("cantidad vencimiento producto").populate({path:'producto', select:'_id tipo nombre imagen'});
        const lpmm = productos.map(value => {
            const productoData = value.toObject();
            return {
                ...productoData,
                producto: {
                    ...productoData.producto,
                    imagen: `${process.env.URL_IMAGEN}/productos/${productoData.producto.imagen}`
                }
            };
        });
        userData = {...userData.toObject(), productos: lpmm}

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

router.post('/receta', verifyToken, async (req, res) => {
    try {
        const {
            productos
        } = req.body;

        if(!productos) return res.status(401).send({err: 'productos is required.'});

        const newReceta = new RecetaModel({
            user: req.user._id,
            productos
        })
        const result = await newReceta.save();

        res.send(result._id)
    }
    catch(err) {
        console.log(err);
        res.status(503).send();
    }
})

router.get('/receta/:id', async (req, res) => {
    try {
        const recetaid = req.params.id;
        const recetaInfo = await RecetaModel.findOne({_id: recetaid}).populate({path: 'productos', select:'cantidad vencimiento producto', populate:{path:'producto', select:'_id nombre imagen'}});
        console.log(recetaInfo)

        const productos = recetaInfo.productos.map(value => ({cantidad:value.cantidad, vencimiento: value.vencimiento, _id: value.producto._id, nombre:value.producto.nombre, imagen: `${process.env.URL_IMAGEN}/productos/${value.producto.imagen}`}))
        console.log(productos)
        const completion = await AIClient.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {"role": "user", "content": `
                    Tengo los siguientes productos en mi heladera: ${JSON.stringify(productos)}

Genera 12 recetas de postres (en caso de que se pueda hacer con los ingredientes disponibles) y 12 recetas de comidas (en caso de que se pueda hacer con los ingredientes disponibles) en formato JSON. Teniendo en cuenta las cantidades (en caso de que sea 0, la cantidad no está definida, cuenta como que hay stock) y la fecha de vencimiento. Cada receta debe estar en el formato:

{
  "nombre": "Nombre de la receta",
  "tipo": "postre" o "comida",
  "ingredientes": ["lista de ingredientes (con la misma informacion del JSON anterior, en caso de que sea un ingrediente que no esté en la lista, solo mostrar nombre) y "existe": (true o false si existe en la lista anterior)"],
  "instrucciones": "Instrucciones de preparación (Devolveme un array con los pasos a seguir)"
}

Instrucciones adicionales:
- Si el parámetro "ingredientes_estrictos" es verdadero, solo utiliza los productos de la lista para las recetas. 
- Si "ingredientes_estrictos" es falso, permite que las recetas incluyan ingredientes adicionales, además de los productos que te proporcioné, que si o si debe haber uno.
ingredientes_estrictos: false

Devuelveme solo el contenido JSON, sin texto ni nada, para usarlo directamente en JSON.parse
                    `}
            ]
        });
        console.log("termina")
        res.send(completion.choices[0].message.content)
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

router.post('/sacar_productos', verifyToken, async (req, res) => {
    try {
        const {
            ids
        } = req.body;

        ids.forEach(async id => {
            await ProductoUserModel.deleteOne({_id: id})
        })

        res.send()
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

        const newProductoUser = new ProductoUserModel({user: req.user._id, producto: id, cantidad, vencimiento});
        const result = await newProductoUser.save()

        UserModel.updateOne({_id: req.user._id}, {productos: {$push: result._id}})
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