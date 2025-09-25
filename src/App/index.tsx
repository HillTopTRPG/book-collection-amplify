import { ScrollArea } from '@radix-ui/react-scroll-area';
import { Amplify } from 'aws-amplify';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ApplicationControlLayer from '@/App/ApplicationControlLayer';
import AwsLayer from '@/App/AwsLayer/AwsLayer.tsx';
import { Toaster } from '@/components/ui/toaster';
import CollectionPage from '@/pages/CollectionPage';
import Home from '@/pages/Home';
import ScannerPage from '@/pages/ScannerPage';
import config from '../../amplify_outputs.json';
import MainLayout from './MainLayout';

Amplify.configure(config);

export default function App() {
  return (
    <ApplicationControlLayer>
      <ScrollArea className="h-full w-full">
        <AwsLayer>
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
        </AwsLayer>
      </ScrollArea>
    </ApplicationControlLayer>
  );
}
