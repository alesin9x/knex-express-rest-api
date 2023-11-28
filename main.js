const express = require('express')
const bodyParser = require('body-parser')
const knex = require('./database/knex')


const app = express()
const port = 4000
app.use(bodyParser.json())

app.get('/', async (req , res) => {
    const data = await knex('students')
    res.status(200).json({data})
})

app.post('/lessons', (req, res) => {
    res.status(201).json({ids: []})
})

app.listen(port, () => {
    console.log('server starting at http://localhost:' + port)
})