/** Fondo marino animado para páginas de autenticación. */
export function OceanBackground() {
  return (
    <>
      <div className="ocean-wave ocean-wave-1" aria-hidden="true" />
      <div className="ocean-wave ocean-wave-2" aria-hidden="true" />
      <div className="ocean-wave ocean-wave-3" aria-hidden="true" />
      <div className="ocean-bubbles" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
    </>
  );
}
