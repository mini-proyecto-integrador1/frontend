import { useEffect, useRef, useState } from 'react';

function AlturaAnimada({ children }) {
  const interior = useRef(null);
  const [alto, setAlto] = useState('auto');

  useEffect(() => {
    const observador = new ResizeObserver(([entrada]) => {
      setAlto(entrada.target.offsetHeight);
    });
    observador.observe(interior.current);
    return () => observador.disconnect();
  }, []);

  return (
    <div
      className="-m-1 overflow-hidden p-1 transition-[height] duration-700 ease-in-out motion-reduce:transition-none"
      style={{ height: alto === 'auto' ? 'auto' : alto + 8 }}
    >
      <div ref={interior}>{children}</div>
    </div>
  );
}

export default AlturaAnimada;