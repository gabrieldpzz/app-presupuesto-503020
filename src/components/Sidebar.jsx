import { Home, Smartphone, ShoppingCart, CreditCard, Calendar, List } from 'lucide-react';

const menuItems = [
  { icon: Home, label: 'Servicios', id: 'servicios' },
  { icon: Smartphone, label: 'Suscripciones', id: 'calculadora' },
  { icon: ShoppingCart, label: 'Lista de Compras', id: 'calculadora' },
  { icon: CreditCard, label: 'Cuentas', id: 'calculadora' },
  { icon: Calendar, label: 'Estadísticas', id: 'calculadora' },
];

export default function Sidebar({ isCollapsed, setIsCollapsed, setView, currentView }) {
  return (
    <aside className={`
      h-screen transition-all duration-300 border-r border-[var(--border)]
      bg-[var(--bg-sidebar)] flex flex-col shrink-0
      ${isCollapsed ? 'w-20' : 'w-64'}
    `}>
      <div className="p-4">
        {/* BOTÓN MENÚ INTERACTIVO */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full mb-8 flex items-center p-3 rounded-xl cursor-pointer bg-[var(--bg-button)] text-[var(--text-main)] hover:bg-indigo-600 hover:text-white transition-all shadow-sm gap-3 justify-center md:justify-start"
        >
          <List size={20} className="shrink-0" />
          {!isCollapsed && <span className="font-bold tracking-widest text-sm uppercase">Menú</span>}
        </button>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <div 
              key={item.label} 
              onClick={() => setView(item.id)}
              className={`
                flex items-center p-3 rounded-xl cursor-pointer transition-all group
                ${currentView === item.id && item.id !== 'calculadora' ? 'bg-indigo-500 text-white' : 'text-[var(--text-accent)] hover:bg-indigo-500/10 hover:text-indigo-500'}
                ${isCollapsed ? 'justify-center' : 'gap-4'}
              `}
            >
              <item.icon size={22} className="shrink-0" />
              {!isCollapsed && <span className="text-sm font-semibold whitespace-nowrap">{item.label}</span>}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}