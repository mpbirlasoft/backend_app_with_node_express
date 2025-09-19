// Update with your config settings.
import knex from 'knex';
import dotenv from 'dotenv';
dotenv.config();
export const db = knex({
    client: process.env.CLIENT,
    connection: {
      database: process.env.DB_NAME,
      user:     process.env.USER_NAME,
      password: process.env.PASSWORD,
      host: process.env.HOST,
      port: process.env.PORT
    },
  });