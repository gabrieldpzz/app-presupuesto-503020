import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Plus, Wallet, Loader2, Trash2, Pencil } from 'lucide-react'; // <--- IMPORTAR PENCIL
import ModalNuevaCuenta from '../components/ModalNuevaCuenta';

export default function Cuentas() {
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ESTADOS MODAL
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null); // <--- NUEVO

  const [totalSaldo, setTotalSaldo] = useState(0);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    // ... (Tu código de carga igual que antes) ...
    setLoading(true);
    const { data, error } = await supabase.from('cuentas').select('*').order('created_at', { ascending: true });
    if (!error && data) {
      setCuentas(data);
      const total = data.reduce((acc, curr) => acc + (curr.tipo === 'credito' ? 0 : curr.saldo), 0);
      setTotalSaldo(total);
    }
    setLoading(false);
  }

  // ABRIR MODAL NUEVO
  const handleNew = () => {
      setEditingAccount(null);
      setIsModalOpen(true);
  };

  // ABRIR MODAL EDITAR
  const handleEdit = (cuenta) => {
      setEditingAccount(cuenta);
      setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta cuenta?")) return;
    await supabase.from('cuentas').delete().eq('id', id);
    fetchData();
  };

  const gradients = {
    black: 'from-zinc-800 to-zinc-950 text-white border-zinc-700',
    blue: 'from-blue-500 to-blue-700 text-white border-blue-400',
    purple: 'from-purple-500 to-purple-700 text-white border-purple-400',
    emerald: 'from-emerald-500 to-emerald-700 text-white border-emerald-400',
    rose: 'from-rose-500 to-rose-700 text-white border-rose-400',
    orange: 'from-orange-400 to-orange-600 text-white border-orange-300',
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 animate-in fade-in duration-500">
      
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--bg-button)] rounded-lg text-blue-500 border border-[var(--border)]">
            <Wallet size={20} />
          </div>
          <div>
             <h1 className="text-2xl font-black text-[var(--text-main)] leading-none">Mis Cuentas</h1>
             <p className="text-[10px] font-bold text-[var(--text-accent)] uppercase tracking-widest mt-1">
               Saldo Global: <span className="text-[var(--text-main)] text-sm">${totalSaldo.toLocaleString()}</span>
             </p>
          </div>
        </div>
        <button 
          onClick={handleNew} // <--- Usar función wrapper
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 hover:scale-105 transition-all shadow-lg shadow-blue-500/20 cursor-pointer active:scale-95"
        >
          <Plus size={18} /> Nueva Cuenta
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
      ) : cuentas.length === 0 ? (
        <div className="text-center p-10 opacity-50 text-[var(--text-accent)]">Agrega tu primera cuenta bancaria o efectivo.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cuentas.map((c) => (
            <div 
              key={c.id} 
              // Agregamos onClick para editar al tocar la tarjeta entera
              onClick={() => handleEdit(c)}
              className={`
                relative h-56 rounded-[1.5rem] p-6 flex flex-col justify-between shadow-xl 
                bg-gradient-to-br ${gradients[c.color] || gradients.black}
                transition-transform hover:-translate-y-1 hover:shadow-2xl cursor-pointer group
                border border-white/10
              `}
            >
               {/* BOTONES DE ACCIÓN (Esquina Superior Derecha) */}
               <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleEdit(c); }}
                    className="p-2 bg-black/20 hover:bg-white text-white/70 hover:text-indigo-600 rounded-full cursor-pointer"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                    className="p-2 bg-black/20 hover:bg-red-500 text-white/70 hover:text-white rounded-full cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
               </div>

               {/* ... (Resto del contenido de la tarjeta igual) ... */}
               <div className="flex justify-between items-start">
                  <div>
                     <p className="text-xs font-bold uppercase opacity-70 tracking-widest mb-1">{c.tipo}</p>
                     <h3 className="text-xl font-black tracking-wide pr-2">{c.nombre}</h3>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-1 shadow-md overflow-hidden shrink-0">
                     {c.logo_url ? <img src={c.logo_url} className="w-full h-full object-contain"/> : <Wallet className="text-zinc-400" size={24} />}
                  </div>
               </div>
               
               <div className="w-12 h-9 rounded-md bg-gradient-to-tr from-yellow-200 to-yellow-500 opacity-80 border border-yellow-600/50 shadow-sm mt-2" />
               
               <div className="mt-auto pt-4">
                   <p className="text-[10px] font-bold uppercase opacity-70">Saldo Disponible</p>
                   <p className="text-3xl font-black tracking-tight">${c.saldo.toLocaleString()}</p>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Pasar editingAccount al modal */}
      <ModalNuevaCuenta 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onRefresh={fetchData} 
        editingAccount={editingAccount} 
      />
    </div>
  );
}