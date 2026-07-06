import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 15.5의 개발자 도구 오버레이(세그먼트 탐색기)가 잦은 Fast Refresh 이후
  // "React Client Manifest" 에러로 개발 서버를 깨뜨리는 문제가 있어 비활성화합니다.
  devIndicators: false,
};

export default nextConfig;
