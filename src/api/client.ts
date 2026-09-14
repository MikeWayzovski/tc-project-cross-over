import { TIDClient } from '@trimble-oss/trimble-id-react';

const configurationEndpoint = import.meta.env.VITE_CONFIGURATION_ENDPOINT;
const clientId = import.meta.env.VITE_CLIENT_ID;

const envScopes = String(import.meta.env.VITE_SCOPES || '')
    .split(/[,\s]+/)
    .filter(Boolean);

// openid is verplicht voor de id_token die de SDK decodeert na de PKCE-exchange.
const scopes = envScopes.includes('openid') ? envScopes : ['openid', ...envScopes];

/** Trimble ID is alleen nodig voor de standalone app, niet in de Trimble Connect iframe. */
export const isTidConfigured = Boolean(configurationEndpoint && clientId);

const origin = window.location.origin;
const redirectUrl = import.meta.env.VITE_REDIRECT_URL || `${origin}/callback`;
const logoutRedirectUrl = import.meta.env.VITE_LOGOUT_REDIRECT_URL || `${origin}/logout-callback`;

if (!isTidConfigured) {
    console.error(
        'Trimble ID is niet geconfigureerd: zet VITE_CONFIGURATION_ENDPOINT, VITE_CLIENT_ID en ' +
        'VITE_SCOPES in de build-omgeving en deploy opnieuw. Inloggen werkt tot die tijd niet; ' +
        'ingesloten in Trimble Connect blijft de extensie wel bruikbaar via het Workspace-token.',
    );
}

// De constructor gooit bij een lege configurationEndpoint of clientId, en dat gebeurt tijdens
// het importeren van deze module - dus voordat React iets rendert. Zonder deze terugvalwaarden
// sloopt ontbrekende TID-config ook de ingesloten modus, die zijn token van de Workspace API
// krijgt en Trimble ID helemaal niet gebruikt. `.invalid` is gereserveerd (RFC 2606) en lost
// nooit op, dus er vertrekt geen verdwaald verzoek naar een echte host.
const tidClient = new TIDClient({
    config: {
        configurationEndpoint: configurationEndpoint || 'https://tid-not-configured.invalid/.well-known/openid-configuration',
        clientId: clientId || 'tid-not-configured',
        redirectUrl,
        logoutRedirectUrl,
        scopes,
    }
});

export default tidClient;
