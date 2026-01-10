import { supabase } from './supabaseClient';

export async function obtenerDatosEstadisticas(mes, anio) {
  // Calcular rango de fechas
  const primerDia = new Date(anio, mes, 1).toISOString();
  const ultimoDia = new Date(anio, mes + 1, 0).toISOString();

  try {
    // 1. TRAER GASTOS RÁPIDOS (Tabla 'gastos')
    const { data: gastosRapidos } = await supabase
      .from('gastos')
      .select('*')
      .gte('fecha', primerDia)
      .lte('fecha', ultimoDia);

    // 2. TRAER PAGOS DE SERVICIOS Y SUSCRIPCIONES (Tabla 'historial_pagos')
    // Necesitamos saber si fue servicio (Necesidad) o suscripción (Deseo)
    const { data: historial } = await supabase
      .from('historial_pagos')
      .select(`
        monto,
        fecha_pago,
        tipo,
        servicios ( nombre, logo_url ),
        suscripciones ( nombre, logo_url )
      `)
      .gte('fecha_pago', primerDia)
      .lte('fecha_pago', ultimoDia);

    // 3. TRAER INGRESOS (Para calcular el ahorro real y balance)
    const { data: ingresos } = await supabase
      .from('ingresos')
      .select('monto, categoria')
      .gte('fecha', primerDia)
      .lte('fecha', ultimoDia);

    // 4. PROCESAR Y UNIFICAR DATOS
    let totalIngresos = ingresos?.reduce((acc, curr) => acc + curr.monto, 0) || 0;
    
    // Estructuras para gráficas
    let porTipo = { necesidad: 0, deseo: 0, ahorro: 0 };
    let porCategoria = {};

    // A. Procesar Gastos Rápidos
    gastosRapidos?.forEach(g => {
       // Sumar por Tipo (50/30/20)
       if (porTipo[g.tipo] !== undefined) porTipo[g.tipo] += g.monto;
       
       // Sumar por Categoría
       const cat = g.categoria || 'Varios';
       porCategoria[cat] = (porCategoria[cat] || 0) + g.monto;
    });

    // B. Procesar Historial (Servicios/Subs)
    historial?.forEach(h => {
       // Mapear Tipo
       // servicio -> necesidad
       // suscripcion -> deseo
       let tipoReal = 'necesidad';
       let catReal = 'Servicios';
       let nombre = 'Gasto';

       if (h.tipo === 'suscripcion') {
          tipoReal = 'deseo';
          catReal = 'Suscripciones';
          nombre = h.suscripciones?.nombre;
       } else {
          nombre = h.servicios?.nombre;
       }

       // Sumar
       porTipo[tipoReal] += h.monto;
       porCategoria[catReal] = (porCategoria[catReal] || 0) + h.monto;
    });

    // Convertir objeto categorías a array ordenado para gráficas
    const categoriasArray = Object.entries(porCategoria)
        .map(([nombre, total]) => ({ nombre, total }))
        .sort((a, b) => b.total - a.total); // Ordenar mayor a menor

    const totalGastado = porTipo.necesidad + porTipo.deseo + porTipo.ahorro;

    return {
        ingresos: totalIngresos,
        gastos: totalGastado,
        balance: totalIngresos - totalGastado,
        porTipo,
        porCategoria: categoriasArray
    };

  } catch (error) {
    console.error("Error calculando estadísticas:", error);
    return null;
  }
}