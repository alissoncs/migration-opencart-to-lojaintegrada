require('dotenv').config();
global.chalk = require('chalk');
const argv = require('yargs').argv;
const assert = require('assert');

const startDb = require('./src/startDb');
const startXlsx = require('./src/startXlsx');

if (argv.xlsx) {
    assert.ok(argv.file, 'File not specified');
    assert.ok(argv.catfile, 'Category file not specified');
    
    startXlsx({
        file: argv.file,
        catfile: argv.catfile,
    })
        .then(() => {
            console.info(chalk.green('Finished'));
        })
        .catch((err) => {
            console.info(chalk.red('Error: ' + err.message));
            console.log(err);
        });
} else {
    startDb()
        .then(() => {
            console.info(chalk.green('Finished'));
        })
        .catch((err) => {
            console.info(chalk.red('Error: ' + err.message));
            console.log(err);
        });
}

