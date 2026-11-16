import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

import { Layout } from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import OverviewPage from './pages/OverviewPage';
import WorkflowsPage from './pages/WorkflowsPage';
import Dashboard from './pages/Dashboard';
import TenantsPage from './pages/TenantsPage';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Multi-Page Routes */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<OverviewPage />} />
            <Route path="/workflows" element={<WorkflowsPage />} />
            <Route path="/executions" element={<Dashboard />} />
            <Route path="/tenants" element={<TenantsPage />} />
            <Route path="/workers" element={<OverviewPage />} />
            <Route path="/monitoring" element={<OverviewPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);