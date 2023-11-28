const express = require('express')
const app = express()
const port = 4000

app.get('/', (req , res) => {
    res.status(200).json({data: []})
})

app.post('/lessons', (req, res) => {
    res.status(201).json({ids: []})
})

app.listen(port, () => {
    console.log('server starting at http://localhost:' + port)
})