import path from "node:path";

export function getAppDataDir() {
  return process.env.APP_DATA_DIR || path.join(process.cwd(), "data");
}

export function getMediaDir(kind: "video" | "audio") {
  return path.join(getAppDataDir(), "media", kind);
}

export function getModelsDir() {
  return path.join(getAppDataDir(), "models");
}
