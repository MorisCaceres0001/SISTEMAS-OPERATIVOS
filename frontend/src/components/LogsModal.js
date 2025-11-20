import React, { useState, useEffect, useRef } from 'react';
import { servicesService, LogsWebSocket } from '../services/api';

const LogsModal = ({ service, onClose }) => {
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    loadLogs();
    return () => {
      stopStreaming();
    };
  }, [service]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await servicesService.getLogs(service.name, 200);
      setLogs(result.logs || 'No hay logs disponibles');
    } catch (err) {
      console.error('Error cargando logs:', err);
      setError('Error al cargar logs');
      setLogs('');
    } finally {
      setLoading(false);
    }
  };

  const startStreaming = () => {
    if (streaming) return;

    setStreaming(true);
    setError('');
    
    wsRef.current = new LogsWebSocket(
      service.name,
      (data) => {
        if (data.type === 'log') {
          setLogs((prev) => prev + data.data);
        } else if (data.type === 'error') {
          setError(data.data || data.message);
        } else if (data.type === 'stream_started') {
          console.log('Stream iniciado');
        } else if (data.type === 'stream_ended') {
          setStreaming(false);
        }
      },
      (error) => {
        console.error('Error WebSocket:', error);
        setError('Error en la conexión WebSocket');
        setStreaming(false);
      }
    );

    wsRef.current.connect();
  };

  const stopStreaming = () => {
    if (wsRef.current) {
      wsRef.current.stopStream();
      wsRef.current.disconnect();
      wsRef.current = null;
    }
    setStreaming(false);
  };

  const clearLogs = () => {
    setLogs('');
  };

  const downloadLogs = () => {
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${service.name}-logs-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-purple-600 text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Logs del Servicio</h2>
            <p className="text-sm text-purple-200">{service.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Controles */}
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex flex-wrap gap-2 items-center">
          <button
            onClick={loadLogs}
            disabled={loading || streaming}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition duration-200 disabled:opacity-50 text-sm"
          >
            ↻ Recargar
          </button>
          
          {!streaming ? (
            <button
              onClick={startStreaming}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition duration-200 text-sm"
            >
              ▶ Iniciar Stream en Tiempo Real
            </button>
          ) : (
            <button
              onClick={stopStreaming}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition duration-200 text-sm animate-pulse-fast"
            >
              ⏸ Detener Stream
            </button>
          )}

          <button
            onClick={clearLogs}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition duration-200 text-sm"
          >
            🗑 Limpiar
          </button>

          <button
            onClick={downloadLogs}
            disabled={!logs}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded transition duration-200 disabled:opacity-50 text-sm"
          >
            ⬇ Descargar
          </button>

          <label className="flex items-center space-x-2 ml-auto">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Auto-scroll</span>
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Status */}
        {streaming && (
          <div className="mx-6 mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Recibiendo logs en tiempo real...
          </div>
        )}

        {/* Logs */}
        <div className="flex-1 overflow-hidden p-6">
          <div className="bg-gray-900 text-green-400 rounded-lg p-4 h-full overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
              </div>
            ) : (
              <>
                <pre className="text-sm whitespace-pre-wrap font-mono">{logs || 'No hay logs disponibles'}</pre>
                <div ref={logsEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {logs ? `${logs.split('\n').length} líneas` : '0 líneas'}
          </div>
          <button
            onClick={onClose}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg transition duration-200"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogsModal;
