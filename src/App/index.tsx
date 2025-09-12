import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import config from '../../amplify_outputs.json';
import Home from '@/pages/Home';
import ScannerPage from '@/pages/ScannerPage';
import CollectionPage from '@/pages/CollectionPage';
import LoginPage from './LoginPage';
import AuthWrapper from './AuthWrapper';
import MainLayout from './MainLayout';
import {ScrollArea} from '@radix-ui/react-scroll-area';
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

