import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { servicesService } from '../services/api';
import ServiceTable from '../components/ServiceTable';
import ServiceModal from '../components/ServiceModal';
import LogsModal from '../components/LogsModal';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedService, setSelectedService] = useState(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [services, searchTerm, filterStatus]);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError('');
      
      let result;
      if (filterStatus === 'active') {
        result = await servicesService.getActive();
      } else if (filterStatus === 'inactive') {
        result = await servicesService.getInactive();
      } else {
        result = await servicesService.getAll();
      }

      setServices(result.services || []);
    } catch (err) {
      console.error('Error cargando servicios:', err);
      setError('Error al cargar los servicios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterServices = () => {
    let filtered = services;

    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredServices(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadServices();
  };

  const handleServiceAction = async (serviceName, action) => {
    try {
      let result;
      if (action === 'start') {
        result = await servicesService.start(serviceName);
      } else if (action === 'stop') {
        result = await servicesService.stop(serviceName);
      } else if (action === 'restart') {
        result = await servicesService.restart(serviceName);
      }

      if (result.success) {
        // Recargar servicios después de 1 segundo
        setTimeout(() => loadServices(), 1000);
      } else {
        alert(`Error: ${result.error || 'Acción fallida'}`);
      }
    } catch (err) {
      console.error('Error ejecutando acción:', err);
      alert('Error al ejecutar la acción');
    }
  };

  const handleViewDetails = async (service) => {
    setSelectedService(service);
    setShowServiceModal(true);
  };

  const handleViewLogs = (service) => {
    setSelectedService(service);
    setShowLogsModal(true);
  };

  const activeCount = services.filter(s => s.status === 'active').length;
  const inactiveCount = services.filter(s => s.status !== 'active').length;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">SystemD Manager</h1>
              <p className="text-sm text-gray-600 mt-1">Administración de servicios del sistema</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">👤 {user?.username}</span>
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-200"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Servicios</p>
                <p className="text-2xl font-bold text-gray-900">{services.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-100 rounded-lg p-3">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactivos</p>
                <p className="text-2xl font-bold text-red-600">{inactiveCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 w-full">
              <input
                type="text"
                placeholder="Buscar servicio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex space-x-2">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setLoading(true);
                  loadServices();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition duration-200 disabled:opacity-50"
              >
                {refreshing ? '⟳' : '↻'} Actualizar
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de servicios */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          <ServiceTable
            services={filteredServices}
            onAction={handleServiceAction}
            onViewDetails={handleViewDetails}
            onViewLogs={handleViewLogs}
          />
        )}
      </main>

      {/* Modales */}
      {showServiceModal && selectedService && (
        <ServiceModal
          service={selectedService}
          onClose={() => setShowServiceModal(false)}
        />
      )}

      {showLogsModal && selectedService && (
        <LogsModal
          service={selectedService}
          onClose={() => setShowLogsModal(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
