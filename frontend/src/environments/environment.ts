/**
 * Frontend environment configuration for development mode.
 * 
 * FLINKS_CONNECT_URL: The iframe URL where users authenticate with their bank.
 * This URL is embedded in the Flinks Connect modal. The demo=true parameter
 * enables sandbox mode with test institutions (FlinksCapital, Greatday/Greatday).
 * 
 * FLINKS_ORIGIN: Expected origin for postMessage security validation.
 * When Flinks iframe posts LoginId back to parent, we verify the message
 * originated from this domain to prevent malicious postMessage injection.
 */
export const environment = {
  production: false,
  apiBase: 'http://localhost:3000/api',
  FLINKS_CONNECT_URL: 'https://toolbox-iframe.private.fin.ag/v2/?demo=true',
  FLINKS_ORIGIN: 'https://toolbox-iframe.private.fin.ag',
};
 