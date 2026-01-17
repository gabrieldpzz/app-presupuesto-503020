import { useState, useEffect } from 'react';
import { obtenerDeudasPendientes, marcarDeudaPagada } from '../lib/debtService';
import { supabase } from '../lib/supabaseClient';
import { X, Check, Loader2, Users } from 'lucide-react';

export default function ModalCuentasPorCobrar({ isOpen, onClose, onRefresh }) {
  const [deudas, setDeudas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cuentas, setCuentas] = useState([]);
  
  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen]);

  async function fetchData() {
    setLoading(true);
    const data = await obtenerDeudasPendientes();
    setDeudas(data);
    const { data: accs } = await supabase.from('cuentas').select('*');
    setCuentas(accs || []);
    setLoading(false);
  }

  const handleCobrar = async (deuda) => {
    // Usamos la primera cuenta por defecto o podríamos preguntar
    if (cuentas.length === 0) return alert("Crea una cuenta bancaria primero.");
    const cuentaId = cuentas[0].id; // Se deposita en la primera cuenta (puedes mejorar esto)

    if (confirm(`¿${deuda.persona} ya te pagó los $${deuda.monto}? Se sumará a ${cuentas[0].nombre}`)) {
        await marcarDeudaPagada(deuda.id, cuentaId);
        fetchData(); // Recargar lista local
        onRefresh(); // Recargar dashboard global
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[var(--bg-sidebar)] w-full max-w-md rounded-[2.5rem] border border-[var(--border)] shadow-2xl p-8 animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-[var(--text-main)] flex items-center gap-2"><Users className="text-indigo-500"/> Por Cobrar</h3>
          <button onClick={onClose}><X/></button>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {loading ? <div className="text-center p-4"><Loader2 className="animate-spin inline"/></div> : 
             deudas.length === 0 ? <p className="text-center opacity-50 text-sm">Nadie te debe dinero. ¡Qué suerte!</p> :
             deudas.map(d => (
                <div key={d.id} className="flex items-center justify-between p-4 bg-[var(--bg-app)] rounded-2xl border border-[var(--border)]">
                    <div>
                        <p className="font-bold text-[var(--text-main)]">{d.persona}</p>
                        <p className="text-[10px] text-[var(--text-accent)]">{d.gastos?.descripcion} • {new Date(d.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="font-black text-red-500">${d.monto}</span>
                        <button onClick={() => handleCobrar(d)} className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/30 hover:scale-105 transition-transform" title="Marcar como Pagado">
                            <Check size={16} strokeWidth={3} />
                        </button>
                    </div>
                </div>
             ))
            }
        </div>
      </div>
    </div>
  );
}