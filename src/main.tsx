import { StrictMode } from 'react';
import { Amplify } from 'aws-amplify';
import * as ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from '@/App';
import outputs from '../amplify_outputs.json';
import { store } from './store';

import './index.css';

Amplify.configure(outputs);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
