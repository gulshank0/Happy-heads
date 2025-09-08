import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useGoogleCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      // Store token in localStorage or context
      localStorage.setItem('authToken', token);
      
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Redirect to dashboard or home
      navigate('/dashboard');
    }
  }, [navigate]);
};