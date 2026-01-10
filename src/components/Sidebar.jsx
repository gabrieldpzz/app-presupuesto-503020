import { 
  Home, Smartphone, ShoppingCart, 
  CreditCard, Calendar, List, X,
  ChevronLeft, ChevronRight
} from 'lucide-react';

const menuItems = [
  { icon: Home, label: 'Servicios' },
  { icon: Smartphone, label: 'Suscripciones' },
  { icon: ShoppingCart, label: 'Lista de Compras' },
  { icon: CreditCard, label: 'Cuentas' },
  { icon: Calendar, label: 'Estadísticas Mensuales' },
];

export default function Sidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }) {
  return (
    <>
      {/* Overlay Móvil */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`
        fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out
        bg-zinc-100 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:static
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
      `}>
        {/* Botón Colapsar (Solo PC) */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3 top-10 bg-indigo-600 text-white rounded-full p-1 border-2 border-white dark:border-zinc-950"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="p-4">
          <div className={`bg-zinc-800 text-white rounded-xl p-3 flex items-center transition-all ${isCollapsed ? 'justify-center' : 'gap-3'} mb-8`}>
            <List size={20} className="text-zinc-400 shrink-0" />
            {!isCollapsed && <span className="font-bold tracking-widest text-sm">MENÚ</span>}
          </div>

          <nav className="space-y-4">
            {menuItems.map((item, index) => (
              <a 
                key={index} 
                href="#" 
                className={`flex items-center text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-white group transition-all ${isCollapsed ? 'justify-center' : 'gap-4'}`}
                title={isCollapsed ? item.label : ""}
              >
                <item.icon size={22} className="shrink-0 group-hover:scale-110 transition-transform" />
                {!isCollapsed && (
                  <span className="text-sm font-medium border-b border-transparent group-hover:border-indigo-500 pb-0.5 whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </a>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}