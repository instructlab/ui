/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@patternfly/react-core', '@patternfly/react-styles', '@patternfly/react-table', '@patternfly/react-component-groups'],
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

module.exports = nextConfig;
