require('dotenv').config();
global.chalk = require('chalk');
const start = require('./src/start');

start()
    .then(() => {
        console.info(chalk.green('Finished'));
    })
    .catch((err) => {
        console.info(chalk.red('Error: ' + err.message));
    });