import { X, TrendingUp, Calendar, Wallet, Pencil, Trash2 } from 'lucide-react';

export default function ModalHistorialIngresos({ isOpen, onClose, ingresos, onEdit, onDelete }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[var(--bg-sidebar)] w-full max-w-4xl rounded-[2.5rem] border border-[var(--border)] shadow-2xl p-8 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h3 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-3">
             <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
               <TrendingUp size={24} />
             </div>
             Historial Completo de Ingresos
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-button)] rounded-full text-[var(--text-accent)] cursor-pointer"><X size={24} /></button>
        </div>

        {/* TABLA SCROLLEABLE */}
        <div className="overflow-y-auto custom-scrollbar flex-1 pr-2">
          {ingresos.length === 0 ? (
            <div className="text-center py-20 opacity-50 text-[var(--text-accent)]">No hay ingresos registrados aún.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[var(--bg-sidebar)] z-10">
                <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-accent)] border-b border-[var(--border)]">
                  <th className="py-4 pl-4">Fecha</th>
                  <th className="py-4">Fuente</th>
                  <th className="py-4">Cuenta Destino</th>
                  <th className="py-4">Presupuesto</th>
                  <th className="py-4 text-right pr-4">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {ingresos.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--bg-app)] transition-colors group">
                    <td className="py-4 pl-4">
                       <div className="flex items-center gap-2 font-bold text-[var(--text-main)] text-sm">
                          <Calendar size={14} className="text-[var(--text-accent)]"/>
                          {new Date(item.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                       </div>
                    </td>
                    <td className="py-4">
                       <div className="flex flex-col">
                          <span className="font-bold text-[var(--text-main)] text-sm">{item.nombre || item.categoria}</span>
                          
                          <div className="flex items-center gap-2 mt-1">
                             <span className="text-[9px] font-bold text-indigo-500 uppercase bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded">
                                {item.categoria}
                             </span>
                             {item.descripcion && (
                                <span className="text-[10px] text-[var(--text-accent)] truncate max-w-[200px]">{item.descripcion}</span>
                             )}
                          </div>
                       </div>
                    </td>
                    <td className="py-4">
                       {item.cuentas ? (
                         <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-white rounded-full p-0.5 border border-[var(--border)] shadow-sm flex items-center justify-center">
                               {item.cuentas.logo_url ? <img src={item.cuentas.logo_url} className="w-full h-full object-contain"/> : <Wallet size={12} className="text-zinc-400"/>}
                            </div>
                            <span className="text-xs font-bold text-[var(--text-main)]">{item.cuentas.nombre}</span>
                         </div>
                       ) : <span className="text-xs text-red-400">Cuenta Eliminada</span>}
                    </td>
                    <td className="py-4">
                       {item.suma_a_presupuesto ? (
                         <span className="inline-block px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-500 text-[9px] font-black uppercase tracking-wider">Sumado</span>
                       ) : (
                         <span className="inline-block px-2 py-1 rounded-md bg-[var(--bg-app)] text-[var(--text-accent)] text-[9px] font-black uppercase tracking-wider border border-[var(--border)]">Extra</span>
                       )}
                    </td>
                    <td className="py-4 pr-4 text-right">
                       <div className="flex items-center justify-end gap-3">
                           <span className="text-lg font-black text-emerald-500">+${item.monto.toLocaleString()}</span>
                           
                           <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {onEdit && <button onClick={() => onEdit(item)} className="p-1.5 text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg cursor-pointer"><Pencil size={14}/></button>}
                              {onDelete && <button onClick={() => onDelete(item)} className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg cursor-pointer"><Trash2 size={14}/></button>}
                           </div>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}