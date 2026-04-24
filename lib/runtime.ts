export function isDemoDeployment() {
  return process.env.VERCEL === "1" || process.env.DEMO_MODE === "1";
}
