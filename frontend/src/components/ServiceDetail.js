import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getServiceStatus,
  getServiceLogs,
  startService,
  stopService,
  restartService,
} from '../services/api';
import Modal from './Modal';

function ServiceDetail() {
  const { serviceName } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [logs, setLogs] = useState('');
  const [liveLogs, setLiveLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveMode, setLiveMode] = useState(false);
  const [actionModal, setActionModal] = useState({ open: false, action: null });
  const wsRef = useRef(null);
  const logsEndRef = useRef(null);

  useEffect(() => {
    loadServiceData();
    return () => {
      disconnectWebSocket();
    };
  }, [serviceName]);

  useEffect(() => {
    if (liveMode) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }
  }, [liveMode]);

  useEffect(() => {
    scrollToBottom();
  }, [liveLogs]);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadServiceData = async () => {
    setLoading(true);
    try {
      const [statusRes, logsRes] = await Promise.all([
        getServiceStatus(serviceName),
        getServiceLogs(serviceName, 100),
      ]);
      setStatus(statusRes.data.status);
      setLogs(logsRes.data.logs);
    } catch (error) {
      console.error('Error loading service data:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    const token = localStorage.getItem('token');
    // Prefer explicit env var; otherwise use the proxied path `/logs-ws` so CRA
    // forwards the WebSocket to the backend. This avoids HMR socket collisions
    // while keeping the request relative to the frontend origin.
    const wsUrl = process.env.REACT_APP_WS_URL ||
      (window.location.origin.replace(/^http/, 'ws') + '/logs-ws');

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
      wsRef.current.send(
        JSON.stringify({
          type: 'subscribe',
          service: serviceName,
          token: token,
        })
      );
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'log') {
          setLiveLogs((prev) => [...prev, data.data]);
        } else if (data.error) {
          console.error('WebSocket error:', data.error);
          setLiveMode(false);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setLiveMode(false);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
    };
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const handleAction = async (action) => {
    setActionModal({ open: false, action: null });
    try {
      switch (action) {
        case 'start':
          await startService(serviceName);
          break;
        case 'stop':
          await stopService(serviceName);
          break;
        case 'restart':
          await restartService(serviceName);
          break;
        default:
          return;
      }
      setTimeout(() => loadServiceData(), 1000);
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      alert(error.response?.data?.error || `Error al ${action} el servicio`);
    }
  };

  const openActionModal = (action) => {
    setActionModal({ open: true, action });
  };

  const toggleLiveMode = () => {
    if (!liveMode) {
      setLiveLogs([]);
    }
    setLiveMode(!liveMode);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const isActive = status.includes('active (running)');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{serviceName}</h1>
                <p className="text-sm text-gray-500">Detalles del servicio</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {isActive ? (
                <>
                  <button onClick={() => openActionModal('stop')} className="btn-danger">
                    Detener
                  </button>
                  <button onClick={() => openActionModal('restart')} className="btn-warning">
                    Reiniciar
                  </button>
                </>
              ) : (
                <button onClick={() => openActionModal('start')} className="btn-success">
                  Iniciar
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Card */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Estado del Servicio</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <pre className="whitespace-pre-wrap">{status}</pre>
          </div>
        </div>

        {/* Logs Card */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Logs del Servicio</h2>
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleLiveMode}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  liveMode
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {liveMode ? (
                  <span className="flex items-center">
                    <span className="animate-pulse mr-2">●</span>
                    Detener Live
                  </span>
                ) : (
                  'Activar Live'
                )}
              </button>
              <button
                onClick={loadServiceData}
                className="btn-secondary"
              >
                Recargar
              </button>
            </div>
          </div>

          <div className="bg-gray-900 text-gray-300 p-4 rounded-lg font-mono text-sm overflow-x-auto max-h-96 overflow-y-auto">
            {liveMode ? (
              <div>
                <div className="text-yellow-400 mb-2">--- MODO EN VIVO ACTIVADO ---</div>
                {liveLogs.length === 0 ? (
                  <div className="text-gray-500">Esperando logs en tiempo real...</div>
                ) : (
                  liveLogs.map((log, index) => (
                    <div key={index} className="whitespace-pre-wrap border-b border-gray-800 py-1">
                      {log}
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            ) : (
              <pre className="whitespace-pre-wrap">{logs || 'No hay logs disponibles'}</pre>
            )}
          </div>

          {liveMode && (
            <div className="mt-4 text-sm text-gray-600">
              <p>
                ● Logs en tiempo real activos | Total de líneas: {liveLogs.length}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Action Modal */}
      <Modal
        isOpen={actionModal.open}
        onClose={() => setActionModal({ open: false, action: null })}
        title={`Confirmar ${actionModal.action}`}
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            ¿Estás seguro de que deseas {actionModal.action} el servicio{' '}
            <span className="font-bold">{serviceName}</span>?
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setActionModal({ open: false, action: null })}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={() => handleAction(actionModal.action)}
              className={`btn-${
                actionModal.action === 'start' ? 'success' : actionModal.action === 'stop' ? 'danger' : 'warning'
              }`}
            >
              Confirmar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ServiceDetail;
