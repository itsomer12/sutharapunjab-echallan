/** @type {import('next').NextConfig} */
const nextConfig = {
  // The PDF renderer depends on Node streams and dynamic module loading.  Keeping
  // it external prevents the App Router bundle from altering those dependencies
  // in a Vercel serverless function.
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
};

export default nextConfig;
