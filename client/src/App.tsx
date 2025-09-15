import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { LanguageProvider } from './hooks/useLanguage';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Pages
import { MainPage } from './pages/MainPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ChatPage } from './pages/ChatPage';
import { ProfilePage } from './pages/ProfilePage';

// Components
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';

import './App.css';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <div className="App min-h-screen bg-gray-50 flex flex-col">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<MainPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={
                <>
                  <Navbar />
                  <main className="flex-grow">
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              } />
              <Route path="/chat/:chatId?" element={
                <>
                  <Navbar />
                  <main className="flex-grow">
                    <ProtectedRoute>
                      <ChatPage />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              } />
              <Route path="/profile" element={
                <>
                  <Navbar />
                  <main className="flex-grow">
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  </main>
                  <Footer />
                </>
              } />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
