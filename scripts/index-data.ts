import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://hlmhlltmgwxlibklyrzc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error("Erro: SUPABASE_SERVICE_ROLE_KEY ou VITE_SUPABASE_ANON_KEY não encontrada.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

async function generateEmbedding(text: string) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'PLACEHOLDER_API_KEY') {
    return new Array(768).fill(0);
  }
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}

async function indexTable(tableName: string, formatFn: (item: any) => string, type: string) {
  console.log(`Indexando tabela: ${tableName}...`);
  const { data, error } = await supabase.from(tableName).select('*');
  
  if (error) {
    console.error(`Erro ao buscar dados de ${tableName}:`, error);
    return;
  }

  for (const item of data || []) {
    const content = formatFn(item);
    const embedding = await generateEmbedding(content);
    
    const { error: upsertError } = await supabase.from('rag_memory').upsert({
      content,
      embedding,
      organization_id: item.organization_id,
      metadata: {
        source_table: tableName,
        source_id: item.id,
        type: type,
        updated_at: new Date().toISOString()
      }
    }, { onConflict: 'metadata->>source_id' });

    if (upsertError) {
      console.error(`Erro ao inserir memória para ${item.id}:`, upsertError);
    } else {
      console.log(`✓ Indexado: ${type} - ${item.id}`);
    }
  }
}

async function main() {
  // Indexar Veículos
  await indexTable('est_veiculos', (v) => 
    `Veículo: ${v.placa ? 'Placa ' + v.placa : 'Sem placa'}. KM: ${v.km}. Ano: ${v.ano_fabricacao}/${v.ano_modelo}. Combustível: ${v.combustivel}. Status: ${v.status}. Valor Venda: R$ ${v.valor_venda}.`,
    'vehicle'
  );

  // Indexar Parceiros
  await indexTable('parceiros', (p) => 
    `Parceiro: ${p.nome}. Documento: ${p.documento}. Tipo: ${p.tipo}. Email: ${p.email || 'N/A'}. Telefone: ${p.telefone || 'N/A'}. Localização: ${p.cidade}/${p.uf}.`,
    'partner'
  );

  // Indexar Títulos Financeiros
  await indexTable('fin_titulos', (t) => 
    `Título Financeiro: ${t.descricao}. Tipo: ${t.tipo}. Status: ${t.status}. Valor Total: R$ ${t.valor_total}. Vencimento: ${t.data_vencimento}.`,
    'transaction'
  );

  console.log("Indexação concluída!");
}

main().catch(console.error);
