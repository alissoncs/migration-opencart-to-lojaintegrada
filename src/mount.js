const assert = require('assert');
const urljoin = require('url-join');
const columns = require('./columns');

const BASE_IMAGE_URL = 'https://galuconceito.com.br/image/';

module.exports = ({
    products,
    variations,
    images,
    categories,
}) => {

    const lines = [];
    // console.log(variations);
    products.map(p => {
        // existe variação?
        const sku = `GALU${p.product_id}`; 
        const vars = variations.filter(v => v.product_id === p.product_id && v.option_value !== 'Tamanho único');
        const hasvars = vars && vars.length;
        const pimgs = images
            .filter(v => v.product_id === p.product_id)
            .map(c => c.image);

        const payload = hasvars ? {
            tipo: 'com-variacao',
            sku: sku,
            usado: 'N',
            nome: p.name.trim(),
            descricao: p.description,
            ativo: String(p.status) === '1' ? 'S': 'N',
            'preco-sob-consulta': 'N',
            'categoria-nome-nivel-1': p.category_name,
            'marca': '',
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
            descricao: p.description,
            ativo: String(p.status) === '1' ? 'S': 'N',
            'preco-sob-consulta': 'N',
            'categoria-nome-nivel-1': p.category_name,
            'marca': '',
            'peso-em-kg': 1,

            'preco-cheio': p.price,
            'preco-promocional': p.price_promo || '',
            'preco-sob-consulta': 'N',

            'estoque-gerenciado': 'S',
            'estoque-situacao-em-estoque': '', //'imediata',
            'estoque-quantidade': p.quantity,
            'altura-em-cm': '2',
            'largura-em-cm': '2',
            'comprimento-em-cm': '2',
            
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
                    'preco-promocional': p.price_promo || '',
                    'preco-sob-consulta': 'N',

                    'estoque-gerenciado': 'S',
                    'estoque-situacao-em-estoque': '', //'imediata',
                    'estoque-quantidade': v.quantity,
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