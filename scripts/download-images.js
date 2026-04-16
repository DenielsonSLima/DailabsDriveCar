
import fs from 'fs';
import https from 'https';
import path from 'path';

const slidesDir = path.join(process.cwd(), 'public', 'slides');

// Imagens selecionadas: Sedans e Hatchbacks modernos, sem placa visível ou placa neutra
const images = [
  {
    url: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?q=80&w=1600&auto=format&fit=crop', // Sedan Vermelho (Geral)
    name: 'slide-1.jpg'
  },
  {
    url: 'https://images.unsplash.com/photo-1616455579100-2ceaa4eb2d37?q=80&w=1600&auto=format&fit=crop', // Sedan Branco (Estilo Virtus/Corolla)
    name: 'slide-2.jpg'
  },
  {
    url: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=1600&auto=format&fit=crop', // Sedan Prata (Estilo Voyage/Cronos)
    name: 'slide-3.jpg'
  },
  {
    url: 'https://images.unsplash.com/photo-1493238507154-203aa9874799?q=80&w=1600&auto=format&fit=crop', // Fachada Concessionária Realista
    name: 'fachada-souza.jpg'
  }
];

if (!fs.existsSync(slidesDir)) {
  fs.mkdirSync(slidesDir, { recursive: true });
}

const assetsDir = path.join(process.cwd(), 'modules', 'site-publico', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Baixado: ${path.basename(dest)}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  console.log('--- Iniciando Download de Imagens Reais ---');
  for (const img of images) {
    const dest = img.name.includes('fachada') 
      ? path.join(assetsDir, img.name)
      : path.join(slidesDir, img.name);
    try {
      await download(img.url, dest);
    } catch (e) {
      console.error(`Erro ao baixar ${img.name}:`, e.message);
    }
  }
  console.log('--- Downloads Concluídos ---');
}

run();
