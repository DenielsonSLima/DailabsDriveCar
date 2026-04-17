import { IParceiro, TipoParceiro, PessoaTipo } from '../../parceiros/parceiros.types';
import { maskCPF, maskCNPJ } from '../../../utils/formatters';
import ModalQuickPartner from '../../parceiros/components/ModalQuickPartner';

interface Props {
  parceiros: IParceiro[];
  selectedId?: string;
  onChange: (parceiro: IParceiro) => void;
  disabled?: boolean;
  label?: string;
  defaultType?: TipoParceiro;
}

const PartnerSelect: React.FC<Props> = ({ parceiros, selectedId, onChange, disabled, label = "Parceiro", defaultType }) => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedPartner = parceiros.find(p => p.id === selectedId);
  const filtered = parceiros.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    (p.documento && p.documento.includes(search))
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="flex items-center justify-between mb-2 ml-1">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</label>
        
        {!disabled && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-all flex items-center bg-indigo-50 px-2 py-1 rounded-md"
          >
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M12 4v16m8-8H4" /></svg>
            + Novo
          </button>
        )}
      </div>

      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center justify-between transition-all shadow-sm ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-emerald-300 hover:shadow-md'}`}
      >
        {selectedPartner ? (
          <span className="font-bold text-slate-900 uppercase">{selectedPartner.nome}</span>
        ) : (
          <span className="text-slate-400 font-bold italic">Clique para selecionar...</span>
        )}
        {!disabled && (
          <svg className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        )}
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-slate-100">
            <input
              autoFocus
              type="text"
              placeholder={`Pesquisar ${label.toLowerCase()}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.map(p => (
              <div
                key={p.id}
                onClick={() => { onChange(p); setIsOpen(false); }}
                className="p-4 hover:bg-indigo-50 cursor-pointer flex flex-col transition-colors border-b border-slate-50 last:border-0"
              >
                <span className="text-sm font-black text-slate-900 uppercase">{p.nome}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {p.pessoa_tipo === PessoaTipo.FISICA ? maskCPF(p.documento) : maskCNPJ(p.documento)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isModalOpen && (
        <ModalQuickPartner
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          defaultType={defaultType}
          onSuccess={(p) => {
            queryClient.invalidateQueries({ queryKey: ['parceiros_select'] });
            onChange(p);
          }}
        />
      )}
    </div>
  );
};

export default PartnerSelect;
