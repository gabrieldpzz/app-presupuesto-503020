import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, CreditCard, Loader2, Wallet, ArrowRight, ChevronDown } from 'lucide-react';

export default function ModalPagar({ isOpen, onClose, item, tipo, onConfirm }) {
  const [cuentas, setCuentas] = useState([]);
  const [selectedCuentaId, setSelectedCuentaId] = useState(''); // Guardamos solo el ID
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) fetchCuentas();
  }, [isOpen]);

  async function fetchCuentas() {
    // Traemos cuentas ordenadas por saldo
    const { data } = await supabase.from('cuentas').select('*').order('saldo', { ascending: false });
    setCuentas(data || []);
    
    // Seleccionar la primera por defecto si existe
    if (data && data.length > 0) {
      setSelectedCuentaId(data[0].id);
    }
  }

  const handlePagar = async () => {
    if (!selectedCuentaId) return;
    setLoading(true);
    await onConfirm(item, tipo, selectedCuentaId);
    setLoading(false);
    onClose();
  };

  // Helper para obtener datos de la cuenta seleccionada visualmente
  const cuentaSeleccionada = cuentas.find(c => c.id === selectedCuentaId);

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[var(--bg-sidebar)] w-full max-w-sm rounded-[2rem] border border-[var(--border)] shadow-2xl p-6 animate-in zoom-in-95">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-[var(--text-main)]">Confirmar Pago</h3>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-button)] rounded-full text-[var(--text-accent)] cursor-pointer"><X size={20} /></button>
        </div>

        {/* 1. Resumen del Item a Pagar */}
        <div className="bg-[var(--bg-app)] p-4 rounded-2xl mb-6 border border-[var(--border)] relative overflow-hidden">
           {/* Decoración de fondo */}
           <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-bl-full -mr-4 -mt-4" />

           <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="w-12 h-12 bg-[var(--bg-sidebar)] rounded-xl p-1 shadow-sm border border-[var(--border)] flex items-center justify-center">
                 {item.logo_url ? <img src={item.logo_url} className="w-full h-full object-contain" /> : <Wallet className="text-zinc-400" />}
              </div>
              <div>
                 <p className="text-[10px] font-bold text-[var(--text-accent)] uppercase tracking-widest">{tipo}</p>
                 <p className="font-black text-[var(--text-main)] text-lg leading-tight">{item.nombre}</p>
              </div>
           </div>
           
           <div className="flex justify-between items-end border-t border-[var(--border)] pt-3 relative z-10">
              <span className="text-xs font-bold text-[var(--text-accent)]">Monto a debitar</span>
              <span className="text-2xl font-black text-[var(--text-main)] tracking-tight">${item.monto.toLocaleString()}</span>
           </div>
        </div>

        {/* 2. Selector de Cuenta (Dropdown) */}
        <div className="mb-6 space-y-3">
           <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-accent)] ml-1 block">Selecciona la cuenta</label>
           
           <div className="relative">
             <select
               value={selectedCuentaId}
               onChange={(e) => setSelectedCuentaId(e.target.value)}
               className="w-full bg-[var(--bg-app)] border border-[var(--border)] text-[var(--text-main)] font-bold rounded-2xl p-4 pr-10 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer transition-all"
             >
               {cuentas.map((c) => (
                 <option key={c.id} value={c.id}>
                   {c.nombre}
                 </option>
               ))}
             </select>
             {/* Flecha personalizada */}
             <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-accent)]">
                <ChevronDown size={20} />
             </div>
           </div>

           {/* Info de Saldo de la cuenta seleccionada */}
           {cuentaSeleccionada && (
             <div className="flex justify-between items-center px-2">
                <span className="text-[10px] font-bold text-[var(--text-accent)]">Saldo disponible:</span>
                <span className={`text-xs font-black ${cuentaSeleccionada.saldo < item.monto ? 'text-red-500' : 'text-emerald-500'}`}>
                   ${cuentaSeleccionada.saldo.toLocaleString()}
                </span>
             </div>
           )}
        </div>

        {/* 3. Botón de Confirmación */}
        <button 
          onClick={handlePagar}
          disabled={loading || !selectedCuentaId}
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black flex justify-center items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {loading ? <Loader2 className="animate-spin" /> : <>CONFIRMAR PAGO <ArrowRight size={18} /></>}
        </button>

      </div>
    </div>
  );
}