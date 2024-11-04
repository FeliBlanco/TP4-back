require('dotenv').config()
const app = require('./src/App.js');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`PORT: ${PORT}`))