'use strict'

// ref: https://devhints.io/knex
// TODO: implement more dynamic env var settings loader
module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      database: 'knex-db',
      user:     'postgres',
      password: 'root'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }
}