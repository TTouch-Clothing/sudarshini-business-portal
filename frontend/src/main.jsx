import React from 'react';
import '@fontsource/inter'; 
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './styles.css';
import './homeStyles.css';
import 'react-loading-skeleton/dist/skeleton.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster position='top-right' />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
