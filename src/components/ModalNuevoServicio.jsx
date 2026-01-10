import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, Save, Loader2, UploadCloud, Calendar as CalendarIcon } from 'lucide-react';

export default function ModalNuevoServicio({ isOpen, onClose, onRefresh, editingService }) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Estado inicial
  const [form, setForm] = useState({ 
    nombre: '', 
    monto: '', 
    categoria: 'Servicios', 
    frecuencia: 'mensual', 
    ultimo_pago: '', // Campo clave para el calendario
    activo: true 
  });
  
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    if (editingService) {
      setForm({
        nombre: editingService.nombre,
        monto: editingService.monto,
        categoria: editingService.categoria,
        frecuencia: editingService.frecuencia || 'mensual',
        ultimo_pago: editingService.ultimo_pago || '', // Cargar fecha existente
        activo: editingService.activo !== false
      });
      setLogoPreview(editingService.logo_url);
    } else {
      // Valores por defecto (Último pago hoy para facilitar)
      const hoy = new Date().toISOString().split('T')[0];
      setForm({ nombre: '', monto: '', categoria: 'Servicios', frecuencia: 'mensual', ultimo_pago: hoy, activo: true });
      setLogoPreview(null);
      setLogoFile(null);
    }
  }, [editingService, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const uploadLogo = async () => {
    if (!logoFile) return editingService?.logo_url || null;
    try {
      setUploading(true);
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `serv-${Date.now()}.${fileExt}`;
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
        monto: parseFloat(form.monto), 
        categoria: form.categoria, 
        frecuencia: form.frecuencia,
        ultimo_pago: form.ultimo_pago, // Guardamos la fecha del calendario
        activo: form.activo,
        logo_url: logoUrl
      };

      let error;
      if (editingService) {
        const { error: updateError } = await supabase.from('servicios').update(payload).eq('id', editingService.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.from('servicios').insert([payload]);
        error = insertError;
      }

      if (error) throw error;
      onRefresh();
      onClose();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[var(--bg-sidebar)] w-full max-w-md rounded-[2.5rem] border border-[var(--border)] shadow-2xl p-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-[var(--text-main)]">{editingService ? 'Editar Servicio' : 'Nuevo Servicio'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-button)] rounded-full text-[var(--text-accent)]"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* LOGO UPLOAD (Estilo Mind) */}
          <div className="flex justify-center">
            <label className={`relative group flex flex-col items-center justify-center w-28 h-28 border-2 border-[var(--border)] border-dashed rounded-full cursor-pointer bg-[var(--bg-app)] hover:border-indigo-500 transition-all overflow-hidden`}>
               {logoPreview ? (
                 <>
                   <img src={logoPreview} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <UploadCloud className="text-white" size={24} />
                   </div>
                 </>
               ) : (
                 <div className="text-center p-2">
                   <UploadCloud className="mx-auto text-[var(--text-accent)] mb-1" size={20} />
                   <span className="text-[9px] font-bold text-[var(--text-accent)] uppercase">Subir Logo</span>
                 </div>
               )}
               <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
          </div>

          <div className="space-y-4">
             <div>
               <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-accent)] ml-1 mb-1 block">Nombre</label>
               <input required value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej: Netflix" />
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-accent)] ml-1 mb-1 block">Monto ($)</label>
                  <input type="number" step="0.01" required value={form.monto} onChange={(e) => setForm({...form, monto: e.target.value})} className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-accent)] ml-1 mb-1 block">Frecuencia</label>
                   <select value={form.frecuencia} onChange={(e) => setForm({...form, frecuencia: e.target.value})} className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500 h-[58px]">
                    <option value="mensual">Mensual</option>
                    <option value="quincenal">Quincenal</option>
                  </select>
                </div>
             </div>

             {/* CALENDARIO DE ÚLTIMO PAGO */}
             <div className="bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">
                   <CalendarIcon size={14} /> Fecha del último pago
                </label>
                <input 
                  type="date" 
                  required 
                  value={form.ultimo_pago} 
                  onChange={(e) => setForm({...form, ultimo_pago: e.target.value})} 
                  className="w-full bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-xl p-3 font-bold text-[var(--text-main)] outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer" 
                />
                <p className="text-[10px] text-[var(--text-accent)] mt-2 leading-tight">
                  Calcularemos la fecha de vencimiento automáticamente sumando la frecuencia a esta fecha.
                </p>
             </div>
          </div>

          <button disabled={loading || uploading} className="w-full bg-indigo-600 text-white py-4 rounded-3xl font-black flex justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 mt-4">
            {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> GUARDAR SERVICIO</>}
          </button>
        </form>
      </div>
    </div>
  );
}