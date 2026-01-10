import { supabase } from './supabaseClient';

// Obtener todas las metas
export async function getMetas() {
  const { data, error } = await supabase.from('metas_ahorro').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

// Crear nueva meta
export async function crearMeta(datos) {
  const { error } = await supabase.from('metas_ahorro').insert([datos]);
  if (error) throw error;
  return true;
}

// Eliminar meta
export async function eliminarMeta(id) {
    const { error } = await supabase.from('metas_ahorro').delete().eq('id', id);
    if (error) throw error;
    return true;
}

/**
 * APORTAR AHORRO (La función clave del Botón Rápido)
 * 1. Resta dinero de la Cuenta de Origen.
 * 2. Suma dinero a la Meta.
 * 3. Registra un "Gasto" tipo 'ahorro' para que cuente en el 50/30/20.
 */
export async function depositarAhorro(metaId, cuentaId, monto, fecha) {
  try {
    // 1. Validar Saldo Cuenta
    const { data: cuenta } = await supabase.from('cuentas').select('saldo').eq('id', cuentaId).single();
    if (cuenta.saldo < monto) throw new Error("Saldo insuficiente en la cuenta de origen.");

    // 2. Obtener Meta actual
    const { data: meta } = await supabase.from('metas_ahorro').select('ahorro_actual, nombre').eq('id', metaId).single();

    // 3. ACTUALIZACIONES (Idealmente sería una transacción, lo haremos secuencial)
    
    // A. Restar de Cuenta
    await supabase.from('cuentas').update({ saldo: cuenta.saldo - monto }).eq('id', cuentaId);

    // B. Sumar a Meta
    await supabase.from('metas_ahorro').update({ ahorro_actual: meta.ahorro_actual + monto }).eq('id', metaId);

    // C. Registrar en Historial de Gastos (como tipo 'ahorro')
    // Esto hace que aparezca en tu gráfica de Presupuesto automáticamente.
    await supabase.from('gastos').insert([{
        monto: monto,
        tipo: 'ahorro',
        descripcion: `Aporte a: ${meta.nombre}`,
        cuenta_id: cuentaId,
        fecha: fecha
    }]);

    return true;
  } catch (error) {
    console.error(error);
    throw error;
  }
}