import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import config from '../amplify_outputs.json';
import HomePage from './pages/HomePage';
import ScannerPage from './pages/ScannerPage';
import CollectionPage from './pages/CollectionPage';
import LoginPage from './pages/LoginPage';
import AuthWrapper from './components/AuthWrapper';
import MainLayout from './components/MainLayout';

Amplify.configure(config);

function App() {
  return (
    <Authenticator.Provider>
      <AuthWrapper>
        <LoginPage>
          <Router>
            <MainLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/scanner" element={<ScannerPage />} />
                <Route path="/collection" element={<CollectionPage />} />
              </Routes>
              <Toaster />
            </MainLayout>
          </Router>
        </LoginPage>
      </AuthWrapper>
    </Authenticator.Provider>
  );
}

export default App;
