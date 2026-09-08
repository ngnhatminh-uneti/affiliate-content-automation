const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("affiliateStudio", {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome,
  },
});
