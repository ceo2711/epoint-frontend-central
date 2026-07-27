import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Evita que Turbopack tome un lockfile padre (p. ej. practica/package-lock.json). */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
