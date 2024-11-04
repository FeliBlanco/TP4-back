const { Router } = require('express');
const ProductoModel = require('../models/producto');
const multer = require('multer');

const router = Router();


const storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, `${process.cwd()}/imagenes/productos`)
    },
    filename: function(req, file, cb) {
        const ext = file.originalname.split('.');
      cb(null, `${file.fieldname}${Date.now()}.${ext[ext.length - 1]}`)
    }
  })

  
  const imageUpload = multer({storage: storage})


router.get('/search', async (req, res) => {
    try {
        const query = req.query.query;
        
        let queryMongo = {};
        if(query) {
            queryMongo = queryMongo = { nombre: { $regex: query, $options: "i" } }
        } else {
            queryMongo = {};
        }
        
        result = await ProductoModel.find(queryMongo).limit(20);
        result = result.map(value => ({...value.toObject(), imagen: `${process.env.URL_IMAGEN}/productos/${value.imagen}`}));

        res.send(result)
    }
    catch(err) {
        console.log(err)
        res.status(503).send()
    }
})

router.get('/', async (req, res) => {
    try {
        const result = await ProductoModel.find()
        res.send(result)
    }
    catch(err) {
        console.log(err)
        res.status(503).send()
    }
})

router.post('/',imageUpload.single("imagen"), async (req, res) => {
    try {
        const {
            nombre,
            tipo
        } = req.body;
        const file = req.file;

        if(!nombre) return res.status(400).send({err_msg: 'nombre is required.'});

        const encontroIgual = await ProductoModel.findOne({nombre})
        if(encontroIgual) return res.status(503).send({err_msg: 'Ya existe un producto con ese nombre.'})

        const nuevoProducto = new ProductoModel({
            nombre,
            imagen: file.filename,
            tipo
        })
        nuevoProducto.save();
        res.send(nuevoProducto)
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