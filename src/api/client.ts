import { TIDClient } from '@trimble-oss/trimble-id-react';

const tidClient = new TIDClient({
    config: {
        configurationEndpoint: import.meta.env.VITE_CONFIGURATION_ENDPOINT,
        clientId: import.meta.env.VITE_CLIENT_ID,

        // Dynamische URL's: werkt nu feilloos op zowel localhost als Vercel!
        redirectUrl: `${window.location.origin}/callback`,
        logoutRedirectUrl: `${window.location.origin}/logout-callback`,

        scopes: [import.meta.env.VITE_SCOPES],
    }
});

export default tidClient;