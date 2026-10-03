// App.js — Uabindia HRMS Entry Point
// Multi-tenant | Multi-company | Multi-project support
import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
import RootNavigator from './navigation/RootNavigator';

export default function App() {
  return (
    <TenantProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </TenantProvider>
  );
}
