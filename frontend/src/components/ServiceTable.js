import React, { useState } from 'react';

const ServiceTable = ({ services, onAction, onViewDetails, onViewLogs }) => {
  const [actionLoading, setActionLoading] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const handleAction = async (serviceName, action) => {
    setActionLoading({ [serviceName]: action });
    await onAction(serviceName, action);
    setActionLoading({});
  };

  const confirmActionHandler = (serviceName, action) => {
    setConfirmAction({ serviceName, action });
    setShowConfirmModal(true);
  };

  const executeConfirmedAction = () => {
    if (confirmAction) {
      handleAction(confirmAction.serviceName, confirmAction.action);
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const getStatusBadge = (status) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          Activo
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
          Inactivo
        </span>
      );
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Servicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {services.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    No se encontraron servicios
                  </td>
                </tr>
              ) : (
                services.map((service, idx) => (
                  <tr key={`${service.name || service.unit || 'service'}-${idx}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{service.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(service.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 truncate max-w-md">
                        {service.description || 'Sin descripción'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {service.status === 'active' ? (
                          <>
                            <button
                              onClick={() => confirmActionHandler(service.name, 'stop')}
                              disabled={actionLoading[service.name]}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition duration-200 disabled:opacity-50"
                            >
                              {actionLoading[service.name] === 'stop' ? '...' : 'Detener'}
                            </button>
                            <button
                              onClick={() => confirmActionHandler(service.name, 'restart')}
                              disabled={actionLoading[service.name]}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded transition duration-200 disabled:opacity-50"
                            >
                              {actionLoading[service.name] === 'restart' ? '...' : 'Reiniciar'}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleAction(service.name, 'start')}
                            disabled={actionLoading[service.name]}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition duration-200 disabled:opacity-50"
                          >
                            {actionLoading[service.name] === 'start' ? '...' : 'Iniciar'}
                          </button>
                        )}
                        <button
                          onClick={() => onViewDetails(service)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition duration-200"
                        >
                          Detalles
                        </button>
                        <button
                          onClick={() => onViewLogs(service)}
                          className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded transition duration-200"
                        >
                          Logs
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Confirmar acción</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres <strong>{confirmAction?.action}</strong> el servicio{' '}
              <strong>{confirmAction?.serviceName}</strong>?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={executeConfirmedAction}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition duration-200"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ServiceTable;
