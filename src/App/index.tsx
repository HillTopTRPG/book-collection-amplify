import { Authenticator } from '@aws-amplify/ui-react';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import { Amplify } from 'aws-amplify';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import config from '$/amplify_outputs';
import { Toaster } from '@/components/ui/toaster';
import CollectionPage from '@/pages/CollectionPage';
import Home from '@/pages/Home';
import ScannerPage from '@/pages/ScannerPage';

import AuthWrapper from './AuthWrapper';
import LoginPage from './LoginPage';
import MainLayout from './MainLayout';
import SubscribeLayer from './SubscribeLayer.tsx';

Amplify.configure(config);

export default function App() {
  return (
    <ScrollArea className="h-full w-full">
      <Authenticator.Provider>
        <AuthWrapper>
          <LoginPage>
            <SubscribeLayer>
              <Router>
                <MainLayout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/scanner" element={<ScannerPage />} />
                    <Route path="/collection" element={<CollectionPage />} />
                  </Routes>
                  <Toaster />
                </MainLayout>
              </Router>
            </SubscribeLayer>
          </LoginPage>
        </AuthWrapper>
      </Authenticator.Provider>
    </ScrollArea>
  );
}

