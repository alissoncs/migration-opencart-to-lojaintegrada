const connection = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    // prefix: 'galu_',
};


console.info(connection);

var knex = require('knex')({
    client: 'mysql2',
    connection, 
    useNullAsDefault: true,
});

knex.check = () => {
    return knex.raw('SELECT * FROM galu_oc_product LIMIT 1');
};

module.exports = knex;