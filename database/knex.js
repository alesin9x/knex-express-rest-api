const knexFile = require('../knexfile.js')
const knex = require('knex')(knexFile.development)
module.exports = knex