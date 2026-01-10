import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, Save, Loader2, CreditCard, UploadCloud } from 'lucide-react';

export default function ModalNuevaCuenta({ isOpen, onClose, onRefresh, editingAccount }) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [form, setForm] = useState({ 
    nombre: '', 
    tipo: 'debito', 
    color: 'black'
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // EFECTO PARA CARGAR DATOS SI ES EDICIÓN
  useEffect(() => {
    if (editingAccount) {
        setForm({
            nombre: editingAccount.nombre,
            tipo: editingAccount.tipo,
            color: editingAccount.color
        });
        setLogoPreview(editingAccount.logo_url);
    } else {
        // Limpiar si es nueva
        setForm({ nombre: '', tipo: 'debito', color: 'black' });
        setLogoPreview(null);
    }
    setLogoFile(null);
  }, [editingAccount, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const uploadLogo = async () => {
    if (!logoFile) return editingAccount?.logo_url || null; // Si no hay archivo nuevo, devuelve el viejo
    try {
      setUploading(true);
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `bank-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('logos').upload(filePath, logoFile);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('logos').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error(error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const logoUrl = await uploadLogo();
      
      const payload = {
        nombre: form.nombre,
        tipo: form.tipo,
        color: form.color,
        logo_url: logoUrl
      };

      if (editingAccount) {
         // ACTUALIZAR
         const { error } = await supabase.from('cuentas').update(payload).eq('id', editingAccount.id);
         if (error) throw error;
      } else {
         // CREAR (Se agrega saldo inicial 0 por defecto en DB)
         const { error } = await supabase.from('cuentas').insert([{ ...payload, saldo: 0 }]);
         if (error) throw error;
      }

      onRefresh();
      onClose();
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const cardStyles = [
    { id: 'black', class: 'bg-zinc-900' },
    { id: 'blue', class: 'bg-blue-600' },
    { id: 'purple', class: 'bg-purple-600' },
    { id: 'emerald', class: 'bg-emerald-600' },
    { id: 'rose', class: 'bg-rose-600' },
    { id: 'orange', class: 'bg-orange-500' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[var(--bg-sidebar)] w-full max-w-md rounded-[2.5rem] border border-[var(--border)] shadow-2xl p-8 animate-in zoom-in-95">
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-[var(--text-main)] flex items-center gap-2">
             <CreditCard className="text-indigo-500" /> {editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-button)] rounded-full text-[var(--text-accent)] cursor-pointer"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* UPLOADER IGUAL QUE ANTES... */}
          <div className="flex justify-center mb-4">
            <label className={`relative group flex flex-col items-center justify-center w-24 h-24 border-2 border-[var(--border)] border-dashed rounded-2xl cursor-pointer bg-[var(--bg-app)] hover:border-indigo-500 transition-all overflow-hidden shadow-inner`}>
               {logoPreview ? (
                 <>
                   <img src={logoPreview} className="w-full h-full object-contain p-2" alt="Logo Preview" />
                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <UploadCloud className="text-white" size={24} />
                   </div>
                 </>
               ) : (
                 <div className="text-center p-2">
                   <UploadCloud className="mx-auto text-[var(--text-accent)] mb-1" size={20} />
                   <span className="text-[8px] font-bold text-[var(--text-accent)] uppercase">Logo Banco</span>
                 </div>
               )}
               <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
          </div>

          <div>
             <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-accent)] ml-1 mb-1 block">Nombre del Banco</label>
             <input autoFocus required value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-2xl p-4 font-bold text-[var(--text-main)] outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Ej: Banco Agrícola" />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-accent)] ml-1 mb-1 block">Tipo</label>
               <select value={form.tipo} onChange={(e) => setForm({...form, tipo: e.target.value})} className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-2xl p-4 font-bold text-[var(--text-main)] outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer h-[58px]">
                 <option value="debito">Débito</option>
                 <option value="credito">Crédito</option>
                 <option value="efectivo">Efectivo</option>
                 <option value="ahorro">Ahorro</option>
               </select>
             </div>
             <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-accent)] ml-1 mb-2 block">Color Tarjeta</label>
                <div className="flex gap-2 flex-wrap items-center h-[58px]">
                   {cardStyles.map((c) => (
                      <button 
                        key={c.id} 
                        type="button"
                        onClick={() => setForm({...form, color: c.id})}
                        className={`w-8 h-8 rounded-full cursor-pointer transition-transform border-2 border-transparent ${c.class} ${form.color === c.id ? 'ring-2 ring-offset-2 ring-[var(--text-main)] scale-110 shadow-lg' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                      />
                   ))}
                </div>
             </div>
          </div>

          <button disabled={loading || uploading} className="w-full bg-indigo-600 text-white py-4 rounded-3xl font-black flex justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 cursor-pointer disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> {editingAccount ? 'ACTUALIZAR' : 'GUARDAR'}</>}
          </button>
        </form>
      </div>
    </div>
  );
}