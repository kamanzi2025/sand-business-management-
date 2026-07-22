import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Orders = lazy(() => import('./pages/Orders.jsx'));
const Customers = lazy(() => import('./pages/Customers.jsx'));
const VatSummary = lazy(() => import('./pages/VatSummary.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));

function PageFallback() {
  return <p className="text-sm text-slate-400">Loading…</p>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          index
          element={
            <Suspense fallback={<PageFallback />}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route
          path="orders"
          element={
            <Suspense fallback={<PageFallback />}>
              <Orders />
            </Suspense>
          }
        />
        <Route
          path="customers"
          element={
            <Suspense fallback={<PageFallback />}>
              <Customers />
            </Suspense>
          }
        />
        <Route
          path="vat"
          element={
            <Suspense fallback={<PageFallback />}>
              <VatSummary />
            </Suspense>
          }
        />
        <Route
          path="settings"
          element={
            <Suspense fallback={<PageFallback />}>
              <Settings />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}
