import { useState, useEffect } from 'react';
import { AdminLogin } from './admin-login';
import { AdminDashboard } from './admin-dashboard';

export function AdminInterface() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const getBaseUrl = () => {
    try {
      // Avoid TS type issues with import.meta by casting
      const env = (import.meta as any)?.env;
      return env?.VITE_SIGNALING_URL || 'http://localhost:3000';
    } catch {
      return 'http://localhost:3000';
    }
  };

  useEffect(() => {
    // Check if user is already authenticated
    try {
      const t = sessionStorage.getItem('pairqr_admin_token');
      if (t) setToken(t);
    } catch {}
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/admin/dashboard`, {
        credentials: 'include'
      });

      if (response.ok) {
        // User is authenticated
        setIsAuthenticated(true);
  // Keep existing token if present (from sessionStorage). Cookie-based auth works without token.
  setToken((prev) => prev || null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (authToken: string) => {
    setToken(authToken);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
  try { sessionStorage.removeItem('pairqr_admin_token'); } catch {}
  setToken(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return <AdminDashboard token={token} onLogout={handleLogout} />;
}
