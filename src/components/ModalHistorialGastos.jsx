import { X, TrendingDown, Calendar, Wallet, Pencil, Trash2, Eye } from 'lucide-react';

export default function ModalHistorialGastos({ isOpen, onClose, gastos, onEdit, onDelete, onViewSplit }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[var(--bg-sidebar)] w-full max-w-4xl rounded-[2.5rem] border border-[var(--border)] shadow-2xl p-8 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h3 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-3">
             <div className="p-2 bg-red-500/10 rounded-xl text-red-500"><TrendingDown size={24} /></div>
             Historial de Gastos
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-button)] rounded-full text-[var(--text-accent)] cursor-pointer"><X size={24} /></button>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1 pr-2">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[var(--bg-sidebar)] z-10">
                <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-accent)] border-b border-[var(--border)]">
                  <th className="py-4 pl-4">Fecha</th>
                  <th className="py-4">Concepto</th>
                  <th className="py-4">Cuenta</th>
                  <th className="py-4 text-right pr-4">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {gastos.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--bg-app)] transition-colors group">
                    <td className="py-4 pl-4">
                       <div className="flex items-center gap-2 font-bold text-[var(--text-main)] text-sm">
                          <Calendar size={14} className="text-[var(--text-accent)]"/>
                          {new Date(item.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                       </div>
                    </td>
                    <td className="py-4">
                       <div className="flex flex-col">
                          <span className="font-bold text-[var(--text-main)] capitalize">{item.descripcion || item.tipo}</span>
                          <span className="text-[9px] text-[var(--text-accent)] uppercase bg-[var(--bg-app)] px-1 py-0.5 rounded w-fit">{item.tipo}</span>
                       </div>
                    </td>
                    <td className="py-4">
                       {item.cuentas && (
                         <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-white rounded-full p-0.5 border border-[var(--border)] shadow-sm flex items-center justify-center">
                               {item.cuentas.logo_url ? <img src={item.cuentas.logo_url} className="w-full h-full object-contain"/> : <Wallet size={12} className="text-zinc-400"/>}
                            </div>
                            <span className="text-xs font-bold text-[var(--text-main)] truncate max-w-[100px]">{item.cuentas.nombre}</span>
                         </div>
                       )}
                    </td>
                    <td className="py-4 pr-4 text-right">
                       <div className="flex items-center justify-end gap-3">
                           <span className="text-lg font-black text-red-500">-${item.monto.toLocaleString()}</span>
                           
                           <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {item.deudas && item.deudas.length > 0 && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onViewSplit(item); }} 
                                  className="p-1.5 text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg cursor-pointer"
                                  title="Ver División"
                                >
                                  <Eye size={14} />
                                </button>
                              )}
                              {onEdit && <button onClick={() => onEdit(item)} className="p-1.5 text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg cursor-pointer"><Pencil size={14}/></button>}
                              {onDelete && <button onClick={() => onDelete(item)} className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg cursor-pointer"><Trash2 size={14}/></button>}
                           </div>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}