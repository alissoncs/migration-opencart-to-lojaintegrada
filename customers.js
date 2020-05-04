
const fs = require('fs');
const axios =  require('axios');
const assert = require('assert');
const argv = require('yargs').argv;
const Promise = require('bluebird');
const cpf = require("@fnando/cpf/commonjs");
const xlsx = require('node-xlsx');

const file = argv.file;
const install = argv.install;

function maskCpf(valor) {
    return valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g,"\$1.\$2.\$3\-\$4");
}

assert.ok(file, `File required`);
assert.ok(fs.existsSync(file), `File ${file} not found`);

const worksheets = xlsx.parse(file);

let addresses = worksheets[1].data;
let customers = worksheets[0].data;

assert.equal(typeof addresses, 'object', 'Addresses required');
assert.equal(typeof customers, 'object', 'customers required');

customers = customers.map((c) => {
    const columns = [
        'customer_id',
        'customer_group',
        'store_id',
        'firstname',
        'lastname',
        'email',
        'telephone',
        'fax',
        'password',
        'salt',
        'cart',
        'wishlist',
        'newsletter',
        'custom_field',
        'ip',
        'status',
        'approved',
        'safe',
        'token',
        'code',
        'date_added',
    ];
    let obj = {};
    columns.map((col, ind) => {
        obj[col] = c[ind];
    })
    return obj;
}).filter((c, ind) => ind > 0)


addresses = addresses.map((c) => {
    const columns = [
        'customer_id',
        'firstname',
        'lastname',
        'company',
        'address_1',
        'address_2',
        'city',
        'postcode',
        'zone',
        'country',
        'custom_field',
        'is_default',
    ];
    let obj = {};
    columns.map((col, ind) => {
        obj[col] = c[ind];
    })
    return obj;
    
}).filter((c, ind) => ind > 0)


console.info(`Ready to install ${customers.length} customers with ${addresses.length} addresses`);

console.info('>>>>INSTALL READY<<<<<');

const requests = customers.map(c => {
    let custom;
    try {
        custom = JSON.parse(c.custom_field);
    } catch(err) {
        console.error('falha', c.custom_field);
        throw err;
    }
    let userCpf = custom && custom['2'];
    
    if (userCpf && userCpf.length !== '030.060.520-05'.length) {
        userCpf = maskCpf(userCpf);
    }
    
    if (!cpf.isValid(userCpf)) userCpf = null;

    return {
        email: c.email,
        nome: `${c.firstname} ${c.lastname}`,
        telefone_principal: c.telephone,
        telefone_celular: c.telephone,
        // group_id: 1,
        group_id: 1,
        tipo: 'PF',
        cpf: userCpf,
        rg: null,
        enderecos: addresses
            .filter(a => String(a.customer_id) == String(c.customer_id) && a.is_default === 'yes')
            .map((a) => {
                let acustom;
                try {
                    acustom = JSON.parse(a.custom_field);
                } catch(err) {
                    console.error('falha', a.custom_field);
                    throw err;
                }
                let compl = acustom['2'];
                if (acustom['1'] && acustom['1'].length >= 10) {
                    compl = `${acustom['1']} / ${compl}`;
                }
                return {
                    endereco: a.address_1.trim(),
                    numero: acustom['1'],
                    complemento: compl,
                    bairro: a.address_2,
                    cidade: a.city,
                    estado: {               
                        'Acre': 'AC',
                        'Alagoas': 'AL',
                        'Amapá': 'AP',
                        'Amazonas': 'AM',
                        'Bahia': 'BA',
                        'Ceará': 'CE',
                        'Distrito Federal': 'DF',
                        'Espírito Santo': 'ES',
                        'Goiás': 'GO',
                        'Maranhão': 'MA',
                        'Mato Grosso': 'MT',
                        'Mato Grosso do Sul': 'MS',
                        'Minas Gerais': 'MG',
                        'Pará': 'PA',
                        'Paraíba': 'PB',
                        'Paraná': 'PR',
                        'Pernambuco': 'PE',
                        'Piauí': 'PI',
                        'Rio de Janeiro': 'RJ',
                        'Rio Grande do Norte': 'RN',
                        'Rio Grande do Sul': 'RS',
                        'Rondônia': 'RO',
                        'Roraima': 'RR',
                        'Santa Catarina': 'SC',
                        'São Paulo': 'SP',
                        'Sergipe': 'SE',
                        'Tocantins': 'TO',
                        'Bangkok': 'BC',
                    }[a.zone] || a.zone,
                    cep: a.postcode,
                    pais: {
                        'Brasil': 'BRA',
                        'Thailand': 'THA',
                    }[a.country],
                    nome: 'Principal',
                };
            }),
    };
});

const hasWithoutAddress = requests.find(c => !c.enderecos || c.enderecos.length === 0);
assert.ok(!hasWithoutAddress, 'Registro sem endereço' + JSON.stringify(hasWithoutAddress));

let errorRow;
const requiredFields = ['nome', 'telefone_celular'];
requiredFields.forEach(field => {
    errorRow = requests.find(c => !c[field]);
    assert.ok(!errorRow, `Registro sem ${field}: ${JSON.stringify(errorRow)}`);
    errorRow = null;
});

const hasWithWrongEstado = requests.find(c => !c.enderecos[0].estado || c.enderecos[0].estado.length !== 2);
assert.ok(!hasWithWrongEstado, 'Registro com estado errado' + JSON.stringify(hasWithWrongEstado));

// const hasWrongNumero = requests.find(c => !c.enderecos[0].numero || c.enderecos[0].numero.length > 10 || c.enderecos[0].numero.length < 1);
// assert.ok(!hasWrongNumero, 'Registro com numero errado' + JSON.stringify(hasWrongNumero));

const hasWrongCpf = requests.find(c => c.cpf && !cpf.isValid(c.cpf));
assert.ok(!hasWrongCpf, 'Registro com cpf errado' + JSON.stringify(hasWrongCpf));


if (install) {
    Promise.each(requests, (req) => {
        return axios.post('https://api.awsli.com.br/v1/cliente', req, {
            params: {
                format: 'json',
                chave_api: '4ef3d5e7c0494dd6be62',
                chave_aplicacao: '0cca87d1-f0cf-4149-b55b-ec877fd67908',
            }
        }).then(() => {
            console.info('Cliente OK', req.nome, '\n');
        }).catch((err) => {
            console.info('Falhe no cliente', JSON.stringify(err.response.data), JSON.stringify(req), '\n');
        });
    }).then(() => {
        console.info('finished');
    }).catch((err) => {
        console.error(err);
    });
} 