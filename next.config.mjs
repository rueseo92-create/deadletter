/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  // GitHub Pages: basePath를 레포 이름에 맞게 설정
  basePath: "/deadletter",
};

export default nextConfig;
