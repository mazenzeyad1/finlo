export const environment = {
  production: false,
  // Use toolbox iframe to match toolbox API base
  FLINKS_CONNECT_URL: 'https://toolbox-iframe.private.fin.ag/v2/?demo=true',
  // Optional: lock down postMessage origin validation
  FLINKS_ORIGIN: 'https://toolbox-iframe.private.fin.ag' as string,
};
