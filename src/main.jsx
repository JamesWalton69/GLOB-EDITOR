import './theme.js';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import StyleSwitcher from './components/StyleSwitcher';
import './index.css';
import './theme-core.css';
import './themes/paper.css';
import './themes/brutalist.css';
import './themes/ocean.css';
import './themes/rose.css';
import './themes/swiss.css';
import { AuthProvider } from './context/AuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
      <StyleSwitcher />
    </AuthProvider>
  </React.StrictMode>,
);
