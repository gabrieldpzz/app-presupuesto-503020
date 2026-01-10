import { X, AlertTriangle } from 'lucide-react';

export default function ModalConfirmacion({ isOpen, onClose, onConfirm, titulo, mensaje }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--bg-sidebar)] w-full max-w-sm rounded-[2rem] border border-[var(--border)] shadow-2xl p-6 animate-in zoom-in-95">
        
        <div className="flex justify-center mb-4">
           <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500">
              <AlertTriangle size={24} />
           </div>
        </div>

        <h3 className="text-xl font-black text-center text-[var(--text-main)] mb-2">{titulo}</h3>
        <p className="text-center text-[var(--text-accent)] text-sm mb-6 font-medium leading-relaxed">
          {mensaje}
        </p>

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-[var(--text-main)] bg-[var(--bg-app)] hover:bg-[var(--bg-button)] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }}
            className="flex-1 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 cursor-pointer"
          >
            Confirmar
          </button>
        </div>

      </div>
    </div>
  );
}