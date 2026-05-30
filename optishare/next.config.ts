import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp", "fluent-ffmpeg"],
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
