// Development environment — used by `ng serve` with proxy.conf.json
// apiBaseUrl is empty so HTTP calls use relative paths (proxied by dev-server)
export const environment = {
  appName: 'RentAFit',
  apiBaseUrl: '',
  s3BucketUrl: 'https://placeholder.s3.amazonaws.com',
};
