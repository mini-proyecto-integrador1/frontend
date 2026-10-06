import { createContext, useContext } from 'react';

// Límite diario del organizador, compartido por el encabezado, Hoy y los modales.
// { limite: number | null, cargado: boolean, actualizar(horas) }
export const LimiteContexto = createContext({ limite: null, cargado: false, actualizar: () => {} });
export const useLimite = () => useContext(LimiteContexto);
export const LIMITE_POR_DEFECTO = 6;
