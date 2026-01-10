import { useState } from 'react';
import { X, Save, DollarSign } from 'lucide-react';

export default function ModalConfigurarIngreso({ isOpen, onClose, onSave, currentIncome }) {
  const [income, setIncome] = useState(currentIncome);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(Number(income));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[var(--bg-sidebar)] w-full max-w-md rounded-[2.5rem] border border-[var(--border)] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-indigo-600 rounded-full" />
            <h3 className="text-xl font-black text-[var(--text-main)]">Configurar Ingreso</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-button)] rounded-full transition-colors cursor-pointer text-[var(--text-accent)]">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-accent)] mb-2 block">Ingreso Mensual Total</label>
            <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-accent)] text-xl font-bold">$</span>
                <input 
                type="number" required min="0" step="0.01"
                value={income || ''}
                onChange={(e) => setIncome(e.target.value)}
                className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-2xl py-5 pl-12 pr-6 text-3xl font-black outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all text-[var(--text-main)]"
                placeholder="0.00"
                />
            </div>
          </div>

          <button 
            className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shadow-xl shadow-indigo-500/20"
          >
            <Save size={20} /> GUARDAR INGRESO
          </button>
        </form>
      </div>
    </div>
  );
}