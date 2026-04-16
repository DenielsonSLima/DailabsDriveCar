
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hlmhlltmgwxlibklyrzc.supabase.co';
// Usando a chave anon apenas para listar, mas para deletar precisamos de permissão.
// Se o usuário não definiu RLS restritivo no bucket 'veiculos', a chave anon pode funcionar.
// Caso contrário, tentaremos usar o access token se possível, mas o client JS usa chaves de API.
const supabaseAnonKey = 'sb_publishable__7lmXoWRtP6eGjYfmbUUrQ_rh-Ps2D1';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanup() {
  console.log('--- Iniciando Limpeza de Arquivos Órfãos ---');
  
  // Lista de arquivos identificados como órfãos (copiada do resultado SQL anterior)
  const orphanFiles = [
    "06rrbko0rzvi_1770922568409.jpg", "0g7zol8z2dp_1771868843922.jpg", "0uc3mk7kwzn_1771338634089.jpg",
    "298aq68pr6c_1771346120443.jpg", "3ogg8rch0o3_1771015968157.jpg", "4fn3gj4urz3_1771962043137.jpg",
    "4jiypn1k8vl_1771964603397.jpg", "4rajje2scfo_1771963722452.jpg", "5i1w40zqj6_1770924833853.jpg",
    "5w4urnjza7t_1771346120439.jpg", "7rhai3svxaw_1771962043139.jpg", "82aazu3ldsh_1772501870800.jpg",
    "8fkv88thkhx_1770924833845.jpg", "90vxnmdaag_1771962043141.jpg", "98qo2dd8igd_1770922566249.jpg",
    "agaka9roohl_1771962043134.jpg", "ajmiz47tuza_1770924833848.jpg", "ap50b7al92k_1771964603393.jpg",
    "b4qsywbr50k_1770924833855.jpg", "b7b07c11vcb_1772052035546.jpg", "bcyzq4u1xr_1771015968160.jpg",
    "ckz0n6vd37q_1771015968163.jpg", "dg75eb6h147_1770922567841.jpg", "f9ojtt4pi2c_1770922565836.jpg",
    "fise1dprp2i_1770922569015.jpg", "fwcj8mbpste_1770922569735.jpg", "hkd5ei0l44e_1770922567366.jpg",
    "j52qqndy69s_1770924833843.jpg", "j8dz0zfdn6g_1771338634085.jpg", "jbh4b08wq2_1771338634097.jpg",
    "jnexyww285_1771963722455.jpg", "ko8xgebzaq_1771964603399.jpg", "kq796cf4p3f_1770924833838.jpg",
    "l6o463og1f_1772052035552.jpg", "l7xx1dvdmwg_1771338634094.jpg", "lkgsk3gr9y_1771346120436.jpg",
    "n0y284i89l_1771963722456.jpg", "ne7sx2nfr4j_1771338634090.jpg", "pcs2u5pj3l_1772052035550.jpg",
    "pi1mjw5js8_1770924833850.jpg", "qr4f1t1vi4_1770924833841.jpg", "r5weawlwa6_1771346120441.jpg",
    "rc020rx55o_1771338634092.jpg", "re7w3fjpdsp_1771346120445.jpg", "shku45wy9jp_1771963722460.jpg",
    "slge6lku7i_1771015968168.jpg", "tj0gf3hyxte_1771964603395.jpg", "tlb9a2721h8_1771963722458.jpg",
    "txw601m6vja_1770922565329.jpg", "uzv3nk06yy_1771338634099.jpg", "vispx987z8l_1772501870803.jpg",
    "vltia7u9d0e_1770924833844.jpg", "w7czhh7qggi_1771338634087.jpg", "wir45g0g1vn_1771015968165.jpg",
    "wwkc5gvku5p_1770924833851.jpg", "xn3e9phsfka_1771338634082.jpg", "xrny7nmawt7_1772501870797.jpg",
    "yn38665ta9a_1770922566773.jpg", "zqv85ze33os_1770922564648.jpg"
  ];

  console.log(`Encontrados ${orphanFiles.length} arquivos para deletar.`);

  const { data, error } = await supabase.storage
    .from('veiculos')
    .remove(orphanFiles);

  if (error) {
    console.error('Erro ao deletar arquivos:', error.message);
    console.log('DICA: Se for erro de permissão (403), é porque a anon key não tem poder de DELETE no bucket.');
  } else {
    console.log('Sucesso! Arquivos deletados:', data.length);
  }
}

cleanup();
