import { useState, useEffect } from 'react';
import { 
  getServices, 
  getActiveServices, 
  getInactiveServices, 
  startService, 
  stopService, 
  restartService
} from '../api';
import ServiceModal from './ServiceModal';
import ConfirmModal from './ConfirmModal';

export default function Dashboard() {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedService, setSelectedService] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  useEffect(() => {
    loadServices();
  }, [filterType]);
  
  useEffect(() => {
    filterServices();
  }, [searchTerm, services]);
  
  const loadServices = async () => {
    setLoading(true);
    setError('');
    
    try {
      let response;
      
      switch (filterType) {
        case 'active':
          response = await getActiveServices();
          break;
        case 'inactive':
          response = await getInactiveServices();
          break;
        default:
          response = await getServices();
      }
      
      setServices(response.services);
      setFilteredServices(response.services);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar servicios');
    } finally {
      setLoading(false);
    }
  };
  
  const filterServices = () => {
    if (!searchTerm.trim()) {
      setFilteredServices(services);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = services.filter(service => 
      service.name.toLowerCase().includes(term) ||
      service.description.toLowerCase().includes(term)
    );
    
    setFilteredServices(filtered);
  };
  
  const handleServiceAction = async (serviceName, action) => {
    setActionLoading(true);
    
    try {
      let response;
      
      switch (action) {
        case 'start':
          response = await startService(serviceName);
          break;
        case 'stop':
          response = await stopService(serviceName);
          break;
        case 'restart':
          response = await restartService(serviceName);
          break;
      }
      
      if (response.success) {
        await loadServices();
      }
    } catch (err) {
      setError(err.response?.data?.message || `Error al ${action} el servicio`);
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };
  
  const getStatusColor = (active) => {
    switch (active) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
      case 'failed':
        return 'bg-red-500';
      case 'activating':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  const getStatusText = (active) => {
    switch (active) {
      case 'active':
        return 'Activo';
      case 'inactive':
        return 'Inactivo';
      case 'failed':
        return 'Fallido';
      case 'activating':
        return 'Activando';
      default:
        return active;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SystemD Manager</h1>
                <p className="text-sm text-gray-500">Administrador de Servicios</p>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Filters and Search */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar servicios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`btn ${filterType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Todos ({services.length})
              </button>
              <button
                onClick={() => setFilterType('active')}
                className={`btn ${filterType === 'active' ? 'btn-success' : 'btn-secondary'}`}
              >
                Activos
              </button>
              <button
                onClick={() => setFilterType('inactive')}
                className={`btn ${filterType === 'inactive' ? 'btn-danger' : 'btn-secondary'}`}
              >
                Inactivos
              </button>
            </div>
            
            <button
              onClick={loadServices}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Actualizar'
              )}
            </button>
          </div>
        </div>
        
        {/* Services Table */}
        {loading && filteredServices.length === 0 ? (
          <div className="card text-center py-12">
            <svg className="animate-spin h-12 w-12 text-primary-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">Cargando servicios...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="card text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-600">No se encontraron servicios</p>
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Servicio
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
                  {filteredServices.map((service) => (
                    <tr key={service.name} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(service.active)} mr-2`}></div>
                          <span className="text-sm font-medium text-gray-900">
                            {getStatusText(service.active)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono font-medium text-gray-900">{service.name}</div>
                        <div className="text-xs text-gray-500">{service.load}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{service.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedService(service)}
                            className="text-primary-600 hover:text-primary-900"
                            title="Ver detalles"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          
                          {service.active === 'active' ? (
                            <>
                              <button
                                onClick={() => setConfirmAction({ service: service.name, action: 'restart' })}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Reiniciar"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setConfirmAction({ service: service.name, action: 'stop' })}
                                className="text-red-600 hover:text-red-900"
                                title="Detener"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                </svg>
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setConfirmAction({ service: service.name, action: 'start' })}
                              className="text-green-600 hover:text-green-900"
                              title="Iniciar"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      
      {/* Modals */}
      {selectedService && (
        <ServiceModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}
      
      {confirmAction && (
        <ConfirmModal
          title={`Confirmar ${confirmAction.action}`}
          message={`¿Estás seguro de que deseas ${confirmAction.action} el servicio ${confirmAction.service}?`}
          onConfirm={() => handleServiceAction(confirmAction.service, confirmAction.action)}
          onCancel={() => setConfirmAction(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
