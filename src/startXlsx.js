const fs = require('fs');
const assert = require('assert');
const xlsx = require('node-xlsx');
const mount = require('./mount');
const BASE_IMAGE_URL = process.env.BASE_IMAGE_URL;
const productColumns = require('./xlsx/productColumns');
const categoryColumns = require('./xlsx/categoryColumns');

function compareValues(key, order = 'asc') {
    return function innerSort(a, b) {
      if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
        // property doesn't exist on either object
        return 0;
      }
  
      const varA = (typeof a[key] === 'string')
        ? a[key].toUpperCase() : a[key];
      const varB = (typeof b[key] === 'string')
        ? b[key].toUpperCase() : b[key];
  
      let comparison = 0;
      if (varA > varB) {
        comparison = 1;
      } else if (varA < varB) {
        comparison = -1;
      }
      return (
        (order === 'desc') ? (comparison * -1) : comparison
      );
    };
  }
  

const startXlsx = async ({
    file,
    catfile,
}) => {
    assert.ok(file, 'File not specified');
    assert.ok(catfile, 'Category file not specified');
    assert.ok(fs.existsSync(file), `File ${file} not found`);
    assert.ok(fs.existsSync(catfile), `Category ${catfile} not found`);

    const worksheets = xlsx.parse(file);
    const worksheetsCats = xlsx.parse(catfile);
    const sourceProducts = worksheets[0];
    assert.ok(sourceProducts && sourceProducts.name === 'Products', 'Invalid XLSX file');

    let products = sourceProducts.data;
    assert.ok(productColumns.length === products[0].length, 'Invalid XLSX file (headers not compatible)');

    assert.ok(worksheets[1], worksheets[1].name === 'AdditionalImages', 'AdditionalImages not found in xlsx');

    let otherImages = worksheets[1].data;

    // 
    assert.ok(worksheetsCats && worksheetsCats[0].name === 'Categories', 'Invalid category XLSX file');
    let categories = worksheetsCats[0].data.map((c) => {
        return {
            category_id: c[0],
            id: c[0],
            parent_id: c[1],
            name: c[2],
        };
    }).filter(c => c.category_id != 'category_id');
    
    products = products.map((p) => {
        let row = {};
        p.map((innerp, innerkey) => {
            row[productColumns[innerkey]] = innerp;
        });
        return row;
    });

    products = products.map((p, key) => {
        let catids = (p.categories || '').split(',').map(c => Number(c));
        catids = catids.map(id => categories.find(c => String(c.id) === String(id))).filter(c => c);
        catids = catids.sort(compareValues('parent_id', 'asc'));

        return {
            ...p,
            id: p.product_id,
            status: p.status === 'true' ? '1' : null,
            image: p.image_name,
            description: p.description,
            marca: p.manufacturer,
            peso: p.weight,
            largura: p.width,
            altura: p.height,
            comprimento: p.length,
            quantidade: p.quantity || '0',
            category_name: catids[0] ? catids[0].name: null,
            category_name2: catids[1] ? catids[1].name: null,
            related_ids: p.related_id ? p.related_id.split(',').map(c => Number(c)) : null,
            // categories: p.categories ? p.categories.split(',').map(c => Number(c)) : null,
        };
    }).filter(p => p.product_id !== 'product_id');

    const mainImages = products.filter(p => p.image_name).map(p => ({
        product_id: p.id || p.product_id,
        image: p.image_name,
        order: 0,
    }));

    otherImages = otherImages.map(row => ({
        product_id: row[0],
        image: row[1],
        order: row[2] ? row[2] + 1 : 5,
    }));

    const images = [...otherImages];

    const xlsxdata = mount({
        APP_ID: 'nossoarmz',
        variations: [],
        products,
        images,
        BASE_IMAGE_URL,
    });
    
    assert.equal(products.length, xlsxdata.length - 1, 'Invalid count output');

    const buffer = xlsx.build([{name: 'export-armazem-data', data: xlsxdata }]); // Returns a buffer    
    fs.writeFile('dist/output.xlsx', buffer, 'ascii', () => {});

    return Promise.resolve();

}


module.exports = startXlsx;