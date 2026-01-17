import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { obtenerDeudasPorGasto, marcarDeudaPagada, desmarcarDeudaPagada } from '../lib/debtService';
import { X, Check, RotateCcw, Loader2, Users } from 'lucide-react';

export default function ModalDetalleDeudas({ isOpen, onClose, gasto, onRefresh }) {
  const [deudas, setDeudas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cuentas, setCuentas] = useState([]);
  const [cuentaDestino, setCuentaDestino] = useState('');

  useEffect(() => {
    if (isOpen && gasto) fetchData();
  }, [isOpen, gasto]);

  async function fetchData() {
    setLoading(true);
    const data = await obtenerDeudasPorGasto(gasto.id);
    setDeudas(data);
    
    // Traemos cuentas para saber dónde depositar/retirar si marcamos/desmarcamos
    const { data: accs } = await supabase.from('cuentas').select('*');
    setCuentas(accs || []);
    // Por defecto usamos la cuenta con la que se pagó el gasto, o la primera disponible
    if (gasto.cuenta_id) setCuentaDestino(gasto.cuenta_id);
    else if (accs && accs.length > 0) setCuentaDestino(accs[0].id);

    setLoading(false);
  }

  const togglePago = async (deuda) => {
    if (!cuentaDestino) return alert("No hay cuenta asociada para ajustar el saldo.");
    
    try {
        if (deuda.pagado) {
            // DESMARCAR (Restar dinero)
            if(confirm(`¿Desmarcar pago de ${deuda.persona}? Se restarán $${deuda.monto} de la cuenta.`)) {
                await desmarcarDeudaPagada(deuda.id, cuentaDestino);
            }
        } else {
            // MARCAR (Sumar dinero)
            await marcarDeudaPagada(deuda.id, cuentaDestino);
        }
        fetchData(); // Actualizar lista local
        onRefresh(); // Actualizar saldos globales
    } catch (error) {
        alert("Error: " + error.message);
    }
  };

  if (!isOpen || !gasto) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[var(--bg-sidebar)] w-full max-w-md rounded-[2.5rem] border border-[var(--border)] shadow-2xl p-8 animate-in zoom-in-95">
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-black text-[var(--text-main)] flex items-center gap-2">
                <Users className="text-indigo-500"/> División de Gasto
            </h3>
            <p className="text-[10px] text-[var(--text-accent)] font-bold uppercase mt-1">
                {gasto.descripcion} (${gasto.monto})
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-button)] rounded-full text-[var(--text-accent)] cursor-pointer"><X size={20}/></button>
        </div>

        {/* SELECTOR DE CUENTA (Informativo o Cambiable) */}
        <div className="mb-4 bg-indigo-50 dark:bg-indigo-500/10 p-3 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
            <label className="text-[9px] font-black uppercase text-indigo-500 block mb-1">Cuenta para ajustes</label>
            <select 
                value={cuentaDestino} 
                onChange={(e) => setCuentaDestino(e.target.value)}
                className="w-full bg-transparent font-bold text-[var(--text-main)] text-sm outline-none"
            >
                {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
        </div>

        <div className="space-y-3">
            {loading ? <div className="text-center p-4"><Loader2 className="animate-spin inline text-indigo-500"/></div> : 
             deudas.length === 0 ? <p className="text-center opacity-50 text-sm">No hay personas asignadas a este gasto.</p> :
             deudas.map(d => (
                <div key={d.id} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${d.pagado ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-[var(--bg-app)] border-[var(--border)]'}`}>
                    
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${d.pagado ? 'bg-emerald-500 text-white' : 'bg-zinc-200 text-zinc-500'}`}>
                            {d.persona.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className={`font-bold text-sm ${d.pagado ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-main)]'}`}>{d.persona}</p>
                            <p className="text-[10px] font-black text-[var(--text-accent)]">${d.monto}</p>
                        </div>
                    </div>

                    <button 
                        onClick={() => togglePago(d)} 
                        className={`p-2 rounded-xl transition-all shadow-sm ${d.pagado ? 'bg-zinc-200 text-zinc-500 hover:bg-zinc-300' : 'bg-emerald-500 text-white hover:bg-emerald-600 hover:scale-105'}`}
                        title={d.pagado ? "Desmarcar (Revertir)" : "Marcar Pagado"}
                    >
                        {d.pagado ? <RotateCcw size={16} /> : <Check size={16} strokeWidth={3} />}
                    </button>
                </div>
             ))
            }
        </div>
      </div>
    </div>
  );
}