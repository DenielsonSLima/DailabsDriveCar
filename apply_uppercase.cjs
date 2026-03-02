const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'modules');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Pattern 1: setNome(e.target.value) -> setNome(e.target.value.toUpperCase())
    content = content.replace(/(set(?:Nome|Descricao|Cidade|Bairro|Endereco|Complemento|Uf|Documento|Email|Telefone|Celular|Placa|Chassi|Renavam|Sigla|Apelido|RazaoSocial|NomeFantasia|Marca|Modelo|Versao|Cor|Cambio|Motor)\(e\.target\.value)(?!\.toUpperCase\(\))(\))/g, '$1.toUpperCase()$2');

    // Pattern 2: onChange={e => setFormData(prev => ({ ...prev, [name]: value }))} -> value.toUpperCase() if value is a string
    // We can't safely do this with regex for generic `handleChange`, so we'll look for specific inline assignments
    content = content.replace(/(nome:\s*e\.target\.value)(?!\.toUpperCase\(\))/g, '$1.toUpperCase()');
    content = content.replace(/(descricao:\s*e\.target\.value)(?!\.toUpperCase\(\))/g, '$1.toUpperCase()');
    content = content.replace(/(cidade:\s*e\.target\.value)(?!\.toUpperCase\(\))/g, '$1.toUpperCase()');
    content = content.replace(/(bairro:\s*e\.target\.value)(?!\.toUpperCase\(\))/g, '$1.toUpperCase()');
    content = content.replace(/(endereco:\s*e\.target\.value)(?!\.toUpperCase\(\))/g, '$1.toUpperCase()');
    content = content.replace(/(complemento:\s*e\.target\.value)(?!\.toUpperCase\(\))/g, '$1.toUpperCase()');
    content = content.replace(/(uf:\s*e\.target\.value)(?!\.toUpperCase\(\))/g, '$1.toUpperCase()');
    content = content.replace(/(documento:\s*e\.target\.value)(?!\.toUpperCase\(\))/g, '$1.toUpperCase()');
    content = content.replace(/(razao_social:\s*e\.target\.value)(?!\.toUpperCase\(\))/g, '$1.toUpperCase()');
    content = content.replace(/(nome_fantasia:\s*e\.target\.value)(?!\.toUpperCase\(\))/g, '$1.toUpperCase()');
    content = content.replace(/(marca:\s*e\.target\.value)(?!\.toUpperCase\(\))/g, '$1.toUpperCase()');
    content = content.replace(/(placa:\s*e\.target\.value)(?!\.toUpperCase\(\))/g, '$1.toUpperCase()');
    content = content.replace(/(chassi:\s*e\.target\.value)(?!\.toUpperCase\(\))/g, '$1.toUpperCase()');
    content = content.replace(/(renavam:\s*e\.target\.value)(?!\.toUpperCase\(\))/g, '$1.toUpperCase()');

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated: ' + filePath);
    }
}

function traverse(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverse(fullPath);
        } else if (fullPath.endsWith('.tsx') && (fullPath.includes('Form') || fullPath.includes('Manager') || fullPath.includes('List'))) {
            processFile(fullPath);
        }
    }
}

traverse(targetDir);
console.log('Done module-wide update.');
