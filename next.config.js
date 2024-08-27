/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@patternfly/react-core', '@patternfly/react-styles', '@patternfly/react-table', '@patternfly/react-component-groups'],
};

module.exports = nextConfig;
