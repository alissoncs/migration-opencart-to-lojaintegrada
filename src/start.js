const xlsx = require('node-xlsx');
const fs = require('fs');
const knex = require('./db');
const mount = require('./mount');

const start = async () => {

    const query = await knex.check();
    const products = await knex
    .distinct('p.product_id')
    .select([
        'p.product_id',
        'd.name',
        'p.quantity',
        'd.description',
        'p.price',
        'ps.price as price_promo',
        'p.image',
        // 'ptc.category_id',
        'p.status',
        // 'cd.name as category_name',
    ])
    .select(knex.raw(`(SELECT 
        galu_oc_category_description.name
        FROM galu_oc_product_to_category
        JOIN  galu_oc_category_description on galu_oc_category_description.category_id = galu_oc_product_to_category.category_id
        WHERE galu_oc_product_to_category.product_id = p.product_id LIMIT 1) as category_name`))
    .from('galu_oc_product as p')
    .join('galu_oc_product_description as d', 'd.product_id', 'p.product_id')
    // .joinRaw
    .join('galu_oc_product_to_category as ptc', 'ptc.product_id', 'p.product_id')
    // .join('galu_oc_category as c', 'c.category_id', 'ptc.category_id')
    // .join('galu_oc_category_description as cd', 'c.category_id', 'cd.category_id')
    .leftJoin('galu_oc_product_special as ps', 'p.product_id', 'ps.product_id')
    // .groupBy('p.product_id')
    // .where('p.status', '1')
    // .orderBy('ptc.category_id', 'ASC')
    // .orderBy('p.product_id', 'ASC');
    
    const variations = await knex.select([
        'p.product_id',
        'pd.name',
        'ov.name as option_value',
        'pov.quantity',
        // 'option.name',
        // 'product_option_value.quantity',
        // 'option_value_description.name',
    ])
    .from('galu_oc_product_option_value as pov')
    .join('galu_oc_product as p', 'pov.product_id', 'p.product_id')
    .join('galu_oc_product_description as pd', 'pd.product_id', 'p.product_id')
    .join('galu_oc_option_value_description as ov', 'ov.option_value_id', 'pov.option_value_id')
    .orderBy('p.product_id', 'ASC')
    .limit(100000);

    const cats =  await knex
    .distinct(['c.category_id'])
    .select([
        'c.name',
        'c.description',
    ])
    .from('galu_oc_category_description as c')
    .limit(100000);

    const images =  await knex
    .select([
        'i.product_id',
        'i.image',
    ])
    .from('galu_oc_product_image as i')
    .limit(100000);

    // console.info('query', products);
    console.info('products', products.length);
    console.info('variations', variations.length);
    console.info('categories', cats.length);
    
    const xlsxdata = mount({
        cats,
        products,
        variations,
        images,
    });

    const buffer = xlsx.build([{name: 'export-galu-data', data: xlsxdata }]); // Returns a buffer    
    fs.writeFile('example.xlsx', buffer, 'ascii', () => {});

    return Promise.resolve();
};

module.exports = start;