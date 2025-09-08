import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Amplify } from 'aws-amplify'
import { Authenticator } from '@aws-amplify/ui-react'
import config from '../amplify_outputs.json'
import HomePage from './pages/HomePage'
import ScannerPage from './pages/ScannerPage'
import LoginPage from './pages/LoginPage'
import AuthWrapper from './components/AuthWrapper'

Amplify.configure(config)

function App() {
  return (
    <Authenticator.Provider>
      <AuthWrapper>
        <LoginPage>
          <Router>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/scanner" element={<ScannerPage />} />
              <Route path="/collection" element={<div className="p-8 text-center">コレクション一覧は準備中です</div>} />
            </Routes>
            <Toaster />
          </Router>
        </LoginPage>
      </AuthWrapper>
    </Authenticator.Provider>
  );
}

export default App;
