import { useCallback, useEffect, useMemo, useState } from 'react';
import { getLimite } from '../eventoService';
import { LIMITE_POR_DEFECTO, LimiteContexto } from '../limiteContexto';

function LimiteProvider({ children }) {
  const [limite, setLimite] = useState(null);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    let activo = true;
    getLimite()
      .then((d) => activo && setLimite(Number(d.limite_horas_diarias) || LIMITE_POR_DEFECTO))
      .catch(() => activo && setLimite(null)) // sin endpoint aún: no se muestra la cifra
      .finally(() => activo && setCargado(true));
    return () => {
      activo = false;
    };
  }, []);

  const actualizar = useCallback((horas) => setLimite(horas), []);
  const valor = useMemo(() => ({ limite, cargado, actualizar }), [limite, cargado, actualizar]);
  return <LimiteContexto.Provider value={valor}>{children}</LimiteContexto.Provider>;
}

export default LimiteProvider;
