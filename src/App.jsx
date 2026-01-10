import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import { Wallet, Menu, Sun, Moon } from 'lucide-react';

function App() {
  const [isOpen, setIsOpen] = useState(false); // Móvil
  const [isCollapsed, setIsCollapsed] = useState(false); // PC
  const [darkMode, setDarkMode] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <div className="flex min-h-screen bg-white dark:bg-zinc-950 transition-colors duration-300">
      <Sidebar 
        isOpen={isOpen} 
        setIsOpen={setIsOpen} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
      />

      <div className="flex-1 flex flex-col">
        {/* Navbar Superior Global */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6">
          <button onClick={() => setIsOpen(true)} className="md:hidden p-2 text-zinc-600 dark:text-zinc-400">
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs font-medium text-zinc-400 mr-2">TEMA:</span>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded-full text-zinc-600 dark:text-zinc-300 hover:ring-2 hover:ring-indigo-500 transition-all"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 flex flex-col items-center justify-center">
          {/* Tu calculadora aquí (usa el código previo) */}
          <div className="w-full max-w-md bg-zinc-50 dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
             <h1 className="text-xl font-bold dark:text-white flex items-center gap-2 mb-6">
                <Wallet className="text-indigo-600"/> Calculadora 50-30-20
             </h1>
             <input 
                type="number" 
                onChange={(e) => setTotal(Number(e.target.value))}
                placeholder="Ingresa tu sueldo..."
                className="w-full p-4 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
             />
             <div className="mt-6 space-y-3">
                <div className="flex justify-between p-4 bg-blue-500/10 rounded-2xl text-blue-600 font-bold">
                  <span>Necesidades</span>
                  <span>${(total * 0.5).toLocaleString()}</span>
                </div>
                {/* ... Repetir para Deseos y Ahorro */}
             </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;