import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testGemini() {
    const key = process.env.VITE_GEMINI_API_KEY;
    console.log('Testando chave:', key ? '***' + key.slice(-4) : 'NÃO ENCONTRADA');
    
    if (!key || key.includes('PLACEHOLDER')) {
        console.error('ERRO: Chave não configurada no .env.local');
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Diga 'OK' se você estiver funcionando.");
        console.log('Resposta do Gemini:', result.response.text());
    } catch (error: any) {
        console.error('Falha na API do Gemini:', error.message);
    }
}

testGemini();
