import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './components/Dashboard';
import ServiceDetail from './components/ServiceDetail';

const root = ReactDOM.createRoot(document.getElementById('root'));
const router = createBrowserRouter(
  [
    { path: '/', element: <App />, errorElement: <ErrorBoundary /> },
    { path: '/dashboard', element: <Dashboard />, errorElement: <ErrorBoundary /> },
    { path: '/service/:serviceName', element: <ServiceDetail />, errorElement: <ErrorBoundary /> }
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  }
);

root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

