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

// Optionele redirect handler (stuurt je terug naar de homepagina na inloggen)
const handleRedirect = (authState) => {
  window.history.replaceState({}, document.title, authState?.returnTo || '/');
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 3. Wikkel de App in de TIDProvider */}
    <TIDProvider tidClient={tidClient} onRedirectCallback={handleRedirect}>
      <App />
    </TIDProvider>
  </React.StrictMode>,
)