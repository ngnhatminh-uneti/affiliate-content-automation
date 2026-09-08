const { app, BrowserWindow, dialog, shell } = require("electron");
const { spawn } = require("node:child_process");
const http = require("node:http");
const path = require("node:path");
const next = require("next");

const PORT=Number(process.env.PORT||3210);
let mainWindow=null;let server=null;let nextApp=null;let ollamaProcess=null;
function initializeEnvironment(){process.env.APP_DATA_DIR=process.env.APP_DATA_DIR||app.getPath("userData");process.env.OLLAMA_BASE_URL=process.env.OLLAMA_BASE_URL||"http://127.0.0.1:11434";process.env.NEXT_TELEMETRY_DISABLED="1";}
function ollamaReady(){return new Promise((resolve)=>{const request=http.get("http://127.0.0.1:11434/api/tags",{timeout:1200},(res)=>{res.resume();resolve(res.statusCode===200)});request.on("error",()=>resolve(false));request.on("timeout",()=>{request.destroy();resolve(false)});});}
async function ensureOllama(){if(await ollamaReady())return;try{ollamaProcess=spawn(process.platform==="win32"?"ollama":"ollama",["serve"],{detached:false,stdio:"ignore",windowsHide:true});ollamaProcess.unref();}catch{}}
async function startNext(){initializeEnvironment();await ensureOllama();if(process.env.ELECTRON_DEV_SERVER_URL)return process.env.ELECTRON_DEV_SERVER_URL;process.env.NODE_ENV="production";process.env.PORT=String(PORT);process.env.HOSTNAME="127.0.0.1";nextApp=next({dev:false,dir:app.getAppPath(),hostname:"127.0.0.1",port:PORT});await nextApp.prepare();const handle=nextApp.getRequestHandler();server=http.createServer((req,res)=>handle(req,res));await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(PORT,"127.0.0.1",resolve)});return `http://127.0.0.1:${PORT}`;}
async function createWindow(){const url=await startNext();mainWindow=new BrowserWindow({width:1440,height:980,minWidth:1100,minHeight:760,show:false,title:"Affiliate Studio",backgroundColor:"#09090b",webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,preload:path.join(__dirname,"preload.cjs")}});mainWindow.once("ready-to-show",()=>mainWindow.show());mainWindow.webContents.setWindowOpenHandler(({url:target})=>{if(/^https?:\/\//i.test(target))void shell.openExternal(target);return{action:"deny"}});await mainWindow.loadURL(url);}
app.whenReady().then(createWindow).catch(error=>{dialog.showErrorBox("Affiliate Studio",error instanceof Error?error.stack||error.message:String(error));app.quit()});
app.on("activate",()=>{if(BrowserWindow.getAllWindows().length===0)void createWindow()});
app.on("window-all-closed",()=>{if(process.platform!=="darwin")app.quit()});
app.on("before-quit",()=>{try{server?.close()}catch{}try{ollamaProcess?.kill()}catch{}});
