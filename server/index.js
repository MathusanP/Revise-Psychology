const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')

//Setting up Express
const app = express();
const port = 3000;

app.use(cors())
app.use(bodyParser.json());

// Define route handler for POST requests to '/userData'
app.post('/userData', (req, res) => {
    const userData = req.body;
    console.log(userData);
    res.json({ message: 'Input received by server' });
});

// To ensure express server is running.
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
