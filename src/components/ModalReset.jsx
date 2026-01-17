import { useState } from 'react';
import { resetearAplicacion } from '../lib/resetService';
import { AlertTriangle, Trash2, Loader2, X } from 'lucide-react';

export default function ModalReset({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const PALABRA_CLAVE = "BORRAR TODO";

  const handleReset = async () => {
    if (confirmText !== PALABRA_CLAVE) return;
    
    setLoading(true);
    try {
      await resetearAplicacion();
      
      // Forzar recarga completa de la página para limpiar estados en memoria
      window.location.reload(); 
    } catch (error) {
      alert("Error al resetear: " + error.message);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-[var(--bg-sidebar)] w-full max-w-md rounded-[2.5rem] border-2 border-red-500/50 shadow-2xl p-8 relative overflow-hidden">
        
        {/* Fondo decorativo de alerta */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>
        
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-[var(--bg-app)] rounded-full text-[var(--text-accent)] transition-colors"><X size={24} /></button>

        <div className="flex flex-col items-center text-center mb-6">
           <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-500 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
              <AlertTriangle size={32} strokeWidth={2.5} />
           </div>
           <h3 className="text-2xl font-black text-[var(--text-main)] mb-2">¿Zona de Peligro?</h3>
           <p className="text-sm font-medium text-[var(--text-accent)] leading-relaxed">
             Estás a punto de borrar <b>todos los movimientos, historial y deudas</b>. Tus cuentas volverán a $0.00.
             <br/><br/>
             <span className="text-red-500 font-bold">Esta acción no se puede deshacer.</span>
           </p>
        </div>

        <div className="space-y-4">
           <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-accent)] mb-2 block">
                 Escribe "{PALABRA_CLAVE}" para confirmar
              </label>
              <input 
                type="text" 
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder={PALABRA_CLAVE}
                className="w-full bg-[var(--bg-app)] border-2 border-red-500/30 focus:border-red-500 rounded-xl p-4 font-black text-center text-red-500 outline-none transition-all placeholder:text-red-500/20"
                autoFocus
              />
           </div>

           <button 
             onClick={handleReset}
             disabled={loading || confirmText !== PALABRA_CLAVE}
             className="w-full bg-red-600 text-white py-4 rounded-xl font-black flex justify-center gap-2 hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {loading ? <Loader2 className="animate-spin" /> : <><Trash2 size={20} /> BORRAR TODO AHORA</>}
           </button>
        </div>

      </div>
    </div>
  );
}