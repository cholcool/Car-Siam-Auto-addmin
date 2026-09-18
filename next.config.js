/** @type {import('next').NextConfig} */

function toRemotePattern(rawUrl, fallbackPathname) {
  if (!rawUrl) return null
  try {
    const url = new URL(rawUrl)
    return {
      protocol: url.protocol.replace(':', ''),
      hostname: url.hostname,
      port: url.port || undefined,
      pathname: fallbackPathname,
    }
  } catch {
    return null
  }
}

const appOrigin = process.env.AUTH_DEBUG === 'true' ? process.env.PRO_NEXTAUTH_URL : process.env.NEXTAUTH_URL

const remotePatterns = [
  toRemotePattern(appOrigin, '/uploads/**'),
  toRemotePattern(process.env.UPLOAD_PUBLIC_URL, '/**'),
].filter(Boolean)

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns,
  },
};

module.exports = nextConfig;
