import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { registrarPago } from '../lib/paymentService';
import { Plus, Smartphone, Loader2, Image as ImageIcon, Pencil, Trash2, Check } from 'lucide-react';
import ModalNuevaSuscripcion from '../components/ModalNuevaSuscripcion';
import ModalPagar from '../components/ModalPagar';
import { calcularEstadoPago } from '../lib/dateUtils';

export default function Suscripciones() {
  const [suscripciones, setSuscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [pagarItem, setPagarItem] = useState(null);

  useEffect(() => {
    getSuscripciones();
  }, []);

  async function getSuscripciones() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('suscripciones')
        .select('*')
        .order('activo', { ascending: false }); // Activos primero

      if (error) throw error;
      setSuscripciones(data || []);
    } catch (err) {
      console.error('Error al cargar datos', err);
    } finally {
      setLoading(false);
    }
  }

  const onConfirmarPago = async (item, tipo, cuentaId) => {
    try {
      await registrarPago(item, tipo, cuentaId);
      await getSuscripciones();
      setPagarItem(null);
    } catch (error) {
      alert("Error al procesar el pago");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar esta suscripción?")) return;
    try {
      const { error } = await supabase.from('suscripciones').delete().eq('id', id);
      if (error) throw error;
      getSuscripciones();
    } catch (err) {
      alert("Error al eliminar: " + err.message);
    }
  };

  const handleEdit = (sub) => {
    setEditingSub(sub);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingSub(null);
    setIsModalOpen(true);
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--bg-button)] rounded-lg text-purple-600 border border-[var(--border)]">
            <Smartphone size={20} />
          </div>
          <h1 className="text-2xl font-black text-[var(--text-main)]">Suscripciones</h1>
        </div>
        
        <button 
          onClick={handleNew}
          className="bg-purple-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-purple-700 hover:scale-105 transition-all shadow-lg shadow-purple-500/20 cursor-pointer active:scale-95"
        >
          <Plus size={18} /> Nueva
        </button>
      </div>

      {/* GRID */}
      {loading ? (
        <div className="p-20 flex justify-center">
          <Loader2 className="animate-spin text-purple-500" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suscripciones.map((s) => {
             // 1. CALCULAR ESTADO
             const info = calcularEstadoPago(s.ultimo_pago, s.frecuencia || 'mensual');

             // 2. ESTILO DE TARJETA (Igual que Servicios)
             // Usamos variables CSS para asegurar blanco puro en modo claro
             const baseStyle = "bg-[var(--bg-sidebar)] border border-[var(--border)] shadow-sm hover:shadow-md";
             const inactiveStyle = "opacity-60 grayscale bg-[var(--bg-app)] border border-[var(--border)]";

            return (
              <div 
                key={s.id} 
                className={`${s.activo ? baseStyle : inactiveStyle} p-6 rounded-[2rem] transition-all duration-300 hover:-translate-y-1 group relative flex flex-col`}
              >
                 
                 {/* Botones Flotantes */}
                 <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button onClick={() => handleEdit(s)} className="p-2 bg-[var(--bg-button)] hover:bg-zinc-200 rounded-full text-indigo-600 shadow-sm border border-[var(--border)] cursor-pointer"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-2 bg-[var(--bg-button)] hover:bg-zinc-200 rounded-full text-red-500 shadow-sm border border-[var(--border)] cursor-pointer"><Trash2 size={14} /></button>
                 </div>

                 {/* Header (Logo + Nombre) */}
                 <div className="flex items-center gap-4 mb-5">
                   <div className="w-14 h-14 bg-[var(--bg-app)] rounded-2xl border border-[var(--border)] p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                      {s.logo_url ? <img src={s.logo_url} className="w-full h-full object-contain" alt={s.nombre} /> : <ImageIcon className="text-[var(--text-accent)]" size={24} />}
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-[var(--text-main)] leading-tight mb-1">{s.nombre}</h3>
                      <span className="inline-block bg-[var(--bg-app)] text-[var(--text-accent)] text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border border-[var(--border)]">
                        {s.frecuencia || 'Mensual'}
                      </span>
                   </div>
                 </div>

                 {/* BLOQUE CENTRAL DE COLOR (INFO) */}
                 {/* Colores Sólidos desde dateUtils */}
                 <div className={`${info.bgInfo} rounded-2xl p-5 mb-6 flex-1 transition-colors duration-300 border border-black/5 dark:border-white/5`}>
                    
                    {/* Fila 1: Último Pago */}
                    <div className={`flex justify-between items-center mb-4 pb-4 border-b border-black/5 dark:border-white/10`}>
                        <span className={`text-[10px] font-bold uppercase ${info.labelInfo}`}>Último Pago</span>
                        <span className={`text-xs font-black ${info.textInfo}`}>
                           {s.ultimo_pago ? new Date(s.ultimo_pago + 'T00:00:00').toLocaleDateString('es-ES', {day: 'numeric', month: 'short'}) : '--'}
                        </span>
                    </div>
                    
                    {/* Fila 2: Próximo Vencimiento */}
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                           <span className={`text-[10px] font-bold uppercase mb-0.5 ${info.labelInfo}`}>Vence el</span>
                           <span className={`text-sm font-black ${info.textInfo}`}>{info.textoFecha}</span>
                        </div>
                        <div className={`text-right ${info.textInfo}`}>
                           <span className="text-3xl font-black leading-none block">{Math.abs(info.diasRestantes)}</span>
                           <span className={`text-[9px] font-bold uppercase tracking-wider ${info.labelInfo}`}>
                              {info.diasRestantes < 0 ? 'Días Vencido' : 'Días Rest.'}
                           </span>
                        </div>
                    </div>
                 </div>

                 {/* Footer (Precio + Botón) */}
                 <div className="flex items-center justify-between pt-1">
                    <p className="text-3xl font-black text-[var(--text-main)] tracking-tight">
                        ${s.monto.toLocaleString()}
                    </p>
                    
                    {s.activo ? (
                        <button 
                            onClick={() => !info.estaPagado && setPagarItem(s)}
                            disabled={info.estaPagado}
                            className={`
                                flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95
                                ${info.estaPagado 
                                    ? 'bg-emerald-500 text-white cursor-default shadow-emerald-200 dark:shadow-none' 
                                    : 'bg-[var(--text-main)] text-[var(--bg-sidebar)] hover:opacity-90 shadow-sm cursor-pointer'} 
                            `}
                        >
                            {info.estaPagado ? <><Check size={16} /> AL DÍA</> : "PAGAR"}
                        </button>
                    ) : (
                        <span className="px-4 py-2 bg-[var(--bg-app)] text-[var(--text-accent)] rounded-lg text-xs font-black uppercase tracking-wider border border-[var(--border)]">
                            Inactivo
                        </span>
                    )}
                 </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL */}
      <ModalNuevaSuscripcion 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onRefresh={getSuscripciones}
        editingSubscription={editingSub}
      />
      <ModalPagar 
        isOpen={!!pagarItem}
        onClose={() => setPagarItem(null)}
        item={pagarItem}
        tipo="suscripcion"
        onConfirm={onConfirmarPago}
      />
    </div>
  );
}