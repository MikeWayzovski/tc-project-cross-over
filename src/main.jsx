import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// 1. Importeer Bootstrap JS (nodig voor de dropdown functionaliteit!)
import * as bootstrap from 'bootstrap'

// Modus Bootstrap CSS
import '@trimble-oss/modus-bootstrap/dist/css/modus-bootstrap.min.css'
import '@trimble-oss/modus-icons/dist/modus-solid/fonts/modus-icons.css'
import '@trimble-oss/modus-icons-css/css/modus-icons.css'

import './index.css' 

// 2. Importeer de TID tools en jouw client
import { TIDProvider } from '@trimble-oss/trimble-id-react'
import tidClient from './api/client.ts'

const stripAuthParams = (target = '/') => {
  window.history.replaceState({}, document.title, target);
};

// Na PKCE-exchange: querystring opruimen en terug naar de app (niet op /callback blijven).
const handleRedirect = (authState) => {
  const returnTo = authState?.returnTo;
  const next = !returnTo || returnTo.startsWith('/callback') || returnTo.startsWith('/logout-callback')
    ? '/'
    : returnTo;
  stripAuthParams(next);
};

if (window.location.pathname.replace(/\/$/, '') === '/logout-callback') {
  stripAuthParams('/');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <TIDProvider
    tidClient={tidClient}
    onRedirectCallback={handleRedirect}
    checkRedirectUrlMatch={true}
  >
    <App />
  </TIDProvider>,
)
