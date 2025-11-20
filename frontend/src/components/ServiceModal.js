import React, { useState, useEffect } from 'react';
import { servicesService } from '../services/api';

const ServiceModal = ({ service, onClose }) => {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
  }, [service]);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const result = await servicesService.getStatus(service.name);
      setStatus(result.status || 'No disponible');
    } catch (error) {
      console.error('Error cargando estado:', error);
      setStatus('Error al cargar estado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Detalles del Servicio</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Información General</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex">
                <span className="font-medium w-32">Nombre:</span>
                <span className="text-gray-700">{service.name}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-32">Estado:</span>
                <span className={`font-semibold ${service.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                  {service.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="flex">
                <span className="font-medium w-32">Loaded:</span>
                <span className="text-gray-700">{service.loaded}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-32">Running:</span>
                <span className="text-gray-700">{service.running}</span>
              </div>
              <div className="flex">
                <span className="font-medium w-32">Descripción:</span>
                <span className="text-gray-700">{service.description || 'Sin descripción'}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Estado Completo (systemctl status)</h3>
              <button
                onClick={loadStatus}
                className="text-blue-500 hover:text-blue-600 text-sm"
              >
                ↻ Actualizar
              </button>
            </div>
            <div className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-400"></div>
                </div>
              ) : (
                <pre className="text-sm whitespace-pre-wrap font-mono">{status}</pre>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition duration-200"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceModal;
