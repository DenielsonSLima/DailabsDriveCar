const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'modules/cadastros');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Pattern 1: setNome(e.target.value) -> setNome(e.target.value.toUpperCase())
    // Exclude numbers like Number(e.target.value) or setHex(e.target.value)
    content = content.replace(/(set(?:Nome|Descricao|Cidade|Uf|Documento|Email|Telefone|Placa|Chassi|Renavam)\(e\.target\.value)(?!\.toUpperCase\(\))(\))/g, '$1.toUpperCase()$2');
    content = content.replace(/(set(?:Sigla|Apelido)\(e\.target\.value)(?!\.toUpperCase\(\))(\))/g, '$1.toUpperCase()$2');

    // Pattern 2: nome: e.target.value -> nome: e.target.value.toUpperCase()
    // specific variables
    content = content.replace(/(nome:\s*e\.target\.value)(?!\.toUpperCase\(\))/g, '$1.toUpperCase()');
    content = content.replace(/(descricao:\s*e\.target\.value)(?!\.toUpperCase\(\))/g, '$1.toUpperCase()');
    content = content.replace(/(cidade:\s*e\.target\.value)(?!\.toUpperCase\(\))/g, '$1.toUpperCase()');
    content = content.replace(/(uf:\s*e\.target\.value)(?!\.toUpperCase\(\))/g, '$1.toUpperCase()');

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
        } else if (fullPath.endsWith('.tsx') && fullPath.includes('Form')) {
            processFile(fullPath);
        } else if (fullPath.endsWith('.tsx') && fullPath.includes('Manager')) {
            processFile(fullPath);
        }
    }
}

traverse(targetDir);
console.log('Done.');
