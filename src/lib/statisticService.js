import { supabase } from './supabaseClient';

export async function obtenerDatosEstadisticas(mes, anio) {
  const primerDia = new Date(anio, mes, 1).toISOString();
  const ultimoDia = new Date(anio, mes + 1, 0).toISOString();

  try {
    // 1. TRAER GASTOS RÁPIDOS (Con datos de cuenta)
    const { data: gastosRapidos } = await supabase
      .from('gastos')
      .select('*, cuentas(nombre, logo_url, color)')
      .gte('fecha', primerDia)
      .lte('fecha', ultimoDia);
    
    // 2. TRAER HISTORIAL (Con datos de cuenta)
    const { data: historial } = await supabase
      .from('historial_pagos')
      .select(`
        id, monto, fecha_pago, tipo, 
        servicios(nombre), suscripciones(nombre),
        cuentas(nombre, logo_url, color)
      `)
      .gte('fecha_pago', primerDia)
      .lte('fecha_pago', ultimoDia);

    // 3. TRAER INGRESOS (Con datos de cuenta)
    const { data: ingresos } = await supabase
      .from('ingresos')
      .select('*, cuentas(nombre, logo_url, color)')
      .gte('fecha', primerDia)
      .lte('fecha', ultimoDia);

    // 2. PROCESAR INGRESOS (Categorías)
    let totalIngresos = 0;
    let catIngresos = {};

    const listaIngresos = ingresos || [];
    listaIngresos.forEach(i => {
        totalIngresos += i.monto;
        const cat = i.categoria || 'Otros';
        catIngresos[cat] = (catIngresos[cat] || 0) + i.monto;
    });

    const ingresosPorCategoria = Object.entries(catIngresos)
        .map(([nombre, total]) => ({ nombre, total }))
        .sort((a, b) => b.total - a.total);

    // 3. PROCESAR GASTOS (Categorías y Tipos)
    let porTipo = { necesidad: 0, deseo: 0, ahorro: 0 };
    let catGastos = {};
    let totalGastos = 0;

    // A. Gastos Rápidos
    const listaGastosRapidos = gastosRapidos || [];
    listaGastosRapidos.forEach(g => {
       totalGastos += g.monto;
       porTipo[g.tipo] += g.monto;
       const cat = g.categoria || 'Varios';
       catGastos[cat] = (catGastos[cat] || 0) + g.monto;
    });

    // B. Servicios y Suscripciones
    const listaHistorial = historial || [];
    listaHistorial.forEach(h => {
       totalGastos += h.monto;
       let tipoReal = h.tipo === 'suscripcion' ? 'deseo' : 'necesidad';
       let catReal = h.tipo === 'suscripcion' ? 'Suscripciones' : 'Servicios';
       
       porTipo[tipoReal] += h.monto;
       catGastos[catReal] = (catGastos[catReal] || 0) + h.monto;
    });

    const gastosPorCategoria = Object.entries(catGastos)
        .map(([nombre, total]) => ({ nombre, total }))
        .sort((a, b) => b.total - a.total);

    // 4. CREAR "SÚPER LISTA" (Agregando campo 'cuenta')
    const movsIngresos = listaIngresos.map(i => ({
        id: i.id,
        fecha: i.fecha,
        descripcion: i.nombre || i.categoria,
        monto: i.monto,
        tipoMovimiento: 'ingreso',
        categoria: i.categoria,
        cuenta: i.cuentas
    }));

    const movsGastos = listaGastosRapidos.map(g => ({
        id: g.id,
        fecha: g.fecha,
        descripcion: g.descripcion || g.tipo,
        monto: g.monto,
        tipoMovimiento: 'gasto',
        categoria: g.categoria,
        cuenta: g.cuentas
    }));

    const movsPagos = listaHistorial.map(h => ({
        id: h.id,
        fecha: h.fecha_pago,
        descripcion: h.servicios?.nombre || h.suscripciones?.nombre || 'Pago',
        monto: h.monto,
        tipoMovimiento: 'gasto',
        categoria: h.tipo === 'servicio' ? 'Servicio' : 'Suscripción',
        cuenta: h.cuentas
    }));

    const flujoGlobal = [...movsIngresos, ...movsGastos, ...movsPagos]
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    return {
        ingresos: totalIngresos,
        gastos: totalGastos,
        balance: totalIngresos - totalGastos,
        porTipo,
        ingresosPorCategoria,
        gastosPorCategoria,
        flujoGlobal
    };

  } catch (error) {
    console.error(error);
    return null;
  }
}