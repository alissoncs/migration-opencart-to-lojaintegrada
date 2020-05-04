// const assert = require('assert');
const urljoin = require('url-join');
const assert = require('assert');
const columns = require('./columns');

module.exports = ({
    products,
    variations,
    images,
    APP_ID,
    BASE_IMAGE_URL,
}) => {
    assert.ok(products, 'products array required');
    assert.ok(variations, 'variations array required');
    assert.ok(images, `images array required: ${typeof images}`);
    assert.ok(typeof APP_ID === 'string', 'APP_ID required');
    assert.ok(typeof BASE_IMAGE_URL === 'string', 'BASE_IMAGE_URL required');


    console.info('BASE_IMAGE_URL', 'BASE_IMAGE_URL', BASE_IMAGE_URL);

    const lines = [];
    products.map(p => {
        // existe variação?
        const sku = `${APP_ID.toUpperCase()}-${p.product_id}`; 
        const vars = variations.filter(v => v.product_id === p.product_id && v.option_value !== 'Tamanho único');
        const hasvars = vars && vars.length;
        const pimgs = images
            .filter(v => v.product_id === p.product_id)
            .map(c => c.image);

        const isDestaque = false //destaques.map(e => e.toUpperCase()).includes(p.name.trim().toUpperCase());

        const payload = hasvars ? {
            tipo: 'com-variacao',
            sku: sku,
            usado: 'N',
            nome: p.name.trim(),
            'descricao-completa': p.description,
            'destaque': isDestaque ? 'S' : 'N',
            ativo: String(p.status) === '1' ? 'S': 'N',
            'preco-sob-consulta': 'N',
            'categoria-nome-nivel-1': p.category_name,
            'categoria-nome-nivel-2': p.category_name2,
            'categoria-nome-nivel-3': p.category_name3,
            'categoria-nome-nivel-4': p.category_name4,
            'categoria-nome-nivel-5': p.category_name5,
            'marca': p.marca || '',
            'peso-em-kg': 1,
            
            'imagem-1': urljoin(BASE_IMAGE_URL, p.image),
            'imagem-2': pimgs[0] && urljoin(BASE_IMAGE_URL, pimgs[0]),
            'imagem-3': pimgs[1] && urljoin(BASE_IMAGE_URL, pimgs[1]),
            'imagem-4': pimgs[2] && urljoin(BASE_IMAGE_URL, pimgs[2]),
        } : {
            tipo: 'sem-variacao',
            sku: sku,
            usado: 'N',
            nome: p.name.trim(),
            'descricao-completa': p.description,
            'destaque': isDestaque ? 'S' : 'N',
            ativo: String(p.status) === '1' ? 'S': 'N',
            'preco-sob-consulta': 'N',
            'categoria-nome-nivel-1': p.category_name,
            'categoria-nome-nivel-2': p.category_name2,
            'categoria-nome-nivel-3': p.category_name3,
            'categoria-nome-nivel-4': p.category_name4,
            'categoria-nome-nivel-5': p.category_name5,
            'marca': p.marca || '',
            'peso-em-kg': p.peso || 1,

            'preco-cheio': p.price,
            'preco-promocional': p.price_promo || '',
            'preco-sob-consulta': 'N',

            'estoque-gerenciado': 'S',
            'estoque-situacao-em-estoque': 'imediata', //'imediata',
            'estoque-situacao-sem-estoque': 'indisponivel',
            'estoque-quantidade': p.quantidade,
            'altura-em-cm': p.altura || '2',
            'largura-em-cm': p.largura || '2',
            'comprimento-em-cm': p.comprimento || '2',
            
            'imagem-1': urljoin(BASE_IMAGE_URL, p.image),
            'imagem-2': pimgs[0] && urljoin(BASE_IMAGE_URL, pimgs[0]),
            'imagem-3': pimgs[1] && urljoin(BASE_IMAGE_URL, pimgs[1]),
            'imagem-4': pimgs[2] && urljoin(BASE_IMAGE_URL, pimgs[2]),
        };
        
        lines.push(payload);
        
        if (hasvars) {
            vars.map((v) => {
                const iscalca = -1 === ['P', 'M', 'G'].indexOf(v.option_value.toUpperCase().trim());
                lines.push({
                    tipo: 'variacao',
                    sku: `${sku}-${v.option_value.toUpperCase()}`,
                    'sku-pai': sku,
                    ativo: String(p.status) === '1' ? 'S': 'N',
                    'preco-cheio': p.price,
                    'destaque': isDestaque ? 'S' : 'N',
                    'preco-promocional': p.price_promo || '',
                    'preco-sob-consulta': 'N',

                    'estoque-gerenciado': 'S',
                    'estoque-situacao-em-estoque': 'imediata', //'imediata',
                    'estoque-situacao-sem-estoque': 'indisponivel',

                    'estoque-quantidade': v.quantidade,
                    'altura-em-cm': '2',
                    'largura-em-cm': '2',
                    'comprimento-em-cm': '2',
                    // 'grade-tamanho-de-tenis': 
                    'grade-tamanho-de-camisacamiseta': !iscalca ? v.option_value : null,
                    'grade-tamanho-de-calca': iscalca ? v.option_value : null,
                });
            });
            // console.log(vars);
        }
    });

    const psed = [];
    lines.map((line) => {
        psed.push(columns.map((column) => {
            return line[column] || '';
        }));
    });

    const data = [columns, ...psed];
    // console.log(data.slice(0, 100004));
    return data;
};