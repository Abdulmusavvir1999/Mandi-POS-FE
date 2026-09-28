export const environment = {
  production: false,
  // Same host the page was opened on, so http://<pc-ip>:8002 on a phone or
  // tablet talks to the API on that PC rather than to its own localhost.
  apiUrl: `http://${window.location.hostname}:8000/api`,
  appName: 'Project X — POS & Operations',
  appVersion: '2.0.0',
  defaultCurrency: 'SAR',
  systemHost: `http://${window.location.hostname}:8002`,
};
