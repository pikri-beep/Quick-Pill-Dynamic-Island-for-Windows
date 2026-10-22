"use strict";const{app:h,BrowserWindow:ke,screen:B,ipcMain:i,shell:C,dialog:Ue,Tray:Ze,Menu:Ye,nativeImage:V,clipboard:U,powerMonitor:we,globalShortcut:ee}=require("electron");h.commandLine.appendSwitch("disable-background-timer-throttling");h.commandLine.appendSwitch("disable-backgrounding-occluded-windows");h.commandLine.appendSwitch("disable-renderer-backgrounding");h.commandLine.appendSwitch("autoplay-policy","no-user-gesture-required");const Xe=h.requestSingleInstanceLock();Xe?h.on("second-instance",()=>{typeof ce=="function"?ce():s&&!s.isDestroyed()&&(s.isVisible()||s.show(),s.restore(),s.focus())}):h.quit();const m=require("node:path"),d=require("fs"),Te=require("os"),We=require("https"),Me=require("http"),et=require("crypto"),{EventEmitter:tt}=require("events");function le(t){const e=[m.join(__dirname,t),m.join(__dirname,"../../src",t),m.join(typeof h<"u"&&h.getAppPath?h.getAppPath():process.cwd(),"src",t),m.join(typeof h<"u"&&h.getAppPath?h.getAppPath():process.cwd(),".vite/build",t),m.join(process.cwd(),"src",t)];for(const n of e)try{if(d.existsSync(n)||d.existsSync(n+".js")||d.existsSync(m.join(n,"index.js")))return require(n)}catch{}return require(t)}const{createProgressEngine:nt}=le("services/progress"),{createNotificationEngine:st,NOTIFICATION_ACTION_TYPES:Ht}=le("services/notifications"),{createLauncherEngine:rt}=le("services/launcher"),{createNotesEngine:it}=le("services/notes"),{buildInstallCommand:ot}=le("services/updater");let G=null,s=null,R=!0;function P(){try{return m.join(h.getPath("userData"),"settings.json")}catch{return m.join(process.cwd(),"settings.json")}}function at(){try{const t=P();if(d.existsSync(t)){const e=JSON.parse(d.readFileSync(t,"utf8"));if(typeof e.alwaysOnTop=="boolean")return e.alwaysOnTop}}catch{}return!0}function ct(t){try{const e=P();let n={};if(d.existsSync(e))try{n=JSON.parse(d.readFileSync(e,"utf8"))}catch{}n.alwaysOnTop=t,d.writeFileSync(e,JSON.stringify(n,null,2),"utf8")}catch{}}function lt(){try{const t=P();if(d.existsSync(t)){const e=JSON.parse(d.readFileSync(t,"utf8"));if(typeof e.autoDownloadInstall=="boolean")return e.autoDownloadInstall}}catch{}return!0}function dt(t,e){try{const n=P();let r={};if(d.existsSync(n))try{r=JSON.parse(d.readFileSync(n,"utf8"))}catch{}r[t]=e,d.writeFileSync(n,JSON.stringify(r,null,2),"utf8")}catch{}}function ut(){try{const t=P();if(d.existsSync(t)){const e=JSON.parse(d.readFileSync(t,"utf8"));if(typeof e.mascotMode=="boolean")return e.mascotMode}}catch{}return!0}function je(t){try{const e=P();let n={};if(d.existsSync(e))try{n=JSON.parse(d.readFileSync(e,"utf8"))}catch{}n.mascotMode=t,d.writeFileSync(e,JSON.stringify(n,null,2),"utf8")}catch{}}function pt(){try{const t=P();if(d.existsSync(t)){const e=JSON.parse(d.readFileSync(t,"utf8"));if(typeof e.minimalNotch=="boolean")return e.minimalNotch}}catch{}return!1}function ae(t){try{const e=P();let n={};if(d.existsSync(e))try{n=JSON.parse(d.readFileSync(e,"utf8"))}catch{}n.minimalNotch=t,d.writeFileSync(e,JSON.stringify(n,null,2),"utf8")}catch{}}function ht(){try{const t=P();if(d.existsSync(t)){const e=JSON.parse(d.readFileSync(t,"utf8"));if(typeof e.privacyDots=="boolean")return e.privacyDots}}catch{}return!1}function ft(t){try{const e=P();let n={};if(d.existsSync(e))try{n=JSON.parse(d.readFileSync(e,"utf8"))}catch{}n.privacyDots=t,d.writeFileSync(e,JSON.stringify(n,null,2),"utf8")}catch{}}function yt(){try{const t=P();if(d.existsSync(t)){const e=JSON.parse(d.readFileSync(t,"utf8"));if(typeof e.smartBrowserAvoidance=="boolean")return e.smartBrowserAvoidance}}catch{}return!0}function mt(t){try{const e=P();let n={};if(d.existsSync(e))try{n=JSON.parse(d.readFileSync(e,"utf8"))}catch{}n.smartBrowserAvoidance=t,d.writeFileSync(e,JSON.stringify(n,null,2),"utf8")}catch{}}let L=ut(),A=pt(),ie=ht(),te=yt();R=at();function gt(){try{const t=P();if(d.existsSync(t)){const e=JSON.parse(d.readFileSync(t,"utf8"));if(Array.isArray(e.hiddenTabs))return e.hiddenTabs}}catch{}return[6]}function wt(t){try{const e=P();let n={};if(d.existsSync(e))try{n=JSON.parse(d.readFileSync(e,"utf8"))}catch{}n.hiddenTabs=t,d.writeFileSync(e,JSON.stringify(n,null,2),"utf8")}catch{}}const $t=[2,11,12,13,14,15,16,4,5,6,7,8,10,0,1,3];function bt(){try{const t=P();if(d.existsSync(t)){const e=JSON.parse(d.readFileSync(t,"utf8"));if(Array.isArray(e.tabOrder)&&e.tabOrder.length>0)return e.tabOrder}}catch{}return[...$t]}function St(t){try{const e=P();let n={};if(d.existsSync(e))try{n=JSON.parse(d.readFileSync(e,"utf8"))}catch{}n.tabOrder=t,d.writeFileSync(e,JSON.stringify(n,null,2),"utf8")}catch{}}let Y=gt(),X=bt();const oe="http://127.0.0.1:8765/api/process";function fe(){try{const t=P();if(d.existsSync(t)){const e=JSON.parse(d.readFileSync(t,"utf8"));let n=typeof e.jarvisEndpoint=="string"&&e.jarvisEndpoint.trim()?e.jarvisEndpoint.trim():oe;return n==="http://localhost:5000/api/ask"&&(n=oe),{enabled:typeof e.jarvisEnabled=="boolean"?e.jarvisEnabled:!0,endpoint:n}}}catch{}return{enabled:!0,endpoint:oe}}function At(t){try{const e=P();let n={};if(d.existsSync(e))try{n=JSON.parse(d.readFileSync(e,"utf8"))}catch{}return typeof(t==null?void 0:t.enabled)=="boolean"&&(n.jarvisEnabled=t.enabled),typeof(t==null?void 0:t.endpoint)=="string"&&t.endpoint.trim()&&(n.jarvisEndpoint=t.endpoint.trim()),d.writeFileSync(e,JSON.stringify(n,null,2),"utf8"),!0}catch{return!1}}function v(){if(R&&!(!s||s.isDestroyed())){try{s.setAlwaysOnTop(!0,"screen-saver",1)}catch{try{s.setAlwaysOnTop(!0,"screen-saver")}catch{try{s.setAlwaysOnTop(!0)}catch{}}}try{s.moveTop()}catch{}}}function vt(t){if(R=!!t,ct(R),s&&!s.isDestroyed()){try{R?v():s.setAlwaysOnTop(!1)}catch{}try{s.webContents.send("always-on-top-changed",R)}catch{}}_()}function Ge(){try{return m.join(h.getPath("userData"),"quick-pill.log")}catch{return m.join(process.cwd(),"quick-pill.log")}}function c(t,e=null){const r=`[${new Date().toISOString()}] ${t}${e?` | Error: ${e.stack||e}`:""}
`;console.log(r.trim());try{const o=Ge();d.appendFileSync(o,r,"utf8")}catch{}}process.on("uncaughtException",t=>{c("UNCAUGHT EXCEPTION (Main Process)",t)});process.on("unhandledRejection",t=>{c("UNHANDLED REJECTION (Main Process)",t)});const j={0:"Alt+B",1:"Alt+W",2:"Alt+O",11:"Alt+H",12:"Alt+A",13:"Alt+P",14:"Alt+L",15:"Alt+Q",16:"Alt+I",3:"Alt+M",4:"Alt+C",5:"Alt+N",6:"Alt+G",7:"Alt+V",8:"Alt+T",10:"Alt+R","minimal-notch":"Alt+Shift+M"};let Z=[];function Le(){try{const t=P();if(d.existsSync(t)){const e=JSON.parse(d.readFileSync(t,"utf8"));if(e&&typeof e.tabShortcuts=="object"&&e.tabShortcuts!==null)return{...j,...e.tabShortcuts}}}catch{}return{...j}}function Be(t){try{const e=P();let n={};if(d.existsSync(e))try{n=JSON.parse(d.readFileSync(e,"utf8"))}catch{}return n.tabShortcuts=t,d.writeFileSync(e,JSON.stringify(n,null,2),"utf8"),!0}catch(e){return c("Failed to save tabShortcuts preference:",e),!1}}function Tt(t){if(Number(t)===9){Ee();return}if(!(!s||s.isDestroyed()))try{s.isVisible()||s.show(),v(),s.focus(),s.webContents.send("open-tab-instant",Number(t))}catch(e){c(`Failed to openTabInstant for tab ${t}:`,e)}}function xe(t){for(const r of Z)try{ee.unregister(r)}catch{}Z=[];const e=t||Le();for(const[r,o]of Object.entries(e)){if(!o||typeof o!="string"||!o.trim())continue;const a=o.trim();if(a.toUpperCase().includes("CTRL")||a.toUpperCase().includes("CONTROL")){c(`Refusing to register shortcut with Ctrl: ${a}`);continue}if(r==="minimal-notch"){try{ee.register(a,()=>{A=!A,ae(A),s&&!s.isDestroyed()&&(s.webContents.send("settings:minimal-notch-changed",A),s.webContents.send("toggle-minimal-notch-hotkey")),_()})?Z.push(a):c(`Global shortcut conflict/in-use for ${a} (minimal-notch)`)}catch(l){c(`Error registering global shortcut ${a}:`,l)}continue}try{ee.register(a,()=>{Tt(parseInt(r,10))})?Z.push(a):c(`Global shortcut conflict/in-use for ${a} (tab ${r})`)}catch(l){c(`Error registering global shortcut ${a}:`,l)}}const n=e["minimal-notch"]||"Alt+Shift+M";if(!Z.includes(n))try{ee.register(n,()=>{A=!A,ae(A),s&&!s.isDestroyed()&&(s.webContents.send("settings:minimal-notch-changed",A),s.webContents.send("toggle-minimal-notch-hotkey")),_()})&&Z.push(n)}catch(r){c("Error registering fallback global shortcut for minimal notch:",r)}}const{exec:M,execFile:de,spawn:Ie}=require("child_process");function ye(t){return Buffer.from(t,"utf16le").toString("base64")}i.handle("log-message",(t,e,n,r)=>{c(`[RENDERER ${String(e).toUpperCase()}] ${n} ${r?JSON.stringify(r):""}`)});i.handle("log-renderer-error",(t,e)=>{c(`[RENDERER ERROR] Unhandled Renderer Exception ${JSON.stringify(e)}`)});let Fe=null;i.handle("set-ignore-mouse-events",(t,e,n)=>{if(s&&!s.isDestroyed())try{if(Fe===e)return;if(Fe=e,e){const r=n!==void 0?n:!0;s.setIgnoreMouseEvents(!0,{forward:r})}else s.setIgnoreMouseEvents(!1),v()}catch{try{s.setIgnoreMouseEvents(!0,{forward:!0})}catch{}}});i.handle("get-always-on-top",()=>R);i.handle("set-always-on-top",(t,e)=>(vt(e),R));i.handle("focus-window",()=>{s&&!s.isDestroyed()&&(v(),s.focus())});i.handle("open-external",async(t,e)=>{await C.openExternal(e)});i.handle("get-mascot-mode",()=>L);i.handle("set-mascot-mode",(t,e)=>(L=!!e,je(L),_(),L));i.handle("get-minimal-notch",()=>A);i.handle("set-minimal-notch",(t,e)=>(A=!!e,ae(A),s&&!s.isDestroyed()&&s.webContents.send("settings:minimal-notch-changed",A),_(),A));i.handle("toggle-minimal-notch",()=>(A=!A,ae(A),s&&!s.isDestroyed()&&(s.webContents.send("settings:minimal-notch-changed",A),s.webContents.send("toggle-minimal-notch-hotkey")),_(),A));i.handle("get-smart-browser-avoidance",()=>te);i.handle("set-smart-browser-avoidance",(t,e)=>(te=!!e,mt(te),s&&!s.isDestroyed()&&s.webContents.send("settings:smart-browser-avoidance-changed",te),te));i.handle("get-hidden-tabs",()=>Y);i.handle("set-hidden-tabs",(t,e)=>(Array.isArray(e)&&(Y=e,wt(Y),s&&!s.isDestroyed()&&s.webContents.send("settings:hidden-tabs-changed",Y),g&&!g.isDestroyed()&&g.webContents.send("settings:hidden-tabs-changed",Y)),Y));i.handle("get-tab-order",()=>X);i.handle("set-tab-order",(t,e)=>(Array.isArray(e)&&(X=e,St(X),s&&!s.isDestroyed()&&s.webContents.send("settings:tab-order-changed",X),g&&!g.isDestroyed()&&g.webContents.send("settings:tab-order-changed",X)),X));i.handle("get-privacy-dots",()=>ie);i.handle("set-privacy-dots",(t,e)=>(ie=!!e,ft(ie),s&&!s.isDestroyed()&&s.webContents.send("settings:privacy-dots-changed",ie),ie));i.handle("open-settings-window",()=>(Ee(),!0));i.on("settings-window:minimize",()=>{g&&!g.isDestroyed()&&g.minimize()});i.on("settings-window:close",()=>{g&&!g.isDestroyed()&&g.close()});const Pt="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAMklEQVRYhe3OQQ0AIAwEwbf/h1GChwW0U4E2Z9Yk1fN7kG65AwAAAAAAAAAAAAAAwP8AO6kBX7K4Xy0AAAAASUVORK5CYII=";let N=null;function Je(){if(N&&typeof N.isEmpty=="function"&&!N.isEmpty())return N;try{const t=m.resolve(h.getAppPath?h.getAppPath():process.cwd(),"src/assets/icons/icon.png");if(d.existsSync(t)&&(N=V.createFromPath(t).resize({width:32,height:32}),!N.isEmpty()))return N}catch{}try{const t=z("png");if(d.existsSync(t)&&(N=V.createFromPath(t).resize({width:32,height:32}),!N.isEmpty()))return N}catch{}try{N=V.createFromDataURL(Pt).resize({width:32,height:32})}catch{}return N}const he=new Map;async function kt(t){try{if(!t||typeof t!="string")return null;const e=m.resolve(t);if(!d.existsSync(e))return null;if(he.has(e)){const r=he.get(e);return r&&!r.isEmpty()?r.toDataURL():null}let n=null;try{typeof V.createThumbnailFromPath=="function"&&(n=await V.createThumbnailFromPath(e,{width:32,height:32}))}catch{}if(!n||n.isEmpty())try{typeof h.getFileIcon=="function"&&(n=await h.getFileIcon(e,{size:"normal"}),n&&!n.isEmpty()&&(n=n.resize({width:32,height:32})))}catch{}return(!n||n.isEmpty())&&(n=Je()),he.set(e,n),n&&!n.isEmpty()?n.toDataURL():null}catch(e){return c("cacheShelfIcon error:",e),null}}function Ce(t,e){try{if(!t||typeof t.startDrag!="function"||!e||typeof e!="string")return!1;const n=m.resolve(e);if(!d.existsSync(n))return!1;let r=he.get(n);return(!r||typeof r.isEmpty=="function"&&r.isEmpty())&&(r=Je()),!r||typeof r.isEmpty=="function"&&r.isEmpty()?(c("executeStartDragSync: no valid icon available, skipping startDrag to prevent crash"),!1):(t.startDrag({file:n,icon:r}),!0)}catch(n){return c("executeStartDragSync error:",n),!1}}i.on("shelf:start-drag",(t,e)=>{Ce(t.sender,e)});i.on("ondragstart",(t,e)=>{Ce(t.sender,e)});i.handle("start-drag",(t,e)=>Ce(t.sender,e));i.handle("shelf:cache-icon",async(t,e)=>await kt(e));let H=null;function T(){if(!H){let t="";try{t=h.getPath("userData")}catch{t=process.cwd()}H=rt({userDataPath:t,shell:C,getFileIcon:(e,n)=>h.getFileIcon(e,n)})}return H}i.handle("launcher:search-apps",async(t,e,n)=>{try{return await T().searchApps(e,n)}catch(r){return c("Error in launcher:search-apps:",r),[]}});i.handle("launcher:get-catalog",async()=>{try{return await T().getCatalog()}catch(t){return c("Error in launcher:get-catalog:",t),[]}});i.handle("launcher:reindex-catalog",async()=>{try{return await T().reindexCatalog()}catch(t){return c("Error in launcher:reindex-catalog:",t),{success:!1,count:0}}});i.handle("launcher:launch-app",async(t,e)=>{try{return await T().launchApp(e)}catch(n){return c("Error in launcher:launch-app:",n),{success:!1,error:n.message}}});i.handle("launcher:get-running-windows",async(t,e)=>{try{return await T().getRunningWindows(e)}catch(n){return c("Error in launcher:get-running-windows:",n),[]}});i.handle("launcher:activate-window",async(t,e)=>{try{const n=await T().activateWindow(e);return n.success&&s&&!s.isDestroyed()&&s.webContents.send("launcher:window-activated",{hWnd:e}),n}catch(n){return c("Error in launcher:activate-window:",n),{success:!1,code:"FAILED",error:n.message}}});i.handle("launcher:get-favorites",async()=>{try{return await T().getFavorites()}catch(t){return c("Error in launcher:get-favorites:",t),[]}});i.handle("launcher:set-favorites",async(t,e)=>{try{return await T().setFavorites(e)}catch(n){return c("Error in launcher:set-favorites:",n),{success:!1}}});i.handle("launcher:open-app",async(t,e)=>{try{return e?await C.openPath(e)?await T().launchApp(e):{success:!0}:{success:!1,error:"No target specified"}}catch(n){return c("Error in launcher:open-app:",n),{success:!1,error:n.message}}});i.on("launcher:open-app",async(t,e)=>{try{if(!e)return;await C.openPath(e)&&await T().launchApp(e)}catch(n){c("Error in launcher:open-app (event):",n)}});i.handle("launcher:open-url",async(t,e)=>{try{if(!e)return{success:!1,error:"No URL specified"};let n=String(e).trim();return/^https?:\/\//i.test(n)||(n="https://"+n),await C.openExternal(n),{success:!0}}catch(n){return c("Error in launcher:open-url:",n),{success:!1,error:n.message}}});i.on("launcher:open-url",async(t,e)=>{try{if(!e)return;let n=String(e).trim();/^https?:\/\//i.test(n)||(n="https://"+n),await C.openExternal(n)}catch(n){c("Error in launcher:open-url (event):",n)}});i.handle("launcher:select-file",async()=>{try{const t=await Ue.showOpenDialog({title:"Select Application or Shortcut",properties:["openFile"],filters:[{name:"Applications & Shortcuts",extensions:["exe","lnk","bat","cmd"]},{name:"All Files",extensions:["*"]}]});if(!t.canceled&&t.filePaths.length>0){const e=t.filePaths[0],n=m.basename(e,m.extname(e));return{canceled:!1,filePath:e,name:n}}return{canceled:!0}}catch(t){return c("Error in launcher:select-file:",t),{canceled:!0,error:t.message}}});i.handle("workspaces:get-workspaces",async()=>{try{return await T().getWorkspaces()}catch(t){return c("Error in workspaces:get-workspaces:",t),[]}});i.handle("workspaces:save-workspace",async(t,e)=>{try{return await T().saveWorkspace(e)}catch(n){return c("Error in workspaces:save-workspace:",n),{success:!1,error:n.message}}});i.handle("workspaces:delete-workspace",async(t,e)=>{try{return await T().deleteWorkspace(e)}catch(n){return c("Error in workspaces:delete-workspace:",n),{success:!1,error:n.message}}});i.handle("workspaces:launch-workspace",async(t,e,n)=>{try{return await T().launchWorkspace(e,n)}catch(r){return c("Error in workspaces:launch-workspace:",r),{success:!1,results:[],error:r.message}}});let $e=null;function E(){if(!$e){let t="";try{t=h.getPath("userData")}catch{t=process.cwd()}$e=it({userDataPath:t,clipboard:U})}return $e}i.handle("notes:get-notes",async(t,e,n)=>{try{return await E().getNotes(e,n)}catch(r){return c("Error in notes:get-notes:",r),[]}});i.handle("notes:save-note",async(t,e)=>{try{const n=await E().saveNote(e);return s&&!s.isDestroyed()&&s.webContents.send("notes:updated",{action:"save",note:n}),n}catch(n){return c("Error in notes:save-note:",n),{success:!1,error:n.message}}});i.handle("notes:delete-note",async(t,e)=>{try{const n=await E().deleteNote(e);return n.success&&s&&!s.isDestroyed()&&s.webContents.send("notes:updated",{action:"delete",id:e}),n}catch(n){return c("Error in notes:delete-note:",n),{success:!1,error:n.message}}});i.handle("notes:undo-delete",async()=>{try{const t=await E().undoDelete();return t.success&&s&&!s.isDestroyed()&&s.webContents.send("notes:updated",{action:"restore",note:t.note}),t}catch(t){return c("Error in notes:undo-delete:",t),{success:!1,error:t.message}}});i.handle("notes:toggle-pin",async(t,e)=>{try{const n=await E().togglePin(e);return n.success&&s&&!s.isDestroyed()&&s.webContents.send("notes:updated",{action:"togglePin",id:e,isPinned:n.isPinned}),n}catch(n){return c("Error in notes:toggle-pin:",n),{success:!1,error:n.message}}});i.handle("notes:toggle-archive",async(t,e)=>{try{const n=await E().toggleArchive(e);return n.success&&s&&!s.isDestroyed()&&s.webContents.send("notes:updated",{action:"toggleArchive",id:e,isArchived:n.isArchived}),n}catch(n){return c("Error in notes:toggle-archive:",n),{success:!1,error:n.message}}});i.handle("notes:save-draft",async(t,e)=>{try{return await E().saveDraft(e)}catch(n){return c("Error in notes:save-draft:",n),{success:!1,error:n.message}}});i.handle("notes:get-draft",async()=>{try{return await E().getDraft()}catch(t){return c("Error in notes:get-draft:",t),null}});i.handle("notes:clear-draft",async()=>{try{return await E().clearDraft()}catch(t){return c("Error in notes:clear-draft:",t),{success:!1,error:t.message}}});i.handle("notes:get-contextual-capture",async(t,e)=>{try{return await E().getContextualCapture(e)}catch(n){return c("Error in notes:get-contextual-capture:",n),{success:!1,code:"CAPTURE_ERROR",error:n.message}}});i.handle("notes:search-notes",async(t,e,n)=>{try{return await E().searchNotes(e,n)}catch(r){return c("Error in notes:search-notes:",r),[]}});i.handle("notes:get-tags",async()=>{try{return await E().getTags()}catch(t){return c("Error in notes:get-tags:",t),[]}});i.handle("notes:convert-to-task",async(t,e)=>{try{return await E().convertToTask(e)}catch(n){return c("Error in notes:convert-to-task:",n),{success:!1,error:n.message}}});i.handle("shortcuts:get-tab-shortcuts",()=>Le());i.handle("shortcuts:set-tab-shortcuts",(t,e)=>{if(!e||typeof e!="object")return{success:!1,error:"Invalid shortcuts object"};const n={};for(const[o,a]of Object.entries(e))if(typeof a=="string"){const l=a.toUpperCase();if(l.includes("CTRL")||l.includes("CONTROL"))return{success:!1,error:"Ctrl cannot be used in tab shortcuts (reserved for Click-Through)"};n[o]=a.trim()}const r={...j,...n};return Be(r),xe(r),s&&!s.isDestroyed()&&s.webContents.send("shortcuts:updated",r),g&&!g.isDestroyed()&&g.webContents.send("shortcuts:updated",r),{success:!0,shortcuts:r}});i.handle("shortcuts:reset-tab-shortcuts",()=>(Be(j),xe(j),s&&!s.isDestroyed()&&s.webContents.send("shortcuts:updated",j),g&&!g.isDestroyed()&&g.webContents.send("shortcuts:updated",j),{success:!0,shortcuts:j}));function ne(t,e){try{i.removeHandler(t)}catch{}i.handle(t,e)}ne("jarvis:ask",async(t,e)=>{if(!e||typeof e!="string"||!e.trim())return{success:!1,error:"Empty prompt provided."};const n=fe();if(!n.enabled)return{success:!1,error:"JARVIS integration is currently disabled in Settings."};const r=n.endpoint||oe;try{const o=new AbortController,a=setTimeout(()=>o.abort(),45e3),l={text:e.trim(),prompt:e.trim(),audio_target:"laptop"},f=await fetch(r,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json, text/plain, */*"},body:JSON.stringify(l),signal:o.signal});if(clearTimeout(a),!f.ok){const u=await f.text().catch(()=>"");return{success:!1,error:`JARVIS responded with error ${f.status}: ${u||f.statusText}`}}if((f.headers.get("content-type")||"").includes("application/json")){const u=await f.json();return{success:!0,response:u.reply||u.response||u.text||u.message||u.answer||u.output||u.result||(typeof u=="string"?u:JSON.stringify(u)),raw:u}}else return{success:!0,response:await f.text()}}catch(o){return o.name==="AbortError"?{success:!1,error:"JARVIS query timed out (45s). Your local model may be busy."}:{success:!1,error:"JARVIS local server offline. Make sure D:/JARVIS is running."}}});ne("jarvis:testConnection",async(t,e)=>{const n=fe(),r=e||n.endpoint||oe;try{const o=new AbortController,a=setTimeout(()=>o.abort(),4e3);let l=!1,f="";try{const u=`${new URL(r).origin}/api/status`,y=await fetch(u,{method:"GET",signal:o.signal});if(y.ok){const b=await y.json().catch(()=>null);b&&b.name?(l=!0,f=`${b.name} v${b.version||"2.5"} (${b.model||"Online"})`):y.status<500&&(l=!0,f=`Online (${y.status})`)}}catch{}if(!l)try{const p=await fetch(r,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:"ping",prompt:"ping"}),signal:o.signal});p.status<500&&(l=!0,f=`HTTP ${p.status}`)}catch{try{const u=new URL(r),y=await fetch(u.origin,{method:"GET",signal:o.signal});y.status<500&&(l=!0,f=`Host online (${y.status})`)}catch(u){throw u}}return clearTimeout(a),{success:!0,connected:l,details:f}}catch(o){return{success:!1,connected:!1,error:o.message||"Cannot reach server"}}});ne("jarvis:getConfig",async()=>fe());ne("jarvis:setConfig",async(t,e)=>{At(e);const n=fe();return s&&!s.isDestroyed()&&s.webContents.send("jarvis:configUpdated",n),g&&!g.isDestroyed()&&g.webContents.send("jarvis:configUpdated",n),{success:!0,config:n}});ne("jarvis:stopServer",async()=>{try{try{const e=new AbortController,n=setTimeout(()=>e.abort(),1500);await fetch("http://127.0.0.1:8765/api/shutdown",{method:"POST",headers:{"Content-Type":"application/json"},signal:e.signal}).catch(()=>null),clearTimeout(n)}catch{}const t="D:\\JARVIS\\stop_jarvis.bat";return d.existsSync(t)&&M(`cmd /c "${t}"`,{cwd:"D:\\JARVIS"}),{success:!0,message:"JARVIS stopped and resources freed."}}catch(t){return{success:!1,error:t.message||"Failed to stop JARVIS"}}});ne("jarvis:launchServer",async()=>{const t="D:\\JARVIS\\run_gui.bat";try{if(d.existsSync(t))return M(`cmd /c "${t}"`,{cwd:"D:\\JARVIS"}),{success:!0,message:"JARVIS launch initiated."}}catch(e){return{success:!1,error:e.message||"Failed to launch run_gui.bat"}}return{success:!1,error:"D:\\JARVIS\\run_gui.bat not found."}});i.handle("launch-app",async(t,e)=>await T().launchApp(e));i.handle("build-app-cache",async()=>await T().reindexCatalog());i.handle("search-apps",async(t,e)=>await T().searchApps(e));i.handle("get-displays",()=>B.getAllDisplays().map(e=>({id:e.id,label:e.label||`Display ${e.id}`,bounds:e.bounds})));i.handle("set-display",(t,e)=>{if(s&&!s.isDestroyed()){const r=B.getAllDisplays().find(p=>p.id.toString()===e.toString())||B.getPrimaryDisplay(),o=560,a=180,l=Math.round(r.bounds.x+(r.bounds.width-o)/2),f=r.bounds.y;s.setBounds({x:l,y:f,width:o,height:a}),s.show(),v()}});i.handle("update-window-position",(t,e,n)=>{});i.handle("set-auto-launch",(t,e)=>{try{h.setLoginItemSettings({openAtLogin:e,path:h.getPath("exe")}),e||Oe(),_(),g&&!g.isDestroyed()&&g.webContents.send("settings:auto-launch-changed",e),s&&!s.isDestroyed()&&s.webContents.send("settings:auto-launch-changed",e)}catch(n){console.error("Failed to set login item settings on Windows:",n)}});i.handle("get-auto-launch",()=>{try{return h.getLoginItemSettings().openAtLogin}catch{return!1}});i.handle("create-desktop-shortcut",()=>{try{const t=h.getPath("desktop"),e=m.join(t,"Quick Pill.lnk"),n=process.execPath||h.getPath("exe");let r=z("ico");d.existsSync(r)||(r=z("png"));const o={target:n,cwd:m.dirname(n),description:"Quick Pill - Dynamic Island for Windows",appUserModelId:"com.neosparkx.quickpill"};return d.existsSync(r)&&(o.icon=r,o.iconIndex=0),{success:C.writeShortcutLink(e,"create",o),path:e}}catch(t){return c("create-desktop-shortcut error:",t),{success:!1,error:(t==null?void 0:t.message)||String(t)}}});function Oe(){if(process.platform==="win32")try{const t=["electron.app.Ripple","electron.app.Electron","electron.app.Quick Pill","Ripple"];for(const e of t)M(`reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "${e}" /f`,()=>{})}catch{}}const xt=["https://raw.githubusercontent.com/pikri-beep/Quick-Pill-Dynamic-Island-for-Windows/main/web%20app/public/version.json","https://raw.githubusercontent.com/nabil24024004/Quick-Pill/main/web%20app/public/version.json"];class It extends tt{constructor(){super(),this.manifestUrls=[...xt],this.currentVersion=h?h.getVersion():"5.5.2",this.status="idle",this.updateInfo=null,this.downloadedFilePath=null,this.currentDownloadRequest=null,this.lastProgressEmit=0;const e=lt();this.autoDownload=e,this.autoInstall=e}compareVersions(e,n){const r=(e||"0.0.0").replace(/^v/i,"").trim(),o=(n||"0.0.0").replace(/^v/i,"").trim(),[a,l]=r.split("-"),[f,p]=o.split("-"),u=a.split(".").map(w=>parseInt(w,10)||0),y=f.split(".").map(w=>parseInt(w,10)||0),b=Math.max(u.length,y.length);for(let w=0;w<b;w++){const k=u[w]||0,x=y[w]||0;if(k>x)return 1;if(k<x)return-1}return!l&&p?1:l&&!p?-1:l&&p?l.localeCompare(p):0}getPlatformKey(){return`win32-${process.arch}`}fetchJson(e,n=12e3,r=5){return new Promise((o,a)=>{if(r<=0)return a(new Error("Too many redirects while fetching update manifest."));const f=(e.startsWith("https")?We:Me).get(e,{headers:{"User-Agent":`QuickPill-Updater/${this.currentVersion} (${process.platform} ${process.arch})`,Accept:"application/json, text/plain, */*"},timeout:n},p=>{if(p.statusCode>=300&&p.statusCode<400&&p.headers.location){const y=new URL(p.headers.location,e).href;return this.fetchJson(y,n,r-1).then(o).catch(a)}if(p.statusCode!==200)return p.resume(),a(new Error(`Server returned HTTP ${p.statusCode}: ${p.statusMessage}`));let u="";p.setEncoding("utf8"),p.on("data",y=>{u+=y}),p.on("end",()=>{try{const y=JSON.parse(u);o(y)}catch(y){a(new Error(`Invalid JSON received from update manifest: ${y.message}`))}})});f.on("timeout",()=>{f.destroy(),a(new Error("Connection timed out while checking for updates."))}),f.on("error",p=>{a(p)})})}async checkForUpdates(){var e,n,r;if(this.status==="checking"||this.status==="downloading")return{status:this.status,updateInfo:this.updateInfo};this.status="checking",this.emit("checking");try{let o=null,a=null;for(const p of this.manifestUrls)try{const u=`${p}${p.includes("?")?"&":"?"}_t=${Date.now()}`,y=await this.fetchJson(u);if(y&&y.version){o=y;break}}catch(u){a=u}if(!o||!o.version)throw a||new Error('Update manifest is missing required "version" field.');const l=o.version;if(this.compareVersions(l,this.currentVersion)>0){const p=this.getPlatformKey(),u=((e=o.platforms)==null?void 0:e[p])||((n=o.platforms)==null?void 0:n[`${process.platform}-x64`])||((r=o.platforms)==null?void 0:r["win32-x64"]),y=(u==null?void 0:u.url)||"";return this.updateInfo={version:l,currentVersion:this.currentVersion,name:o.name||`Quick Pill v${l}`,releaseDate:o.releaseDate||"",mandatory:!!o.mandatory,changelog:Array.isArray(o.changelog)?o.changelog:[],downloadUrl:y,sha256:(u==null?void 0:u.sha256)||"",size:(u==null?void 0:u.size)||0,installerType:(u==null?void 0:u.installerType)||"nsis"},this.status="available",this.emit("update-available",this.updateInfo),this.autoDownload&&y&&(c(`[Auto-Updater] New update v${l} detected. Automatically downloading in background...`),setTimeout(()=>{this.startDownload().catch(b=>{c("[Auto-Updater] Automatic background download failed:",b)})},1e3)),{status:"available",updateInfo:this.updateInfo}}else{this.status="not-available";const p={currentVersion:this.currentVersion,latestVersion:l};return this.emit("update-not-available",p),{status:"not-available",updateInfo:p}}}catch(o){this.status="error";const a=o.message||"Unknown error occurred while checking for updates.";return this.emit("error",a),{status:"error",error:a}}}startDownload(){if(!this.updateInfo||!this.updateInfo.downloadUrl){const a=new Error("No update available or download URL is missing.");return this.emit("error",a.message),Promise.reject(a)}if(this.status==="downloading")return Promise.resolve({status:"downloading"});this.status="downloading",this.emit("download-started",this.updateInfo);const e=h.getPath("temp"),r=`quick-pill-update-v${this.updateInfo.version}.exe`,o=m.join(e,r);return new Promise((a,l)=>{if(d.existsSync(o))try{d.unlinkSync(o)}catch{}const f=d.createWriteStream(o);let p=0,u=this.updateInfo.size||0,y=0,b=Date.now(),w=0,k=!1;const x=O=>{if(!k){k=!0;try{f.destroy()}catch{}try{d.existsSync(o)&&d.unlinkSync(o)}catch{}this.status="error",c(`[Auto-Updater] ${O.message}`),this.emit("error",O.message),l(O)}},Ne=(O,F=5)=>{if(k)return;if(F<=0)return x(new Error("Too many redirects while downloading update binary."));const me=(O.startsWith("https")?We:Me).get(O,{headers:{"User-Agent":`QuickPill-Updater/${this.currentVersion} (${process.platform} ${process.arch})`}},I=>{if(k){I.resume();return}if(I.statusCode>=300&&I.statusCode<400&&I.headers.location){I.resume();const Q=new URL(I.headers.location,O).href;return Ne(Q,F-1)}if(I.statusCode!==200)return x(new Error(`Download failed with status HTTP ${I.statusCode}: ${I.statusMessage}`));const ge=parseInt(I.headers["content-length"],10);!isNaN(ge)&&ge>0&&(u=ge),I.on("data",Q=>{p+=Q.length,f.write(Q);const ue=Date.now();if(ue-this.lastProgressEmit>=100||p===u){const _e=(ue-b)/1e3;_e>=.5&&(w=Math.round((p-y)/_e),y=p,b=ue);const Qe={percent:u>0?Math.min(100,Math.round(p/u*1e3)/10):0,transferredBytes:p,totalBytes:u,speedBytesPerSec:w};this.lastProgressEmit=ue,this.emit("download-progress",Qe)}}),I.on("end",()=>{k||f.end()}),I.on("error",Q=>{x(Q)})});this.currentDownloadRequest=me,me.on("error",I=>{x(I)})};f.on("finish",()=>{if(k)return;if(this.currentDownloadRequest=null,this.updateInfo.sha256&&this.updateInfo.sha256.trim()!=="")try{const F=et.createHash("sha256"),De=d.readFileSync(o);if(F.update(De),F.digest("hex").toLowerCase()!==this.updateInfo.sha256.trim().toLowerCase())return x(new Error("Integrity check failed (SHA-256 mismatch). The downloaded file might be corrupted."))}catch(F){console.warn("Could not verify SHA-256 checksum:",F)}this.downloadedFilePath=o,this.status="downloaded";const O={version:this.updateInfo.version,filePath:o};c(`[Auto-Updater] Update v${this.updateInfo.version} downloaded successfully (${p} bytes).`),this.emit("update-downloaded",O),a(O),this.autoInstall&&(c(`[Auto-Updater] Update v${this.updateInfo.version} downloaded successfully. Automatically installing in background in 2 seconds...`),setTimeout(()=>{this.installAndRelaunch()},2e3))}),f.on("error",O=>{x(O)}),Ne(this.updateInfo.downloadUrl)})}cancelDownload(){if(this.currentDownloadRequest){try{this.currentDownloadRequest.destroy()}catch{}this.currentDownloadRequest=null}this.status="idle",this.emit("download-cancelled")}installAndRelaunch(){if(!this.downloadedFilePath||!d.existsSync(this.downloadedFilePath)){const a=new Error("No downloaded update file found to install.");return c("[Auto-Updater] "+a.message),this.emit("error",a.message),!1}if(h&&h.isPackaged===!1){const a=new Error("Automatic installation is only available for the packaged Quick Pill build.");return c("[Auto-Updater] "+a.message),this.emit("error",a.message),!1}const e=this.downloadedFilePath,n=process.pid;let r="";try{r=h.getPath("exe")}catch{}try{typeof D<"u"&&D&&D.stop()}catch{}let o=null;try{o=ot({installerPath:e,currentPid:n,appExePath:r,logPath:Ge()})}catch(a){return c("[Auto-Updater] Failed to build install helper:",a),this.emit("error",`Failed to prepare the installer: ${a.message}`),!1}c(`[Auto-Updater] Handing the update over to the installer helper (pid ${n})`),c(`[Auto-Updater] Installer: ${e}`);try{const a=Ie(o.command,o.args,{detached:!0,stdio:"ignore",windowsHide:!0});a.on("error",l=>{c("[Auto-Updater] Installer helper failed to start:",l)}),a.unref()}catch(a){return c("[Auto-Updater] Failed to launch the installer helper:",a),this.emit("error",`Failed to launch the installer: ${a.message}`),!1}return setTimeout(()=>{try{h&&(h.isQuitting=!0,h.quit())}catch{}setTimeout(()=>{try{process.exit(0)}catch{}},1500)},200),!0}}const S=new It;function J(t,e){s&&!s.isDestroyed()&&s.webContents.send("update-event",{event:t,data:e}),g&&!g.isDestroyed()&&g.webContents.send("update-event",{event:t,data:e})}S.on("checking",()=>J("checking"));S.on("update-available",t=>J("available",t));S.on("update-not-available",t=>J("not-available",t));S.on("download-started",t=>J("download-started",t));S.on("download-progress",t=>J("download-progress",t));S.on("update-downloaded",t=>J("downloaded",t));S.on("download-cancelled",()=>J("cancelled"));S.on("error",t=>J("error",t));i.handle("check-for-updates",async()=>await S.checkForUpdates());i.handle("start-update-download",async()=>await S.startDownload());i.handle("cancel-update-download",()=>(S.cancelDownload(),!0));i.handle("install-update",()=>S.installAndRelaunch());i.handle("get-updater-state",()=>({status:S.status,updateInfo:S.updateInfo,downloadedFilePath:S.downloadedFilePath,currentVersion:S.currentVersion}));i.handle("get-app-version",()=>h.getVersion());i.handle("get-auto-download-install",()=>S.autoDownload&&S.autoInstall);i.handle("set-auto-download-install",(t,e)=>{const n=!!e;return S.autoDownload=n,S.autoInstall=n,dt("autoDownloadInstall",n),n});const se=nt({autoUpdater:S,openPath:async t=>{try{d.existsSync(t)&&(d.statSync(t).isDirectory()?await C.openPath(t):C.showItemInFolder(t))}catch(e){c("[progress openPath error]",e)}}});se.coordinator.on("update",t=>{s&&!s.isDestroyed()&&s.webContents.send("progress:update",t)});i.handle("progress:get-snapshot",()=>se.coordinator.getSnapshot());i.handle("progress:execute-action",async(t,e,n,r)=>await se.coordinator.executeAction(e,n,r));i.handle("progress:start-file-op",async(t,e)=>await se.fileOpsProvider.startCopy(e));i.handle("progress:start-hash-op",async(t,e)=>await se.fileOpsProvider.startHash(e));i.handle("progress:clear-history",()=>(se.registry.clearHistory(),!0));i.handle("progress:select-file",async()=>{if(!s)return null;const t=await Ue.showOpenDialog(s,{properties:["openFile"]});return t.canceled||!t.filePaths.length?null:t.filePaths[0]});const z=(t=null)=>{const e=t||"ico";try{const n=m.join(h.getAppPath(),`src/assets/icons/icon.${e}`);if(d.existsSync(n))return n}catch{}try{const n=m.join(process.resourcesPath,`icon.${e}`);if(d.existsSync(n))return n;const r=m.join(process.resourcesPath,`assets/icons/icon.${e}`);if(d.existsSync(r))return r}catch{}return m.join(__dirname,`../../src/assets/icons/icon.${e}`)},Pe=()=>{const t=B.getPrimaryDisplay(),{x:e,y:n,width:r,height:o}=t.bounds,a=560,l=180,f=Math.round(e+(r-a)/2),p=n;s=new ke({width:a,height:l,x:f,y:p,backgroundColor:"#00000000",transparent:!0,alwaysOnTop:!0,resizable:!1,minimizable:!1,maximizable:!1,fullscreenable:!1,frame:!1,thickFrame:!1,hasShadow:!1,skipTaskbar:!0,icon:z(),type:"toolbar",fullscreen:!1,visibleOnFullScreen:!0,acceptFirstMouse:!0,webPreferences:{preload:m.join(__dirname,"preload.js"),devTools:!h.isPackaged,backgroundThrottling:!1},show:!0}),s.setIgnoreMouseEvents(!0,{forward:!0}),s.once("ready-to-show",()=>{s&&(s.show(),v(),s.focus())}),s.webContents.on("console-message",(u,y,b,w,k)=>{y>=2&&c(`[RENDERER CONSOLE ${y===3?"ERROR":"WARN"}] (${k?m.basename(k):"unknown"}:${w}) ${b}`)}),s.webContents.on("render-process-gone",(u,y)=>{if(c(`[RENDERER PROCESS GONE] reason=${y==null?void 0:y.reason}, exitCode=${y==null?void 0:y.exitCode}`),s&&!s.isDestroyed())try{s.setIgnoreMouseEvents(!0,{forward:!0})}catch{}}),s.on("blur",()=>{v()}),s.on("minimize",()=>{s&&!s.isDestroyed()&&(s.restore(),v())}),s.on("restore",()=>{v()}),s.on("show",()=>{v()}),setTimeout(()=>{s&&!s.isVisible()&&(s.show(),v(),s.focus())},5e3),s.on("closed",()=>{s=null});try{s.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0})}catch{}if(!h.isPackaged&&process.env.NODE_ENV==="development")s.loadURL("http://localhost:5173");else{const u=[m.join(__dirname,"../renderer/main_window/index.html"),m.join(h.getAppPath(),".vite/renderer/main_window/index.html"),m.join(h.getAppPath(),"dist/index.html"),m.join(__dirname,"index.html"),m.join(h.getAppPath(),"index.html")];let y=!1;for(const b of u)if(d.existsSync(b)){c(`Loading renderer from: ${b}`),s.loadFile(b),y=!0;break}y||(c("No packaged renderer HTML found, falling back to localhost:5173"),s.loadURL("http://localhost:5173"))}};let g=null;function Ee(){if(g&&!g.isDestroyed()){g.show(),g.focus();return}if(g=new ke({width:680,height:560,title:"Quick Pill Settings",backgroundColor:"#121212",autoHideMenuBar:!0,resizable:!0,minimizable:!0,maximizable:!1,frame:!1,icon:z(),webPreferences:{preload:m.join(__dirname,"preload.js"),devTools:!h.isPackaged,backgroundThrottling:!1}}),!h.isPackaged&&process.env.NODE_ENV==="development")g.loadURL("http://localhost:5173#settings");else{const t=[m.join(__dirname,"../renderer/main_window/index.html"),m.join(h.getAppPath(),".vite/renderer/main_window/index.html"),m.join(h.getAppPath(),"dist/index.html"),m.join(__dirname,"index.html"),m.join(h.getAppPath(),"index.html")];for(const e of t)if(d.existsSync(e)){g.loadFile(e,{hash:"settings"});break}}g.on("closed",()=>{g=null})}function ce(){try{if(!s||s.isDestroyed()){Pe();return}s.isVisible()||s.show(),s.restore(),v(),s.focus(),s.webContents.send("toggle-minimal-notch-hotkey")}catch(t){c("restoreAndShowQuickPill error:",t)}}function _(){if(!G||G.isDestroyed())return;const t=h.getLoginItemSettings().openAtLogin,e=Ye.buildFromTemplate([{label:"Show Quick Pill",click:()=>{ce()}},{type:"separator"},{label:"Start with Windows",type:"checkbox",checked:t,click:n=>{try{h.setLoginItemSettings({openAtLogin:n.checked,path:h.getPath("exe")}),n.checked||Oe(),g&&!g.isDestroyed()&&g.webContents.send("settings:auto-launch-changed",n.checked),s&&!s.isDestroyed()&&s.webContents.send("settings:auto-launch-changed",n.checked)}catch{}_()}},{label:"Mascot Mode",type:"checkbox",checked:L,click:n=>{L=n.checked,je(L),s&&!s.isDestroyed()&&s.webContents.send("settings:mascot-mode-changed",L),_()}},{label:"Minimal Notch",type:"checkbox",checked:A,click:n=>{A=n.checked,ae(A),s&&!s.isDestroyed()&&s.webContents.send("settings:minimal-notch-changed",A),_()}},{type:"separator"},{label:"Settings...",click:()=>{Ee()}},{type:"separator"},{label:"Exit",click:()=>{h.quit()}}]);G.setContextMenu(e)}let Re=!1,W=null,Ct=null;function Ot(){if(process.platform==="win32")try{const t=require("koffi"),e=t.load("user32.dll"),n=t.load("gdi32.dll"),r=t.struct("RECT",{left:"long",top:"long",right:"long",bottom:"long"});W={GetForegroundWindow:e.func("GetForegroundWindow","intptr_t",[]),IsZoomed:e.func("IsZoomed","bool",["intptr_t"]),GetWindowRect:e.func("GetWindowRect","bool",["intptr_t",t.out(t.pointer(r))]),GetClassNameA:e.func("GetClassNameA","int",["intptr_t",t.out(t.pointer("char")),"int"]),GetWindowTextA:e.func("GetWindowTextA","int",["intptr_t",t.out(t.pointer("char")),"int"]),GetDC:e.func("GetDC","intptr_t",["intptr_t"]),ReleaseDC:e.func("ReleaseDC","int",["intptr_t","intptr_t"]),GetKeyState:e.func("GetKeyState","int16_t",["int"])},Ct={GetPixel:n.func("GetPixel","uint32_t",["intptr_t","int","int"])}}catch(t){c("[Obstruction] Koffi user32/gdi32 init failed, falling back:",t)}}function Et(){process.platform==="win32"&&(Ot(),setInterval(()=>{if(!s||s.isDestroyed())return;let t=!1;if(W)try{const e=W.GetForegroundWindow();if(e&&e!==0){const n=Buffer.alloc(256);W.GetClassNameA(e,n,256);const r=n.toString("utf8").replace(/\0.*$/,"").trim(),o=r==="Progman"||r==="WorkerW"||r==="Shell_TrayWnd"||r==="Shell_SecondaryTrayWnd";let a=!1;try{const l=s.getNativeWindowHandle();l.readBigInt64LE&&l.readBigInt64LE(0)===BigInt(e)&&(a=!0)}catch{}try{if(g&&!g.isDestroyed()){const l=g.getNativeWindowHandle();l.readBigInt64LE&&l.readBigInt64LE(0)===BigInt(e)&&(a=!0)}}catch{}if(!o&&!a){const l={};W.GetWindowRect(e,l);const f=W.IsZoomed(e),p=B.getPrimaryDisplay(),u=p.bounds.width,y=p.bounds.height,b=(l.right||0)-(l.left||0),w=(l.bottom||0)-(l.top||0);l.left<=0&&l.top<=0&&l.right>=u&&l.bottom>=y&&!f?t=!0:f||l.top<=8&&b>=u*.9?te&&(t=!0):t=!1}}}catch{}t!==Re&&(Re=t,s&&!s.isDestroyed()&&s.webContents.send("desktop:obstruction-status",{isObstructed:t}))},250))}h.whenReady().then(()=>{h.setAppUserModelId("com.neosparkx.quickpill"),Oe(),Pe(),Ft(),Rt(),Et(),Mt(),xe(),T().getCatalog().catch(t=>c("Failed to warm launcher catalog:",t)),h.on("activate",()=>{ke.getAllWindows().length===0&&Pe()});try{let t=z(),e=V.createFromPath(t);e.isEmpty()&&(t=z("png"),e=V.createFromPath(t));const n=e.isEmpty()?t:e.resize({width:16,height:16});G=new Ze(n),G.setToolTip("Quick Pill"),G.on("click",()=>{ce()}),G.on("double-click",()=>{ce()}),_()}catch(t){console.error("Failed to create tray:",t)}B.on("display-metrics-changed",()=>{v()}),B.on("display-added",()=>{v()}),B.on("display-removed",()=>{v()}),we&&(we.on("resume",()=>{s&&!s.isDestroyed()&&s.webContents.send("system-resume");try{typeof $<"u"&&($!=null&&$.registry)&&$.registry.checkSnoozedDue()}catch{}setTimeout(v,500),setTimeout(v,2e3)}),we.on("unlock-screen",()=>{s&&!s.isDestroyed()&&s.webContents.send("system-resume");try{typeof $<"u"&&($!=null&&$.registry)&&$.registry.checkSnoozedDue()}catch{}setTimeout(v,500),setTimeout(v,2e3)})),setInterval(()=>{if(R&&s&&!s.isDestroyed()&&s.isVisible())if(!s.isAlwaysOnTop())v();else try{s.moveTop()}catch{}},2500),setTimeout(()=>{S.checkForUpdates().catch(t=>{c("Auto-update check on startup error:",t)})},4e3),setInterval(()=>{S.checkForUpdates().catch(t=>{c("Periodic background update check error:",t)})},2*60*60*1e3)});const qe=m.join(h.getPath("userData"),"get-media.ps1"),Nt=`[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime
Add-Type -AssemblyName System.Drawing

$asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { 
    $_.Name -eq 'AsTask' -and 
    $_.IsGenericMethodDefinition -and 
    $_.GetGenericArguments().Count -eq 1 -and 
    $_.GetParameters().Count -eq 1
} | Select-Object -First 1

function Await-Operation($asyncOp, $type) {
    if (-not $asyncOp) { return $null }
    try {
        $task = $asTaskGeneric.MakeGenericMethod($type).Invoke($null, @($asyncOp))
        [void]$task.Wait(2000)
        return $task.Result
    } catch {
        return $null
    }
}

function Get-AppIconBase64($appId) {
    try {
        $proc = $null
        if ($appId) {
            $cleanName = $appId.Split('!')[-1].Replace('.exe','')
            $proc = Get-Process | Where-Object { $_.ProcessName -eq $cleanName -or $cleanName -like "*$($_.ProcessName)*" } | Select-Object -First 1
        }
        if (-not $proc) {
            $proc = Get-Process | Where-Object { $_.MainWindowTitle -and ($_.ProcessName -match "chrome|msedge|brave|firefox|spotify|vlc|music") } | Select-Object -First 1
        }
        if ($proc) {
            $path = $proc.MainModule.FileName
            if ($path) {
                $icon = [System.Drawing.Icon]::ExtractAssociatedIcon($path)
                if ($icon) {
                    $bmp = $icon.ToBitmap()
                    $ms = New-Object System.IO.MemoryStream
                    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
                    $bytes = $ms.ToArray()
                    $ms.Close()
                    $bmp.Dispose()
                    $icon.Dispose()
                    if ($bytes.Length -gt 0) {
                        return "data:image/png;base64," + [Convert]::ToBase64String($bytes)
                    }
                }
            }
        }
    } catch {}
    return ""
}

$inputInterface = [Windows.Storage.Streams.IInputStream, Windows.Storage.Streams, ContentType = WindowsRuntime]
$asStreamMethod = [System.IO.WindowsRuntimeStreamExtensions].GetMethod('AsStreamForRead', [type[]]@($inputInterface))

$mgrType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]
$propsType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties, Windows.Media.Control, ContentType = WindowsRuntime]
$streamType = [Windows.Storage.Streams.IRandomAccessStreamWithContentType, Windows.Storage.Streams, ContentType = WindowsRuntime]
$streamRefType = [Windows.Storage.Streams.IRandomAccessStream, Windows.Storage.Streams, ContentType = WindowsRuntime]

$asyncOp = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]::RequestAsync()
$manager = Await-Operation $asyncOp $mgrType

if ($manager) {
    $session = $manager.GetCurrentSession()
    if (-not $session) {
        $sessions = $manager.GetSessions()
        if ($sessions -and $sessions.Count -gt 0) {
            $session = $sessions | Where-Object { $_.GetPlaybackInfo().PlaybackStatus -eq [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionPlaybackStatus]::Playing } | Select-Object -First 1
            if (-not $session) { $session = $sessions[0] }
        }
    }
    if ($session) {
        $propsOp = $session.TryGetMediaPropertiesAsync()
        $props = Await-Operation $propsOp $propsType
        $playback = $session.GetPlaybackInfo()
        $status = if ($playback) { $playback.PlaybackStatus.ToString().ToLower() } else { "stopped" }

        $timeline = $session.GetTimelineProperties()
        $basePos = if ($timeline -and $timeline.Position) { $timeline.Position.TotalSeconds } else { 0 }
        if ($status -eq "playing" -and $timeline -and $timeline.LastUpdatedTime) {
            $elapsed = ([DateTimeOffset]::UtcNow - $timeline.LastUpdatedTime).TotalSeconds
            if ($elapsed -gt 0 -and $elapsed -lt 86400) {
                $basePos += $elapsed
            }
        }
        $duration = if ($timeline -and $timeline.EndTime) { [math]::Round($timeline.EndTime.TotalSeconds) } else { 0 }
        if ($duration -gt 0 -and $basePos -gt $duration) { $basePos = $duration }
        $position = [math]::Round($basePos)

        $sourceApp = $session.SourceAppUserModelId
        $artwork = ""

        if ($props -and $props.Thumbnail) {
            try {
                $thumbOp = $props.Thumbnail.OpenReadAsync()
                $stream = Await-Operation $thumbOp $streamType
                if (-not $stream) {
                    $stream = Await-Operation $thumbOp $streamRefType
                }
                if ($stream) {
                    $netStream = $asStreamMethod.Invoke($null, @($stream))
                    if ($netStream) {
                        $mem = New-Object System.IO.MemoryStream
                        $netStream.CopyTo($mem)
                        $bytes = $mem.ToArray()
                        $mem.Close()
                        if ($bytes.Length -gt 0) {
                            $artwork = "data:image/png;base64," + [Convert]::ToBase64String($bytes)
                        }
                    }
                }
            } catch {}
        }

        if (-not $artwork) {
            $artwork = Get-AppIconBase64 $sourceApp
        }

        $info = @{
            Title = if ($props) { $props.Title } else { "" }
            Artist = if ($props) { $props.Artist } else { "" }
            Album = if ($props) { $props.AlbumTitle } else { "" }
            Status = $status
            Source = $sourceApp
            Artwork = $artwork
            Position = $position
            Duration = $duration
        }
        $info | ConvertTo-Json -Compress
        exit
    }
}
Write-Output "null"
`,Ve=m.join(h.getPath("userData"),"control-media.ps1"),Dt=`param([string]$command = "playpause", [double]$seekSeconds = 0)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime

$asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { 
    $_.Name -eq 'AsTask' -and 
    $_.IsGenericMethodDefinition -and 
    $_.GetGenericArguments().Count -eq 1 -and 
    $_.GetParameters().Count -eq 1
} | Select-Object -First 1

function Await-Operation($asyncOp, $type) {
    if (-not $asyncOp) { return $null }
    try {
        $task = $asTaskGeneric.MakeGenericMethod($type).Invoke($null, @($asyncOp))
        [void]$task.Wait(2000)
        return $task.Result
    } catch {
        return $null
    }
}

$mgrType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]
$asyncOp = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]::RequestAsync()
$manager = Await-Operation $asyncOp $mgrType

if ($manager) {
    $session = $manager.GetCurrentSession()
    if (-not $session) {
        $sessions = $manager.GetSessions()
        if ($sessions -and $sessions.Count -gt 0) {
            $session = $sessions | Where-Object { $_.GetPlaybackInfo().PlaybackStatus -eq [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionPlaybackStatus]::Playing } | Select-Object -First 1
            if (-not $session) { $session = $sessions[0] }
        }
    }
    if ($session) {
        $boolType = [bool]
        switch ($command.ToLower()) {
            "playpause" {
                $success = Await-Operation ($session.TryTogglePlayPauseAsync()) $boolType
                if (-not $success) {
                    $pb = $session.GetPlaybackInfo()
                    if ($pb.PlaybackStatus -eq [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionPlaybackStatus]::Playing) {
                        Await-Operation ($session.TryPauseAsync()) $boolType
                    } else {
                        Await-Operation ($session.TryPlayAsync()) $boolType
                    }
                }
            }
            "play" {
                Await-Operation ($session.TryPlayAsync()) $boolType
            }
            "pause" {
                Await-Operation ($session.TryPauseAsync()) $boolType
            }
            "next" {
                Await-Operation ($session.TrySkipNextAsync()) $boolType
            }
            "previous" {
                Await-Operation ($session.TrySkipPreviousAsync()) $boolType
            }
            "stop" {
                Await-Operation ($session.TryStopAsync()) $boolType
            }
            "seek" {
                $ticks = [long]($seekSeconds * 10000000)
                Await-Operation ($session.TryChangePlaybackPositionAsync($ticks)) $boolType
            }
        }
        exit 0
    }
}

# Fallback to keybd_event if GSMTC is unavailable or had no session
if ($command -in @("playpause", "next", "previous")) {
    $vk = 0xCD
    if ($command -eq "next") { $vk = 0xB0 }
    elseif ($command -eq "previous") { $vk = 0xB1 }
    $type = '[DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);'
    $MediaKey = Add-Type -MemberDefinition $type -Name "WinMediaKeyFallback" -Namespace "WinAPI" -PassThru
    $MediaKey::keybd_event($vk, 0, 0, [UIntPtr]::Zero)
    $MediaKey::keybd_event($vk, 0, 2, [UIntPtr]::Zero)
}
`;try{d.writeFileSync(qe,Nt,"utf8")}catch(t){console.error("Failed to write get-media.ps1 script:",t)}try{d.writeFileSync(Ve,Dt,"utf8")}catch(t){console.error("Failed to write control-media.ps1 script:",t)}let be=!1;i.handle("get-system-media",async()=>be?null:(be=!0,new Promise(t=>{const e=n=>{be=!1,t(n)};de("powershell",["-NoProfile","-ExecutionPolicy","Bypass","-File",qe],{maxBuffer:10*1024*1024,encoding:"utf8"},(n,r)=>{if(n||!r||r.trim()==="null"||r.trim()==="'null'"){M(`powershell -NoProfile -Command "Get-Process | Where-Object {$_.ProcessName -eq 'Spotify'} | Select-Object MainWindowTitle"`,{encoding:"utf8"},(o,a)=>{var f;if(o||!a)return e(null);const l=(f=a.split(`
`).find(p=>p.includes("-")))==null?void 0:f.trim();if(l){const p=l.split(" - ");let u="Unknown",y=l;p.length>1&&(u=p[0].trim(),y=p.slice(1).join(" - ").trim()),e({name:y||l,artist:u||"Unknown",state:"playing",source:"Spotify",position:0,duration:0})}else e(null)});return}try{const o=JSON.parse(r.trim());if(!o||!o.Title&&!o.Artist)return e(null);e({name:o.Title||"Unknown Title",artist:o.Artist||"Unknown Artist",album:o.Album||"",artwork_url:o.Artwork||null,state:o.Status==="playing"?"playing":"paused",source:o.Source||"System",position:Number(o.Position)||0,duration:Number(o.Duration)||0})}catch{e(null)}})})));i.handle("get-bluetooth-status",async()=>new Promise(t=>{const n=Buffer.from(`
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$devs = @(Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'OK' -and $_.Present -eq $true -and $_.InstanceId -match 'BTHENUM' })
$names = @($devs | ForEach-Object { $_.FriendlyName })
@{ connected = ($devs.Count -gt 0); devices = $names } | ConvertTo-Json -Compress
`,"utf16le").toString("base64");M(`powershell -NoProfile -EncodedCommand ${n}`,(r,o)=>{if(r||!o)return t({connected:!1,devices:[]});try{const a=JSON.parse(o.trim());t({connected:!!a.connected,devices:Array.isArray(a.devices)?a.devices:a.devices?[a.devices]:[]})}catch{t({connected:!1,devices:[]})}})}));i.handle("get-camera-status",async()=>new Promise(t=>{de("reg",["query","HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\webcam","/s"],(e,n)=>{if(e||!n)return t(!1);const r=n.match(/LastUsedTimeStop\s+REG_QWORD\s+0x0\b/i);t(!!r)})}));i.handle("get-microphone-status",async()=>new Promise(t=>{de("reg",["query","HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone","/s"],(e,n)=>{if(e||!n)return t(!1);const r=n.match(/LastUsedTimeStop\s+REG_QWORD\s+0x0\b/i);t(!!r)})}));h.on("window-all-closed",()=>{G||h.quit()});i.handle("control-system-media",async(t,e,...n)=>{const r=typeof n[0]=="number"?n[0]:0;c(`Executing media control: ${e} ${r>0?`(seek: ${r}s)`:""}`),de("powershell.exe",["-NoProfile","-ExecutionPolicy","Bypass","-File",Ve,"-command",e,"-seekSeconds",r.toString()],{timeout:4e3},o=>{o&&c("Media control error:",o)})});let re=null;function _t(){const t=Te.cpus();if(!t||t.length===0)return 0;if(!re||re.length!==t.length)return re=t,0;let e=0,n=0;for(let o=0;o<t.length;o++){const a=t[o],l=re[o];let f=a.times.idle-l.times.idle,p=0;for(const u in a.times)p+=a.times[u]-l.times[u];e+=f,n+=p}if(re=t,n===0)return 0;const r=e/n;return Math.max(0,Math.min(100,Math.round((1-r)*100)))}function Wt(){const t=Te.totalmem(),e=Te.freemem();return t?Math.max(0,Math.min(100,Math.round((t-e)/t*100))):0}i.handle("get-system-metrics",async()=>({cpu:_t(),ram:Wt()}));let q=[],K="";function Mt(){try{const t=U.readText().trim();t&&(K=t,q.push({id:"clip-"+Date.now(),text:t,timestamp:Date.now()}))}catch{}setInterval(()=>{try{const t=U.readText().trim();t&&t!==K&&(K=t,q=[{id:"clip-"+Date.now()+"-"+Math.random().toString(36).slice(2,6),text:t,timestamp:Date.now()},...q.filter(n=>n.text!==t)].slice(0,15),s&&!s.isDestroyed()&&s.webContents.send("clipboard:update",q))}catch{}},600)}i.handle("clipboard:get-history",()=>q);i.on("clipboard:write",(t,e)=>{try{e&&(K=String(e).trim(),U.writeText(String(e)))}catch{}});i.on("clipboard:clear",()=>{try{q=[],K="",U.clear(),s&&!s.isDestroyed()&&s.webContents.send("clipboard:update",[])}catch{}});i.handle("get-clipboard-text",async()=>{try{return U.readText()}catch{return""}});i.handle("write-clipboard-text",async(t,e)=>{try{return e?(K=String(e).trim(),U.writeText(String(e))):U.clear(),!0}catch{return!1}});i.handle("clear-clipboard",async()=>{try{return q=[],K="",U.clear(),s&&!s.isDestroyed()&&s.webContents.send("clipboard:update",[]),!0}catch{return!1}});i.handle("control-system-volume",async(t,e)=>{if(process.platform==="win32"){let n="0xAF";e==="down"&&(n="0xAE"),e==="mute"&&(n="0xAD");const r=`
$type = '[DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);'
$MediaKey = Add-Type -MemberDefinition $type -Name "WinVolKey" -Namespace "WinAPI" -PassThru
$MediaKey::keybd_event(${n}, 0, 0, [UIntPtr]::Zero)
$MediaKey::keybd_event(${n}, 0, 2, [UIntPtr]::Zero)
`,o=ye(r);return M(`powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${o}`,a=>{a&&c("Volume control error:",a)}),!0}return!1});let Se=null,Ae=null;function Ft(){process.platform==="win32"&&setInterval(()=>{if(!(!s||s.isDestroyed()))try{if(W&&W.GetKeyState){const t=(W.GetKeyState(144)&1)!==0;Se!==null&&t!==Se&&s.webContents.send("key-lock-change",{key:"NumLock",state:t}),Se=t;const e=(W.GetKeyState(20)&1)!==0;Ae!==null&&e!==Ae&&s.webContents.send("key-lock-change",{key:"CapsLock",state:e}),Ae=e}}catch{}},150)}let pe=null;function Rt(){if(process.platform!=="win32")return;let t=!1;setInterval(()=>{!s||s.isDestroyed()||t||(t=!0,M("wmic logicaldisk where drivetype=2 get name,volumename /format:csv",(e,n)=>{var a,l;if(t=!1,e)return;const r=new Map,o=n.trim().split(/\r?\n/).filter(f=>f.trim()&&!f.startsWith("Node"));for(const f of o){const p=f.trim().split(",");if(p.length>=3){const u=(a=p[1])==null?void 0:a.trim(),y=((l=p[2])==null?void 0:l.trim())||"USB Drive";u&&r.set(u,y)}}if(pe!==null&&s&&!s.isDestroyed()){for(const[f,p]of r)pe.has(f)||s.webContents.send("usb-change",{action:"connected",drive:f,name:p});for(const[f]of pe)r.has(f)||s.webContents.send("usb-change",{action:"disconnected",drive:f,name:"USB Drive"})}pe=r}))},5e3)}const He=m.join(h.getPath("userData"),"get-notifications.ps1"),Ut=`[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime

[void][Windows.UI.Notifications.Management.UserNotificationListener, Windows.UI.Notifications, ContentType = WindowsRuntime]
[void][Windows.UI.Notifications.UserNotification, Windows.UI.Notifications, ContentType = WindowsRuntime]

$asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.IsGenericMethodDefinition -and $_.GetGenericArguments().Count -eq 1 -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name.StartsWith('IAsyncOperation')
}[0]

function Await-Op($asyncOp, $type) {
    if (-not $asyncOp) { return $null }
    try {
        $task = $asTaskGeneric.MakeGenericMethod($type).Invoke($null, @($asyncOp))
        [void]$task.Wait()
        return $task.Result
    } catch { return $null }
}

function Get-AppIconBase64($appId, $appName) {
    try {
        $proc = $null
        if ($appName) {
            $proc = Get-Process | Where-Object { $_.MainWindowHandle -ne 0 -and ($_.ProcessName -like "*$appName*" -or $_.MainWindowTitle -like "*$appName*") } | Select-Object -First 1
        }
        if (-not $proc -and $appId) {
            $cleanName = $appId.Split('!')[-1].Split('.')[-1].Replace('.exe','')
            if ($cleanName -and $cleanName -ne "App") {
                $proc = Get-Process | Where-Object { $_.ProcessName -eq $cleanName -or $_.ProcessName -like "*$cleanName*" } | Select-Object -First 1
            }
        }
        if (-not $proc -and $appId -match '.([A-Za-z0-9]+)[_!]') {
            $extracted = $Matches[1]
            $proc = Get-Process | Where-Object { $_.ProcessName -like "*$extracted*" } | Select-Object -First 1
        }
        if (-not $proc) { return "" }
        $exePath = $proc.MainModule.FileName
        if (-not $exePath) { return "" }
        $icon = [System.Drawing.Icon]::ExtractAssociatedIcon($exePath)
        if (-not $icon) { return "" }
        $bmp = $icon.ToBitmap()
        $ms = New-Object System.IO.MemoryStream
        $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
        $bytes = $ms.ToArray()
        $ms.Close(); $bmp.Dispose(); $icon.Dispose()
        if ($bytes.Length -gt 0) {
            return "data:image/png;base64," + [Convert]::ToBase64String($bytes)
        }
    } catch {}
    return ""
}

try {
    $listener = [Windows.UI.Notifications.Management.UserNotificationListener]::Current

    $accessType = [Windows.UI.Notifications.Management.UserNotificationListenerAccessStatus, Windows.UI.Notifications, ContentType = WindowsRuntime]
    $access = Await-Op ($listener.RequestAccessAsync()) $accessType

    if ($access -ne [Windows.UI.Notifications.Management.UserNotificationListenerAccessStatus]::Allowed) {
        Write-Output "[]"
        exit
    }

    $kinds = [Windows.UI.Notifications.NotificationKinds]::Toast
    $userNotifType = [Windows.UI.Notifications.UserNotification, Windows.UI.Notifications, ContentType = WindowsRuntime]
    $readOnlyListType = [System.Collections.Generic.IReadOnlyList\`\`1].MakeGenericType($userNotifType)
    $notifsOp = $listener.GetNotificationsAsync($kinds)
    $task = $asTaskGeneric.MakeGenericMethod($readOnlyListType).Invoke($null, @($notifsOp))
    [void]$task.Wait(10000)
    $notifs = $task.Result

    if (-not $notifs) {
        Write-Output "[]"
        exit
    }

    $results = [System.Collections.Generic.List[object]]::new()
    foreach ($n in $notifs) {
        try {
            $toast = $n.Notification.Visual.GetBinding([Windows.UI.Notifications.KnownNotificationBindings]::ToastGeneric)
            if (-not $toast) { continue }
            $texts = $toast.GetTextElements()
            $title = ""
            $body = ""
            $i = 0
            foreach ($t in $texts) {
                if ($i -eq 0) { $title = $t.Text }
                elseif ($i -eq 1) { $body = $t.Text }
                $i++
            }
            $appName = ""
            $appId = ""
            try {
                $appName = $n.AppInfo.DisplayInfo.DisplayName
                $appId = $n.AppInfo.AppUserModelId
            } catch {}
            $icon = Get-AppIconBase64 $appId $appName
            $results.Add([PSCustomObject]@{
                Id = $n.Id
                AppName = $appName
                AppId = $appId
                Title = $title
                Body = $body
                Timestamp = $n.CreationTime.ToString("o")
                Icon = $icon
            })
        } catch { continue }
    }
    @($results) | ConvertTo-Json -Compress -Depth 3
} catch {
    Write-Output "[]"
}
`;try{d.writeFileSync(He,Ut,"utf8")}catch(t){c("Failed to write get-notifications.ps1:",t)}function jt(){try{const t=m.join(h.getPath("userData"),"notifications-store.json");if(d.existsSync(t))return JSON.parse(d.readFileSync(t,"utf8"))}catch(t){c("Failed to load notifications-store.json:",t)}return null}function Gt(t){try{const e=m.join(h.getPath("userData"),"notifications-store.json");d.writeFileSync(e,JSON.stringify(t,null,2),"utf8")}catch(e){c("Failed to save notifications-store.json:",e)}}async function Lt(t){return process.platform!=="win32"||!t?!1:new Promise(e=>{const n=`
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.IsGenericMethodDefinition -and $_.GetGenericArguments().Count -eq 1 -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name.StartsWith('IAsyncOperation')
}[0]
function Await-Op($asyncOp, $type) {
    if (-not $asyncOp) { return $null }
    try { $task = $asTaskGeneric.MakeGenericMethod($type).Invoke($null, @($asyncOp)); [void]$task.Wait(); return $task.Result } catch { return $null }
}
try {
    $listener = [Windows.UI.Notifications.Management.UserNotificationListener, Windows.UI.Notifications, ContentType = WindowsRuntime]::Current
    $listener.RemoveNotification(${t})
    Write-Output "true"
} catch { Write-Output "false" }
`,r=ye(n);M(`powershell -NoProfile -EncodedCommand ${r}`,(o,a)=>{e((a==null?void 0:a.trim())==="true")})})}async function Bt(){return process.platform!=="win32"?!1:new Promise(t=>{const n=ye(`
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime
try {
    $listener = [Windows.UI.Notifications.Management.UserNotificationListener, Windows.UI.Notifications, ContentType = WindowsRuntime]::Current
    $listener.ClearNotifications()
    Write-Output "true"
} catch { Write-Output "false" }
`);M(`powershell -NoProfile -EncodedCommand ${n}`,(r,o)=>{t((o==null?void 0:o.trim())==="true")})})}async function Ke(t,e){if(process.platform!=="win32"||!t&&!e)return!1;const n=(t||"").trim(),r=(e||"").trim();if(c(`focusNotificationApp: appId="${n}", appName="${r}"`),n&&(n.includes("!")||n.toLowerCase().startsWith("shell:appsfolder\\")))try{const a=n.toLowerCase().startsWith("shell:appsfolder\\")?n:`shell:AppsFolder\\${n}`,l=Ie("explorer.exe",[a],{detached:!0,stdio:"ignore"});return l&&typeof l.unref=="function"&&l.unref(),!0}catch(a){c("UWP explorer.exe launch failed:",a)}try{const a=typeof T=="function"?T():null;if(a){if(r){const l=await a.launchApp(r);if(l&&l.success)return!0}if(n&&n!==r){const l=await a.launchApp(n);if(l&&l.success)return!0}if(typeof a.getRunningWindows=="function"&&typeof a.activateWindow=="function"){const l=await a.getRunningWindows({forceRefresh:!0}),f=[r,n].filter(Boolean).map(u=>u.toLowerCase()),p=l.find(u=>{if(!u)return!1;const y=(u.processName||"").toLowerCase(),b=(u.title||"").toLowerCase();return f.some(w=>y===w||y.includes(w)||w.includes(y)||b.toLowerCase().includes(w))});if(p&&p.hWnd){const u=await a.activateWindow(p.hWnd);if(u&&u.success)return!0}}}}catch(a){c("LauncherEngine resolution in focusNotificationApp failed:",a)}const o=`${r} ${n}`.toLowerCase();try{if(o.includes("whatsapp"))return await C.openExternal("whatsapp://"),!0;if(o.includes("spotify"))return await C.openExternal("spotify://"),!0;if(o.includes("telegram"))return await C.openExternal("tg://"),!0;if(o.includes("discord"))return await C.openExternal("discord://"),!0;if(o.includes("slack"))return await C.openExternal("slack://"),!0}catch(a){c("URI protocol fallback failed:",a)}return new Promise(a=>{const l=new Set;[r,n].forEach(w=>{w&&(l.add(w),w.split(/\s+/).forEach(x=>{x.length>2&&l.add(x)}),w.split(/[._!\\\/]/).filter(x=>x.length>2&&!/^[0-9A-Fa-f]{8,}$/.test(x)).forEach(x=>l.add(x)))});const f=Array.from(l).filter(w=>w&&w.length>=2),p=f.length>0?f.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|"):(r||n).replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),u=n.replace(/'/g,"''"),y=`
$type = @'
using System;
using System.Runtime.InteropServices;
public class WinAPI {
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern void SwitchToThisWindow(IntPtr hWnd, bool fAltTab);
    [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);
    [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr hWnd);
}
'@
Add-Type -TypeDefinition $type -PassThru | Out-Null

$matched = $false
$pattern = '(?i)(${p})'

# Find by Process Name or Window Title
$procs = Get-Process | Where-Object { 
    $_.ProcessName -match $pattern -or $_.MainWindowTitle -match $pattern 
} | Select-Object -First 1

if ($procs -and $procs.MainWindowHandle -ne 0) {
    $hwnd = $procs.MainWindowHandle
    if ([WinAPI]::IsIconic($hwnd)) {
        [void][WinAPI]::ShowWindow($hwnd, 9)
    } else {
        [void][WinAPI]::ShowWindow($hwnd, 5)
    }
    [WinAPI]::keybd_event(0x12, 0, 0, 0)
    [WinAPI]::keybd_event(0x12, 0, 2, 0)
    [void][WinAPI]::BringWindowToTop($hwnd)
    [void][WinAPI]::SetForegroundWindow($hwnd)
    [void][WinAPI]::SwitchToThisWindow($hwnd, $true)
    $matched = $true
}

if (-not $matched -and '${u}') {
    try {
        Start-Process "explorer.exe" "shell:AppsFolder\\${u}"
        $matched = $true
    } catch {}
}

if ($matched) { Write-Output "true" } else { Write-Output "false" }
`,b=ye(y);M(`powershell -NoProfile -EncodedCommand ${b}`,(w,k)=>{a((k==null?void 0:k.trim())==="true")})})}const $=st({savePersistence:Gt,initialPersistedData:jt(),removeNotificationSource:Lt,focusApp:Ke,openExternal:async t=>C.openExternal(t)});$.registry.on("change",t=>{if(s&&!s.isDestroyed()){s.webContents.send("notification:update",t);try{s.webContents.invalidate()}catch{}}});setInterval(()=>{try{$.registry.checkSnoozedDue()}catch{}},1e4);let ve=!1;async function ze(){return process.platform!=="win32"?[]:ve?[]:(ve=!0,new Promise(t=>{de("powershell",["-NoProfile","-ExecutionPolicy","Bypass","-File",He],{maxBuffer:5*1024*1024,encoding:"utf8",timeout:1e4},(e,n)=>{if(ve=!1,e||!n)return t([]);try{const r=JSON.parse(n.trim()),o=Array.isArray(r)?r:r?[r]:[];$.syncNotifications(o,"windows-notification-listener"),t(o)}catch{t([])}})}))}i.handle("get-notifications",async()=>await ze());i.handle("dismiss-notification",async(t,e)=>{const n=await $.dismiss(e);return!!(n!=null&&n.success)});i.handle("focus-notification-app",async(t,e,n)=>await Ke(e,n));i.handle("notification:get-snapshot",()=>$.getSnapshot());i.handle("notification:sync-now",async()=>(await ze(),$.getSnapshot()));i.handle("notification:execute-action",async(t,e,n,r)=>await $.executeAction(e,n,r));i.handle("notification:snooze",(t,e,n,r)=>$.snooze(e,n,r));i.handle("notification:cancel-snooze",(t,e)=>$.cancelSnooze(e));i.handle("notification:dismiss",async(t,e)=>await $.dismiss(e));i.handle("notification:dismiss-group",(t,e)=>$.dismissGroup(e));i.handle("notification:clear-all",async()=>{try{await Bt()}catch{}return $.clearAllActive()});i.handle("notification:undo-dismiss",(t,e)=>$.undoDismiss(e));i.handle("notification:mark-reviewed",(t,e)=>$.markReviewed(e));i.handle("notification:mark-all-reviewed",()=>$.markAllReviewed());i.handle("notification:set-hide-previews",(t,e)=>($.setHidePreviews(e),!0));i.handle("notification:set-app-excluded",(t,e,n)=>($.setAppExcluded(e,n),!0));i.handle("notification:clear-history",()=>($.clearHistory(),!0));i.handle("window:invalidate",()=>{if(s&&!s.isDestroyed())try{s.webContents.invalidate()}catch{}return!0});function Jt(){const t=[m.join(process.resourcesPath,"audio-helper.exe"),m.join(process.resourcesPath,"native","bin","audio-helper.exe"),m.join(process.resourcesPath,"native","audio-helper.exe"),m.join(h.getAppPath(),"native","bin","audio-helper.exe"),m.join(__dirname,"..","native","bin","audio-helper.exe"),m.join(__dirname,"native","bin","audio-helper.exe"),m.join(process.cwd(),"native","bin","audio-helper.exe")];for(const e of t)try{if(d.existsSync(e))return e}catch{}return null}class qt{constructor(){this.child=null,this.reqId=0,this.pending=new Map,this.buffer="",this.isStopping=!1,this.restartAttempts=0,this.maxRestartAttempts=5,this.restartTimer=null}start(){if(process.platform!=="win32"||this.child&&!this.child.killed)return;const e=Jt();if(!e){c("[AudioMixer] audio-helper.exe not found in search paths.");return}try{this.child=Ie(e,[],{stdio:["pipe","pipe","pipe"],windowsHide:!0}),this.child.stdout.on("data",n=>{this.buffer+=n.toString("utf8");let r;for(;(r=this.buffer.indexOf(`
`))!==-1;){const o=this.buffer.slice(0,r).trim();this.buffer=this.buffer.slice(r+1),o&&this.handleLine(o)}}),this.child.stderr.on("data",n=>{c(`[AudioMixer stderr] ${n.toString("utf8").trim()}`)}),this.child.on("error",n=>{c("[AudioMixer process error]",n)}),this.child.on("close",n=>{c(`[AudioMixer] Process exited with code ${n}`),this.child=null;for(const[r,o]of this.pending.entries())clearTimeout(o.timer),o.reject(new Error("Audio helper process exited"));if(this.pending.clear(),!this.isStopping&&this.restartAttempts<this.maxRestartAttempts){this.restartAttempts++;const r=Math.min(1e3*Math.pow(2,this.restartAttempts),1e4);this.restartTimer=setTimeout(()=>{c(`[AudioMixer] Restarting audio-helper (attempt ${this.restartAttempts})...`),this.start()},r)}}),c(`[AudioMixer] Successfully spawned audio-helper from ${e}`),this.restartAttempts=0}catch(n){c("[AudioMixer] Failed to spawn audio-helper:",n)}}handleLine(e){try{const n=JSON.parse(e);if(typeof n.id=="number"&&this.pending.has(n.id)){const{resolve:r,reject:o,timer:a}=this.pending.get(n.id);clearTimeout(a),this.pending.delete(n.id),n.success?r(n.data):o(new Error(n.error||"Unknown audio helper error"))}}catch(n){c(`[AudioMixer] Failed to parse stdout line: ${e}`,n)}}send(e,n={},r=5e3){return new Promise((o,a)=>{if((!this.child||!this.child.stdin||this.child.killed)&&(this.start(),!this.child||!this.child.stdin))return a(new Error("Audio helper is not running"));const l=++this.reqId,f={id:l,cmd:e,...n},p=setTimeout(()=>{this.pending.has(l)&&(this.pending.delete(l),a(new Error(`Command '${e}' timed out after ${r}ms`)))},r);this.pending.set(l,{resolve:o,reject:a,timer:p});try{this.child.stdin.write(JSON.stringify(f)+`
`)}catch(u){clearTimeout(p),this.pending.delete(l),a(u)}})}stop(){if(this.isStopping=!0,this.restartTimer&&(clearTimeout(this.restartTimer),this.restartTimer=null),this.child){try{this.child.stdin&&!this.child.stdin.destroyed&&(this.child.stdin.on("error",()=>{}),this.child.stdin.write(JSON.stringify({id:0,cmd:"shutdown"})+`
`))}catch{}setTimeout(()=>{if(this.child){try{this.child.kill()}catch{}this.child=null}},400)}}}const D=new qt;h.whenReady().then(()=>{D.start()});h.on("will-quit",()=>{D.stop();try{ee.unregisterAll()}catch{}if(H)try{H.destroy()}catch{}});h.on("before-quit",()=>{D.stop();try{ee.unregisterAll()}catch{}if(H)try{H.destroy()}catch{}});i.handle("audio-mixer:get-devices",async()=>{if(process.platform!=="win32")return{devices:[],defaultDeviceId:""};try{return await D.send("listDevices")}catch(t){return c("[audio-mixer:get-devices error]",t),{devices:[],defaultDeviceId:"",error:t.message}}});i.handle("audio-mixer:get-sessions",async(t,e)=>{if(process.platform!=="win32")return{sessions:[]};try{return await D.send("listSessions",{deviceId:e})}catch(n){return c("[audio-mixer:get-sessions error]",n),{sessions:[],error:n.message}}});i.handle("audio-mixer:set-volume",async(t,e={})=>{if(process.platform!=="win32")return!1;try{return await D.send("setSessionVolume",e)}catch(n){return c("[audio-mixer:set-volume error]",n),!1}});i.handle("audio-mixer:set-mute",async(t,e={})=>{if(process.platform!=="win32")return!1;try{return await D.send("setSessionMute",e)}catch(n){return c("[audio-mixer:set-mute error]",n),!1}});i.handle("audio-mixer:set-master-volume",async(t,e={})=>{if(process.platform!=="win32")return!1;try{return await D.send("setMasterVolume",e)}catch(n){return c("[audio-mixer:set-master-volume error]",n),!1}});i.handle("audio-mixer:set-master-mute",async(t,e={})=>{if(process.platform!=="win32")return!1;try{return await D.send("setMasterMute",e)}catch(n){return c("[audio-mixer:set-master-mute error]",n),!1}});
