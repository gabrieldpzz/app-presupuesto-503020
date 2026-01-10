import { useEffect, useState } from 'react';
import { getMetas, eliminarMeta } from '../lib/savingsService';
import { Plus, Target, Trash2, Loader2 } from 'lucide-react';
import ModalNuevaMeta from '../components/ModalNuevaMeta';
import ModalDepositarAhorro from '../components/ModalDepositarAhorro'; // Reutilizamos para aportar

export default function Ahorros() {
  const [metas, setMetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
        const data = await getMetas();
        setMetas(data);
    } catch(e) { console.error(e); } 
    finally { setLoading(false); }
  }

  const handleDelete = async (id) => {
      if(!confirm("¿Eliminar meta? El dinero no regresará automáticamente a la cuenta (se asume gastado o debes hacer un ingreso manual).")) return;
      await eliminarMeta(id);
      fetchData();
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 animate-in fade-in">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--bg-button)] rounded-lg text-purple-500 border border-[var(--border)]"><Target size={20} /></div>
          <h1 className="text-2xl font-black text-[var(--text-main)]">Metas de Ahorro</h1>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setIsDepositOpen(true)} className="bg-[var(--bg-button)] text-[var(--text-main)] px-4 py-3 rounded-2xl font-bold border border-[var(--border)] hover:bg-[var(--border)]">Aportar</button>
            <button onClick={() => setIsNewOpen(true)} className="bg-purple-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 hover:bg-purple-700"><Plus size={18} /> Nueva</button>
        </div>
      </div>

      {loading ? <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-purple-500"/></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metas.map(m => {
                const percent = Math.min((m.ahorro_actual / m.meta_total) * 100, 100);
                return (
                    <div key={m.id} className="bg-[var(--bg-sidebar)] border border-[var(--border)] p-6 rounded-[2rem] shadow-sm relative group">
                        <button onClick={() => handleDelete(m.id)} className="absolute top-4 right-4 p-2 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                        
                        <div className={`w-12 h-12 rounded-2xl bg-${m.color}-100 dark:bg-${m.color}-500/20 text-${m.color}-600 dark:text-${m.color}-400 flex items-center justify-center mb-4`}>
                            <Target size={24} />
                        </div>
                        <h3 className="text-xl font-black text-[var(--text-main)] mb-1">{m.nombre}</h3>
                        <p className="text-sm font-bold text-[var(--text-accent)] mb-4">Meta: ${m.meta_total.toLocaleString()}</p>
                        
                        <div className="h-4 w-full bg-[var(--bg-app)] rounded-full overflow-hidden mb-2 border border-[var(--border)]">
                            <div className={`h-full bg-${m.color}-500 transition-all duration-1000`} style={{ width: `${percent}%` }} />
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-[var(--text-accent)]">{Math.round(percent)}%</span>
                            <span className={`text-lg font-black text-${m.color}-500`}>${m.ahorro_actual.toLocaleString()}</span>
                        </div>
                    </div>
                )
            })}
        </div>
      )}

      <ModalNuevaMeta isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} onRefresh={fetchData} />
      <ModalDepositarAhorro isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} onRefresh={fetchData} />
    </div>
  );
}