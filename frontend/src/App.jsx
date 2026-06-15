import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import NewProjectPage from "./pages/NewProjectPage";
import VendorsPage from "./pages/VendorsPage";
import AdminVendorsPage from "./pages/AdminVendorsPage";
import AdminMasterCategoriesPage from "./pages/AdminMasterCategoriesPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminVendorTypesPage from "./pages/AdminVendorTypesPage";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-state">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-state">Loading...</div>;
  }

  return (
    <>
      {user && <Navbar />}
      <main className="container" style={{ paddingTop: "var(--sp-8)", paddingBottom: "var(--sp-16)" }}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/new"
            element={
              <ProtectedRoute>
                <NewProjectPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <ProjectDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendors"
            element={
              <ProtectedRoute>
                <VendorsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/admin" element={<Navigate to="/admin/vendors" replace />} />
           <Route
             path="/admin/vendors"
             element={
               <ProtectedRoute>
                 <AdminVendorsPage />
               </ProtectedRoute>
             }
           />
          <Route
            path="/admin/master-categories"
            element={
              <ProtectedRoute>
                <AdminMasterCategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/vendor-types"
            element={
              <ProtectedRoute>
                <AdminVendorTypesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
