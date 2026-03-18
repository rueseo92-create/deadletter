/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  // GitHub Pages: basePath를 레포 이름에 맞게 설정
  // 예: /deadletter → https://username.github.io/deadletter/
  // basePath: "/deadletter",
};

export default nextConfig;
