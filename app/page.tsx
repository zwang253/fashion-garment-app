import Dashboard from "../components/dashboard.tsx";
import { listImages } from "../lib/repository.ts";

export const dynamic = "force-dynamic";

export default async function Home() {
  const images = await listImages();

  return <Dashboard initialImages={images} />;
}
