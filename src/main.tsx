import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from '@/App';
import { setupMockFetch } from '@/utils/mock';
import { store } from './store';

import './index.css';

setupMockFetch();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
