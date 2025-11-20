import { useState, useEffect, useRef } from 'react';
import { getServiceStatus, getServiceLogs, LogsWebSocket } from '../api';

export default function ServiceModal({ service, onClose }) {
  const [activeTab, setActiveTab] = useState('status');
  const [status, setStatus] = useState('');
  const [logs, setLogs] = useState('');
  const [realtimeLogs, setRealtimeLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const wsRef = useRef(null);
  const logsEndRef = useRef(null);
  
  useEffect(() => {
    if (activeTab === 'status') {
      loadStatus();
    } else if (activeTab === 'logs') {
      loadLogs();
    } else if (activeTab === 'realtime') {
      startRealtimeStream();
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
      }
    };
  }, [activeTab]);
  
  useEffect(() => {
    scrollToBottom();
  }, [realtimeLogs]);
  
  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const loadStatus = async () => {
    setLoading(true);
    try {
      const response = await getServiceStatus(service.name);
      setStatus(response.output);
    } catch (err) {
      setStatus('Error al cargar estado: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await getServiceLogs(service.name, 200);
      setLogs(response.logs);
    } catch (err) {
      setLogs('Error al cargar logs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const startRealtimeStream = async () => {
    if (wsRef.current) {
      wsRef.current.disconnect();
    }
    
    setRealtimeLogs([]);
    setLoading(true);
    
    const ws = new LogsWebSocket();
    wsRef.current = ws;
    
    ws.onMessage((data) => {
      if (data.type === 'auth' && data.success) {
        ws.subscribe(service.name);
      } else if (data.type === 'subscribed') {
        setStreamActive(true);
        setLoading(false);
      } else if (data.type === 'log') {
        setRealtimeLogs(prev => [...prev, data.data]);
      } else if (data.type === 'error') {
        setRealtimeLogs(prev => [...prev, `[ERROR] ${data.message}`]);
      }
    });
    
    ws.onError((error) => {
      console.error('Error en WebSocket:', error);
      setStreamActive(false);
      setLoading(false);
    });
    
    try {
      await ws.connect();
    } catch (err) {
      console.error('Error al conectar WebSocket:', err);
      setLoading(false);
    }
  };
  
  const stopRealtimeStream = () => {
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
    setStreamActive(false);
  };
  
  const getStatusColor = (active) => {
    switch (active) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>
        
        {/* Modal */}
        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${getStatusColor(service.active)}`}></div>
                <div>
                  <h3 className="text-xl font-bold text-white">{service.name}</h3>
                  <p className="text-sm text-primary-100">{service.description}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-200 bg-gray-50">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('status')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'status'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Estado
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'logs'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Logs
              </button>
              <button
                onClick={() => setActiveTab('realtime')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'realtime'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>Tiempo Real</span>
                  {streamActive && (
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </div>
              </button>
            </nav>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <svg className="animate-spin h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
            
            {!loading && activeTab === 'status' && (
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto custom-scrollbar" style={{ maxHeight: '500px' }}>
                <pre className="whitespace-pre-wrap">{status}</pre>
              </div>
            )}
            
            {!loading && activeTab === 'logs' && (
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto custom-scrollbar" style={{ maxHeight: '500px' }}>
                <pre className="whitespace-pre-wrap">{logs}</pre>
              </div>
            )}
            
            {activeTab === 'realtime' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {streamActive ? (
                      <>
                        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                        <span className="text-sm font-medium text-gray-700">Transmisión en vivo</span>
                      </>
                    ) : (
                      <>
                        <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                        <span className="text-sm font-medium text-gray-500">Desconectado</span>
                      </>
                    )}
                  </div>
                  
                  {streamActive && (
                    <button
                      onClick={stopRealtimeStream}
                      className="btn-danger text-xs"
                    >
                      Detener
                    </button>
                  )}
                </div>
                
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-y-auto custom-scrollbar" style={{ maxHeight: '500px' }}>
                  {realtimeLogs.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">
                      {loading ? 'Conectando...' : 'Esperando logs...'}
                    </div>
                  ) : (
                    <>
                      {realtimeLogs.map((log, index) => (
                        <div key={index} className="mb-1">{log}</div>
                      ))}
                      <div ref={logsEndRef} />
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
