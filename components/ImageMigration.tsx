import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { StorageService } from '../lib/storage.service';
import { MontadorasService } from '../modules/cadastros/montadoras/montadoras.service';
import { ModelosService } from '../modules/cadastros/modelos/modelos.service';
import { EstoqueService } from '../modules/estoque/estoque.service';

const ImageMigration: React.FC = () => {
    const [status, setStatus] = useState<string>('Aguardando início...');
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [isMigrating, setIsMigrating] = useState(false);

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

    const migrateMontadoras = async () => {
        addLog('Iniciando migração de Montadoras...');
        const montadoras = await MontadorasService.getAll();
        let count = 0;

        for (const m of montadoras) {
            if (m.logo_url && m.logo_url.startsWith('data:')) {
                try {
                    addLog(`Migrando montadora: ${m.nome}`);
                    const file = StorageService.base64ToFile(m.logo_url, `montadora-${m.id}.jpg`);
                    const url = await StorageService.uploadImage(file, 'montadoras');

                    await supabase.from('cad_montadoras').update({ logo_url: url }).eq('id', m.id);
                    count++;
                } catch (e: any) {
                    addLog(`Erro na montadora ${m.nome}: ${e.message}`);
                }
            }
        }
        addLog(`Montadoras finalizadas. ${count} imagens migradas.`);
    };

    const migrateModelos = async () => {
        addLog('Iniciando migração de Modelos...');
        const modelos = await ModelosService.getAll();
        let count = 0;

        for (const m of modelos) {
            if (m.foto_url && m.foto_url.startsWith('data:')) {
                try {
                    addLog(`Migrando modelo: ${m.nome}`);
                    const file = StorageService.base64ToFile(m.foto_url, `modelo-${m.id}.jpg`);
                    const url = await StorageService.uploadImage(file, 'modelos');

                    await supabase.from('cad_modelos').update({ foto_url: url }).eq('id', m.id);
                    count++;
                } catch (e: any) {
                    addLog(`Erro no modelo ${m.nome}: ${e.message}`);
                }
            }
        }
        addLog(`Modelos finalizados. ${count} imagens migradas.`);
    };

    const migrateVeiculos = async () => {
        addLog('Iniciando migração de Veículos...');
        // Busca manual simples para pegar todos, sem paginação
        const { data: veiculos } = await supabase.from('est_veiculos').select('*');
        if (!veiculos) return;

        let count = 0;

        for (const v of veiculos) {
            if (v.fotos && Array.isArray(v.fotos)) {
                let changed = false;
                const newPhotos = [];

                for (const photo of v.fotos) {
                    if (photo.url && photo.url.startsWith('data:')) {
                        try {
                            addLog(`Migrando foto do veículo ID: ${v.id.substring(0, 8)}...`);
                            const file = StorageService.base64ToFile(photo.url, `veiculo-${v.id}-${photo.id}.jpg`);
                            const url = await StorageService.uploadImage(file, 'veiculos');
                            newPhotos.push({ ...photo, url });
                            changed = true;
                        } catch (e: any) {
                            addLog(`Erro na foto do veículo ${v.id}: ${e.message}`);
                            newPhotos.push(photo);
                        }
                    } else {
                        newPhotos.push(photo);
                    }
                }

                if (changed) {
                    await supabase.from('est_veiculos').update({ fotos: newPhotos }).eq('id', v.id);
                    count++;
                }
            }
        }
        addLog(`Veículos finalizados. ${count} veículos atualizados.`);
    };

    const handleStart = async () => {
        setIsMigrating(true);
        setLogs([]);
        setStatus('Migrando Montadoras...');

        try {
            await migrateMontadoras();

            setStatus('Migrando Modelos...');
            await migrateModelos();

            setStatus('Migrando Veículos...');
            await migrateVeiculos();

            setStatus('Concluído com sucesso!');
            addLog('Processo de migração finalizado.');
        } catch (error: any) {
            setStatus('Erro fatal na migração.');
            addLog(`Erro fatal: ${error.message}`);
        } finally {
            setIsMigrating(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 my-10">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Migração de Imagens (Otimização)</h2>
            <p className="text-slate-500 mb-6">
                Este utilitário varre o banco de dados em busca de imagens salvas como Base64 (pesadas)
                e as move para o Supabase Storage, atualizando os registros com links otimizados.
            </p>

            <div className="flex items-center space-x-4 mb-8">
                <button
                    onClick={handleStart}
                    disabled={isMigrating}
                    className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all"
                >
                    {isMigrating ? 'Migrando...' : 'Iniciar Migração'}
                </button>
                <span className="font-medium text-slate-700">{status}</span>
            </div>

            <div className="bg-slate-900 rounded-xl p-6 h-96 overflow-y-auto font-mono text-xs text-green-400 shadow-none">
                {logs.length === 0 ? (
                    <span className="text-slate-600 opacity-50">Log de processamento aparecerá aqui...</span>
                ) : (
                    logs.map((log, idx) => (
                        <div key={idx} className="mb-1 border-b border-white/5 pb-1 last:border-0">
                            {log}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ImageMigration;
