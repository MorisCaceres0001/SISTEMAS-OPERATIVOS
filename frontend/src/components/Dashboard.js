import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAllServices,
  getActiveServices,
  getInactiveServices,
  startService,
  stopService,
  restartService,
} from '../services/api';
import Modal from './Modal';

function Dashboard() {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedService, setSelectedService] = useState(null);
  const [actionModal, setActionModal] = useState({ open: false, action: null, service: null });
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    loadServices();
  }, [filter]);

  useEffect(() => {
    filterServices();
  }, [searchTerm, services]);

  const loadServices = async () => {
    setLoading(true);
    try {
      let response;
      switch (filter) {
        case 'active':
          response = await getActiveServices();
          break;
        case 'inactive':
          response = await getInactiveServices();
          break;
        default:
          response = await getAllServices();
      }
      setServices(response.data.services);
      calculateStats(response.data.services);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (serviceList) => {
    const active = serviceList.filter((s) => s.active === 'active').length;
    const inactive = serviceList.filter((s) => s.active === 'inactive').length;
    setStats({
      total: serviceList.length,
      active,
      inactive,
    });
  };

  const filterServices = () => {
    if (searchTerm.trim() === '') {
      setFilteredServices(services);
    } else {
      const filtered = services.filter((service) =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredServices(filtered);
    }
  };

  const handleAction = async (action, serviceName) => {
    setActionModal({ open: false, action: null, service: null });
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
      // Recargar servicios después de la acción
      setTimeout(() => loadServices(), 500);
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      alert(error.response?.data?.error || `Error al ${action} el servicio`);
    }
  };

  const openActionModal = (action, service) => {
    setActionModal({ open: true, action, service });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <svg
                className="h-8 w-8 text-primary-600 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                />
              </svg>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SystemD Manager</h1>
                <p className="text-sm text-gray-500">Administrador de servicios Linux</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Bienvenido, <span className="font-medium">{user.username}</span>
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total de Servicios</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Servicios Activos</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Servicios Inactivos</p>
                <p className="text-3xl font-bold text-red-600">{stats.inactive}</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'active'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Activos
              </button>
              <button
                onClick={() => setFilter('inactive')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'inactive'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Inactivos
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar servicios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10 w-64"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <button onClick={loadServices} className="btn-secondary">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
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
                  {filteredServices.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                        No se encontraron servicios
                      </td>
                    </tr>
                  ) : (
                    filteredServices.map((service) => (
                      <tr key={service.name} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">{service.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`status-badge ${
                              service.active === 'active' ? 'status-running' : 'status-stopped'
                            }`}
                          >
                            {service.active === 'active' ? '● Activo' : '○ Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 truncate max-w-md">
                            {service.description || 'Sin descripción'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          {service.active === 'active' ? (
                            <>
                              <button
                                onClick={() => openActionModal('stop', service)}
                                className="btn-danger"
                              >
                                Detener
                              </button>
                              <button
                                onClick={() => openActionModal('restart', service)}
                                className="btn-warning"
                              >
                                Reiniciar
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => openActionModal('start', service)}
                              className="btn-success"
                            >
                              Iniciar
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/service/${service.name}`)}
                            className="px-3 py-1.5 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors text-sm"
                          >
                            Ver Detalles
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Action Modal */}
      <Modal
        isOpen={actionModal.open}
        onClose={() => setActionModal({ open: false, action: null, service: null })}
        title={`Confirmar ${actionModal.action}`}
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            ¿Estás seguro de que deseas {actionModal.action} el servicio{' '}
            <span className="font-bold">{actionModal.service?.name}</span>?
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setActionModal({ open: false, action: null, service: null })}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={() => handleAction(actionModal.action, actionModal.service?.name)}
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

export default Dashboard;
