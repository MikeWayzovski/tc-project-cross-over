import { TIDClient } from '@trimble-oss/trimble-id-react';

const tidClient = new TIDClient({
    config: {
        configurationEndpoint: import.meta.env.VITE_CONFIGURATION_ENDPOINT,
        clientId: import.meta.env.VITE_CLIENT_ID,

        // De veilige, standaard localhost:
        redirectUrl: "http://localhost:5173/callback",
        logoutRedirectUrl: "http://localhost:5173/logout-callback",

        scopes: [import.meta.env.VITE_SCOPES],
    }
});

export default tidClient;