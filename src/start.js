const knex = require('./db');

const start = async () => {

    const query = await knex.check();
    const products = await knex
    .distinct('p.product_id')
    .select([
        'p.product_id',
        'd.name',
        // 'd.description',
        'p.price',
        'p.image',
        'ptc.category_id',
        'cd.name as category_name',
    ])
    .from('galu_oc_product as p')
    .join('galu_oc_product_description as d', 'd.product_id', 'p.product_id')
    // .joinRaw
    .join('galu_oc_product_to_category as ptc', 'ptc.product_id', 'p.product_id')
    .join('galu_oc_category as c', 'c.category_id', 'ptc.category_id')
    .join('galu_oc_category_description as cd', 'c.category_id', 'cd.category_id')
    // .groupBy('p.product_id')
    .orderBy('ptc.category_id', 'ASC')
    .orderBy('p.product_id', 'ASC')

    .limit(100000);
    
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

    // console.info('query', products);
    console.info('products', products);
    console.info('variations', variations);
    
    return Promise.resolve();
};

module.exports = start;