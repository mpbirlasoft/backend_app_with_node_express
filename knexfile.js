// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
export const development = {
  client: 'postgresql',
  connection: {
    database: 'nodepractice',
    user: 'postgres',
    password: 'postgres',
    host: 'localhost',
    port: 5433
  },
};