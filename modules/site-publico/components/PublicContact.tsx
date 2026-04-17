import React from 'react';

interface Props {
    telefone?: string;
    contato_titulo?: string;
    contato_subtitulo?: string;
    contato_descricao?: string;
    contato_horario_semana?: string;
    contato_horario_sabado?: string;
}

const DEFAULT_TITULO = 'Tradição e Segurança em Cada Negociação';
const DEFAULT_SUBTITULO = 'Qualidade Souza Veículos';
const DEFAULT_DESCRICAO = 'Oferecemos oportunidades exclusivas para quem deseja adquirir um veículo de alta performance e procedência garantida. Nossa equipe atua com foco na satisfação total do cliente, garantindo uma negociação segura, ágil e totalmente transparente do início ao fim.';

/**
 * Função de limpeza reforçada para garantir que nenhum vestígio da marca antiga apareça.
 * Converte "Hidrocar" ou "HCV" para "Souza Veículos" ou "Souza".
 */
const cleanBranding = (text: string) => {
    if (!text) return text;
    return text
        .replace(/Hidrocar Veículos/gi, 'Souza Veículos')
        .replace(/Hidrocar/gi, 'Souza')
        .replace(/HCV/gi, 'Souza');
};

const PublicContact: React.FC<Props> = React.memo(({ telefone, contato_titulo, contato_subtitulo, contato_descricao, contato_horario_semana, contato_horario_sabado }) => {
    const phone = (telefone || '').replace(/\D/g, '');
    const whatsappUrl = `https://api.whatsapp.com/send?phone=55${phone}&text=Seu%20seminovo%20está%20aqui,%20fale%20conosco!`;

    const titulo = cleanBranding(contato_titulo || DEFAULT_TITULO);
    const subtitulo = cleanBranding(contato_subtitulo || DEFAULT_SUBTITULO);
    const descricao = cleanBranding(contato_descricao || DEFAULT_DESCRICAO);
    const horarioSemana = contato_horario_semana || '08h às 17h';
    const horarioSabado = contato_horario_sabado || '08h às 12h';

    // Separar título para a parte gradiente
    const tituloPartes = titulo.split('\n').length > 1 ? titulo.split('\n') : titulo.split(' em ');
    const tituloPrimeiro = tituloPartes.length > 1 ? tituloPartes[0] : titulo;
    const tituloSegundo = tituloPartes.length > 1 ? tituloPartes.slice(1).join(' em ') : '';

    return (
        <section id="contato" className="relative w-full min-h-[600px] bg-[#050a14] overflow-hidden flex items-center">
            {/* Gradients Ambientais */}
            <div className="absolute top-[-150px] left-[-150px] w-[600px] h-[600px] bg-white/5 rounded-full blur-[150px] pointer-events-none"></div>
            <div className="absolute bottom-[-150px] right-[-150px] w-[600px] h-[600px] bg-white/5 rounded-full blur-[150px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-6 w-full py-20 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Lado Esquerdo: Conteúdo Textual */}
                    <div className="space-y-8">
                        <div className="inline-flex items-center space-x-3 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl backdrop-blur-md">
                            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-200">{subtitulo}</span>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-[900] text-white uppercase tracking-tighter leading-[0.95]">
                                {tituloPrimeiro} <br />
                                {tituloSegundo && <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">{tituloSegundo}</span>}
                            </h2>
                            <p className="text-lg text-blue-100/70 font-medium max-w-xl leading-relaxed">
                                {descricao}
                            </p>
                            <div className="flex items-center space-x-2 text-slate-300">
                                <div className="h-px w-8 bg-orange-500/50"></div>
                                <span className="text-xs font-bold uppercase tracking-widest">Excelência em Seminovos e Veículos Especiais.</span>
                            </div>
                        </div>

                        <p className="text-sm font-medium text-white/40 italic">
                            Souza Veículos — credibilidade e segurança no mercado automotivo.
                        </p>
                    </div>

                    {/* Lado Direito: Informações de Contato */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:justify-items-end">

                        {/* Bloco de Atendimento */}
                        <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] backdrop-blur-sm space-y-4 w-full max-w-sm">
                            <div className="flex items-center space-x-3 text-orange-500">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">Atendimento</h3>
                            </div>
                            <div className="space-y-2 text-blue-100/60 text-sm">
                                <p><span className="text-white font-bold">Segunda a Sexta-feira:</span> <br /> {horarioSemana}</p>
                                <p><span className="text-white font-bold">Sábado:</span> <br /> {horarioSabado}</p>
                            </div>
                        </div>

                        {/* Bloco de Localização */}
                        <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] backdrop-blur-sm space-y-4 w-full max-w-sm">
                            <div className="flex items-center space-x-3 text-blue-400">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">Endereço</h3>
                            </div>
                            <p className="text-blue-100/60 text-sm leading-relaxed">
                                Rua Lions Club, Nº 526 <br />
                                Atalaia – Aracaju – SE
                            </p>
                        </div>

                        {/* Link de WhatsApp */}
                        <div className="md:col-span-2 w-full max-w-sm lg:max-w-none">
                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative flex items-center justify-between bg-white/10 hover:bg-white text-white hover:text-[#0a2540] p-6 lg:p-8 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs transition-all border border-white/20 hover:border-white hover:-translate-y-1 active:scale-95 shadow-xl backdrop-blur-md"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]"></div>

                                <div className="relative flex items-center space-x-5 z-10">
                                    <div className="w-14 h-14 bg-[#25D366] text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.415-8.406z" />
                                        </svg>
                                    </div>
                                    <div className="flex flex-col space-y-1">
                                        <span className="text-[10px] font-bold opacity-80 group-hover:text-emerald-700">Fale com um Consultor</span>
                                        <span className="text-sm md:text-base group-hover:text-emerald-800 tracking-tighter">Chamar no WhatsApp</span>
                                    </div>
                                </div>

                                <div className="relative z-10 w-10 h-10 border border-white/30 group-hover:border-emerald-500/30 rounded-full flex items-center justify-center transition-colors">
                                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform group-hover:text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </div>
                            </a>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
});

PublicContact.displayName = 'PublicContact';

export default PublicContact;
