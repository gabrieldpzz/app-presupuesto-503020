import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Servicios from './views/Servicios'; // Asegúrate de crear esta carpeta/archivo
import { Wallet, Sun, Moon, TrendingUp, Coffee, Smartphone } from 'lucide-react';

function App() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [view, setView] = useState('calculadora');
  const [total, setTotal] = useState(0);

  // Manejo de Tema (Dark/Light)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--bg-app)]">
      
      {/* 1. SIDEBAR (Navegación y Colapso) */}
      <Sidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        setView={setView} 
        currentView={view}
      />

      {/* 2. CONTENIDO PRINCIPAL (Flex Column) */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* HEADER GLOBAL */}
        <header className="h-16 flex items-center justify-end px-8 border-b border-[var(--border)] bg-[var(--bg-sidebar)] shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-[var(--text-accent)] tracking-[0.2em] hidden sm:block">
              {darkMode ? 'MODO OSCURO' : 'MODO CLARO'}
            </span>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-full bg-[var(--bg-button)] text-[var(--text-main)] cursor-pointer hover:scale-110 transition-all shadow-sm border border-[var(--border)]"
            >
              {darkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-indigo-600" />}
            </button>
          </div>
        </header>

        {/* ZONA DE VISTAS (Scrollable) */}
        <main className="flex-1 overflow-auto bg-[var(--bg-app)]">
          {view === 'calculadora' && (
            <div className="h-full flex items-center justify-center p-6">
              <CalculadoraView total={total} setTotal={setTotal} />
            </div>
          )}
          
          {view === 'servicios' && (
            <div className="p-4 md:p-8 max-w-7xl mx-auto">
              <Servicios />
            </div>
          )}

          {/* Placeholder para otras vistas */}
          {view !== 'calculadora' && view !== 'servicios' && (
            <div className="h-full flex items-center justify-center text-[var(--text-accent)] italic">
              Sección {view} en desarrollo...
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTE: VISTA CALCULADORA 50-30-20 ---
function CalculadoraView({ total, setTotal }) {
  return (
    <div className="w-full max-w-md bg-[var(--bg-sidebar)] p-10 rounded-[3rem] border border-[var(--border)] shadow-2xl animate-in zoom-in-95 duration-300">
      <div className="flex items-center gap-4 mb-10">
        <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/40">
          <Wallet size={28} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight leading-none">Presupuesto</h1>
          <p className="text-[10px] font-bold text-indigo-500 tracking-[0.2em] mt-1">REGLA 50-30-20</p>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-accent)] mb-3 block">
            Ingreso Mensual Disponible
          </label>
          <div className="relative">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-accent)] text-xl font-bold">$</span>
            <input 
              type="number" 
              value={total || ''}
              onChange={(e) => setTotal(Number(e.target.value))}
              className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-2xl py-5 pl-12 pr-6 text-3xl font-black outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all text-[var(--text-main)]"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="space-y-4">
          <SummaryCard 
            title="Necesidades" 
            val={total * 0.5} 
            icon={<Smartphone size={16}/>}
            sub="50% - Gastos Vitales" 
            color="text-indigo-500" 
            bg="bg-indigo-500/10" 
          />
          <SummaryCard 
            title="Deseos" 
            val={total * 0.3} 
            icon={<Coffee size={16}/>}
            sub="30% - Estilo de Vida" 
            color="text-purple-500" 
            bg="bg-purple-500/10" 
          />
          <SummaryCard 
            title="Ahorro" 
            val={total * 0.2} 
            icon={<TrendingUp size={16}/>}
            sub="20% - Futuro e Inversión" 
            color="text-emerald-500" 
            bg="bg-emerald-500/10" 
          />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, val, icon, sub, color, bg }) {
  return (
    <div className={`p-5 rounded-3xl border border-[var(--border)] ${bg} flex justify-between items-center transition-transform hover:scale-[1.02]`}>
      <div className="flex items-center gap-4">
        <div className={`${color} opacity-80`}>{icon}</div>
        <div>
          <h4 className={`text-xs font-black uppercase tracking-widest ${color}`}>{title}</h4>
          <p className="text-[10px] text-[var(--text-accent)] font-medium mt-0.5">{sub}</p>
        </div>
      </div>
      <span className="text-2xl font-black text-[var(--text-main)]">
        ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>
  );
}

export default App;