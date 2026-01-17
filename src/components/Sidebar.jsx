import { useState } from 'react';
import { Home, LayoutGrid, Smartphone, ShoppingCart, CreditCard, Calendar, List, ClipboardList, Target, Trash2 } from 'lucide-react';
import ModalReset from './ModalReset';

const menuItems = [
  { icon: Home, label: 'Inicio', id: 'dashboard' },
  { icon: LayoutGrid, label: 'Servicios', id: 'servicios' },
  { icon: Smartphone, label: 'Suscripciones', id: 'suscripciones' },
  { icon: ClipboardList, label: 'Registros', id: 'registros' },
  { icon: ShoppingCart, label: 'Lista de Compras', id: 'compras' },
  { icon: CreditCard, label: 'Cuentas', id: 'cuentas' },
  { icon: Target, label: 'Ahorros', id: 'ahorros' },
  { icon: Calendar, label: 'Estadísticas', id: 'estadisticas' },
];

export default function Sidebar({ isCollapsed, setIsCollapsed, setView, currentView }) {
  const [isResetOpen, setIsResetOpen] = useState(false);

  return (
    <aside className={`
      h-screen transition-all duration-300 border-r border-[var(--border)]
      bg-[var(--bg-sidebar)] flex flex-col shrink-0 z-40
      ${isCollapsed ? 'w-20' : 'w-64'}
    `}>
      <div className="p-4 flex-1 flex flex-col">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full mb-8 flex items-center p-3 rounded-xl cursor-pointer bg-[var(--bg-button)] text-[var(--text-main)] hover:bg-indigo-600 hover:text-white transition-all shadow-sm gap-3 justify-center md:justify-start"
        >
          <List size={20} className="shrink-0" />
          {!isCollapsed && <span className="font-bold tracking-widest text-sm uppercase">Menú</span>}
        </button>

        <nav className="space-y-2 flex-1">
          {menuItems.map((item) => (
            <div 
              key={item.label} 
              onClick={() => setView(item.id)}
              className={`
                flex items-center p-3 rounded-xl cursor-pointer transition-all group
                ${currentView === item.id ? 'bg-indigo-600 text-white shadow-md' : 'text-[var(--text-accent)] hover:bg-indigo-500/10 hover:text-indigo-500'}
                ${isCollapsed ? 'justify-center' : 'gap-4'}
              `}
            >
              <item.icon size={22} className="shrink-0" />
              {!isCollapsed && <span className="text-sm font-bold whitespace-nowrap">{item.label}</span>}
            </div>
          ))}
        </nav>
      </div>

      {/* === ZONA DE PELIGRO (AL FINAL DEL SIDEBAR) === */}
      <div className="p-4 border-t border-[var(--border)]">
         <button 
            onClick={() => setIsResetOpen(true)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 font-bold text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer ${isCollapsed ? 'justify-center' : ''}`}
            title="Borrar todos los datos"
         >
            <Trash2 size={20} />
            {!isCollapsed && <span>Resetear App</span>}
         </button>
      </div>

      <ModalReset isOpen={isResetOpen} onClose={() => setIsResetOpen(false)} />
    </aside>
  );
}