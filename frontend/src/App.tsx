// =============================================================================
// APP COMPONENT
// React Router 6 configuration with protected routes
// =============================================================================

import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './auth';
import { Layout } from './components';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import NewPatient from './pages/NewPatient';
import PatientDetail from './pages/PatientDetail';
import Sessions from './pages/Sessions';
import SessionDetail from './pages/SessionDetail';
import Appointments from './pages/Appointments';
import NewAppointment from './pages/NewAppointment';
import AppointmentDetail from './pages/AppointmentDetail';
import Settings from './pages/Settings';
import ClinicalHistoryForm from './pages/ClinicalHistoryForm';

// =============================================================================
// PROTECTED LAYOUT WRAPPER
// Wraps all protected routes with Layout
// =============================================================================
function ProtectedLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute>
            <Layout>{children}</Layout>
        </ProtectedRoute>
    );
}

// =============================================================================
// APP ROUTES
// =============================================================================
export default function App() {
    return (
        <Routes>
            {/* ================================================================== */}
            {/* PUBLIC ROUTE - Login only */}
            {/* ================================================================== */}
            <Route path="/login" element={<Login />} />

            {/* ================================================================== */}
            {/* PROTECTED ROUTES - All require authentication */}
            {/* Role restrictions are handled at UI level, not route level */}
            {/* ================================================================== */}

            {/* Dashboard */}
            <Route
                path="/"
                element={
                    <ProtectedLayout>
                        <Dashboard />
                    </ProtectedLayout>
                }
            />

            {/* Patients */}
            <Route
                path="/patients"
                element={
                    <ProtectedLayout>
                        <Patients />
                    </ProtectedLayout>
                }
            />
            <Route
                path="/patients/new"
                element={
                    <ProtectedLayout>
                        <NewPatient />
                    </ProtectedLayout>
                }
            />
            <Route
                path="/patients/:id"
                element={
                    <ProtectedLayout>
                        <PatientDetail />
                    </ProtectedLayout>
                }
            />

            {/* Clinical History */}
            <Route
                path="/patients/:patientId/clinical-history"
                element={
                    <ProtectedLayout>
                        <ClinicalHistoryForm />
                    </ProtectedLayout>
                }
            />

            {/* Sessions */}
            <Route
                path="/sessions"
                element={
                    <ProtectedLayout>
                        <Sessions />
                    </ProtectedLayout>
                }
            />
            <Route
                path="/sessions/:id"
                element={
                    <ProtectedLayout>
                        <SessionDetail />
                    </ProtectedLayout>
                }
            />

            {/* Appointments */}
            <Route
                path="/appointments"
                element={
                    <ProtectedLayout>
                        <Appointments />
                    </ProtectedLayout>
                }
            />
            <Route
                path="/appointments/new"
                element={
                    <ProtectedLayout>
                        <NewAppointment />
                    </ProtectedLayout>
                }
            />
            <Route
                path="/appointments/:id"
                element={
                    <ProtectedLayout>
                        <AppointmentDetail />
                    </ProtectedLayout>
                }
            />

            {/* Settings */}
            <Route
                path="/settings"
                element={
                    <ProtectedLayout>
                        <Settings />
                    </ProtectedLayout>
                }
            />

            {/* ================================================================== */}
            {/* CATCH-ALL - Redirect unknown routes to dashboard */}
            {/* ================================================================== */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
