import type { NextConfig } from "next";

export function normalizeDeploymentId(value: string | undefined) {
  const deploymentId = value?.trim();
  return deploymentId || undefined;
}

const nextConfig: NextConfig = {
  deploymentId: normalizeDeploymentId(process.env.NEXT_DEPLOYMENT_ID),
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
};

export default nextConfig;
