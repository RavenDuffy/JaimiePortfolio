/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "strapi-jaimiedraper-com.s3.eu-west-2.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "host.docker.internal",
        port: "1337",
        pathname: "/**",
      },
    ],
  },
  webpack: (config) => {
    config.cache = false
    return config
  },
}

export default nextConfig
