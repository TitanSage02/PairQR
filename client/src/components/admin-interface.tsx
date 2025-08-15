import { useState, useEffect } from 'react';
import { AdminLogin } from './admin-login';
import { AdminDashboard } from './admin-dashboard';

export function AdminInterface() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/admin/dashboard', {
        credentials: 'include'
      });

      if (response.ok) {
        // User is authenticated
        setIsAuthenticated(true);
        // Get token from response if needed
        const data = await response.json();
        setToken('authenticated'); // We use cookies, so token is managed server-side
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

  if (!isAuthenticated || !token) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return <AdminDashboard token={token} onLogout={handleLogout} />;
}
