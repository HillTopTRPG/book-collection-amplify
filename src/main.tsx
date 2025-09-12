import * as React from 'react';

import { Amplify } from 'aws-amplify';
import * as ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';

import outputs from '$/amplify_outputs';
import App from '@/App';

import { store } from './store';

import './index.css';

Amplify.configure(outputs);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
