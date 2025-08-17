import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import * as ReactRouterDOM from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserProvider } from './contexts/UserContext';
import { AuthProvider } from './contexts/AuthContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ReactRouterDOM.HashRouter>
      <ThemeProvider>
        <UserProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </UserProvider>
      </ThemeProvider>
    </ReactRouterDOM.HashRouter>
  </React.StrictMode>
);