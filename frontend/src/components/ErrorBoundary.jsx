import React from 'react';
import { useRouteError, useNavigate } from 'react-router-dom';

export default function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  const status = error && error.status ? error.status : null;
  const message = error && (error.statusText || error.message) ? (error.statusText || error.message) : 'Se produjo un error inesperado.';

  return (
    <div style={{ padding: 24 }}>
      <h1>Oops — ocurrió un error</h1>
      {status && <p><strong>Código:</strong> {status}</p>}
      <p><strong>Mensaje:</strong> {message}</p>
      <div style={{ marginTop: 16 }}>
        <button onClick={() => navigate(-1)} aria-label="Volver" style={{ marginRight: 8 }}>Volver</button>
        <button onClick={() => navigate('/')}>Ir al inicio</button>
      </div>
      <details style={{ marginTop: 16, whiteSpace: 'pre-wrap' }}>
        <summary>Detalles (para desarrolladores)</summary>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </details>
    </div>
  );
}
