"use strict";const{app:f,BrowserWindow:xe,screen:F,ipcMain:o,shell:C,dialog:Ue,Tray:Xe,Menu:Ze,nativeImage:V,clipboard:j,powerMonitor:be,globalShortcut:te}=require("electron");f.commandLine.appendSwitch("disable-background-timer-throttling");f.commandLine.appendSwitch("disable-backgrounding-occluded-windows");f.commandLine.appendSwitch("disable-renderer-backgrounding");f.commandLine.appendSwitch("autoplay-policy","no-user-gesture-required");const Ye=f.requestSingleInstanceLock();Ye?f.on("second-instance",()=>{typeof le=="function"?le():s&&!s.isDestroyed()&&(s.isVisible()||s.show(),s.restore(),s.focus())}):f.quit();const m=require("node:path"),d=require("fs"),Pe=require("os"),We=require("https"),Me=require("http"),et=require("crypto"),{EventEmitter:tt}=require("events");function de(t){const e=[m.join(__dirname,t),m.join(__dirname,"../../src",t),m.join(typeof f<"u"&&f.getAppPath?f.getAppPath():process.cwd(),"src",t),m.join(typeof f<"u"&&f.getAppPath?f.getAppPath():process.cwd(),".vite/build",t),m.join(process.cwd(),"src",t)];for(const n of e)try{if(d.existsSync(n)||d.existsSync(n+".js")||d.existsSync(m.join(n,"index.js")))return require(n)}catch{}return require(t)}const{createProgressEngine:nt}=de("services/progress"),{createNotificationEngine:st,NOTIFICATION_ACTION_TYPES:Xt}=de("services/notifications"),{createLauncherEngine:rt}=de("services/launcher"),{createNotesEngine:it}=de("services/notes"),{buildInstallCommand:ot,buildLauncherBatch:at,buildHelperPaths:ct}=de("services/updater");let L=null,s=null,U=!0;function T(){try{return m.join(f.getPath("userData"),"settings.json")}catch{return m.join(process.cwd(),"settings.json")}}function lt(){try{const t=T();if(d.existsSync(t)){const e=JSON.parse(d.readFileSync(t,"utf8"));if(typeof e.alwaysOnTop=="boolean")return e.alwaysOnTop}}catch{}return!0}function dt(t){try{const e=T();let n={};if(d.existsSync(e))try{n=JSON.parse(d.readFileSync(e,"utf8"))}catch{}n.alwaysOnTop=t,d.writeFileSync(e,JSON.stringify(n,null,2),"utf8")}catch{}}function ut(){try{const t=T();if(d.existsSync(t)){const e=JSON.parse(d.readFileSync(t,"utf8"));if(typeof e.autoDownloadInstall=="boolean")return e.autoDownloadInstall}}catch{}return!0}function pt(t,e){try{const n=T();let r={};if(d.existsSync(n))try{r=JSON.parse(d.readFileSync(n,"utf8"))}catch{}r[t]=e,d.writeFileSync(n,JSON.stringify(r,null,2),"utf8")}catch{}}function ht(){try{const t=T();if(d.existsSync(t)){const e=JSON.parse(d.readFileSync(t,"utf8"));if(typeof e.mascotMode=="boolean")return e.mascotMode}}catch{}return!0}function je(t){try{const e=T();let n={};if(d.existsSync(e))try{n=JSON.parse(d.readFileSync(e,"utf8"))}catch{}n.mascotMode=t,d.writeFileSync(e,JSON.stringify(n,null,2),"utf8")}catch{}}function ft(){try{const t=T();if(d.existsSync(t)){const e=JSON.parse(d.readFileSync(t,"utf8"));if(typeof e.minimalNotch=="boolean")return e.minimalNotch}}catch{}return!1}function ce(t){try{const e=T();let n={};if(d.existsSync(e))try{n=JSON.parse(d.readFileSync(e,"utf8"))}catch{}n.minimalNotch=t,d.writeFileSync(e,JSON.stringify(n,null,2),"utf8")}catch{}}function yt(){try{const t=T();if(d.existsSync(t)){const e=JSON.parse(d.readFileSync(t,"utf8"));if(typeof e.privacyDots=="boolean")return e.privacyDots}}catch{}return!1}function mt(t){try{const e=T();let n={};if(d.existsSync(e))try{n=JSON.parse(d.readFileSync(e,"utf8"))}catch{}n.privacyDots=t,d.writeFileSync(e,JSON.stringify(n,null,2),"utf8")}catch{}}function gt(){try{const t=T();if(d.existsSync(t)){const e=JSON.parse(d.readFileSync(t,"utf8"));if(typeof e.smartBrowserAvoidance=="boolean")return e.smartBrowserAvoidance}}catch{}return!0}function wt(t){try{const e=T();let n={};if(d.existsSync(e))try{n=JSON.parse(d.readFileSync(e,"utf8"))}catch{}n.smartBrowserAvoidance=t,d.writeFileSync(e,JSON.stringify(n,null,2),"utf8")}catch{}}let B=ht(),v=ft(),oe=yt(),ne=gt();U=lt();function $t(){try{const t=T();if(d.existsSync(t)){const e=JSON.parse(d.readFileSync(t,"utf8"));if(Array.isArray(e.hiddenTabs))return e.hiddenTabs}}catch{}return[6]}function bt(t){try{const e=T();let n={};if(d.existsSync(e))try{n=JSON.parse(d.readFileSync(e,"utf8"))}catch{}n.hiddenTabs=t,d.writeFileSync(e,JSON.stringify(n,null,2),"utf8")}catch{}}const St=[2,11,12,13,14,15,16,4,5,6,7,8,10,0,1,3];function vt(){try{const t=T();if(d.existsSync(t)){const e=JSON.parse(d.readFileSync(t,"utf8"));if(Array.isArray(e.tabOrder)&&e.tabOrder.length>0)return e.tabOrder}}catch{}return[...St]}function At(t){try{const e=T();let n={};if(d.existsSync(e))try{n=JSON.parse(d.readFileSync(e,"utf8"))}catch{}n.tabOrder=t,d.writeFileSync(e,JSON.stringify(n,null,2),"utf8")}catch{}}let Z=$t(),Y=vt();const ae="http://127.0.0.1:8765/api/process";function me(){try{const t=T();if(d.existsSync(t)){const e=JSON.parse(d.readFileSync(t,"utf8"));let n=typeof e.jarvisEndpoint=="string"&&e.jarvisEndpoint.trim()?e.jarvisEndpoint.trim():ae;return n==="http://localhost:5000/api/ask"&&(n=ae),{enabled:typeof e.jarvisEnabled=="boolean"?e.jarvisEnabled:!0,endpoint:n}}}catch{}return{enabled:!0,endpoint:ae}}function Pt(t){try{const e=T();let n={};if(d.existsSync(e))try{n=JSON.parse(d.readFileSync(e,"utf8"))}catch{}return typeof(t==null?void 0:t.enabled)=="boolean"&&(n.jarvisEnabled=t.enabled),typeof(t==null?void 0:t.endpoint)=="string"&&t.endpoint.trim()&&(n.jarvisEndpoint=t.endpoint.trim()),d.writeFileSync(e,JSON.stringify(n,null,2),"utf8"),!0}catch{return!1}}function A(){if(U&&!(!s||s.isDestroyed())){try{s.setAlwaysOnTop(!0,"screen-saver",1)}catch{try{s.setAlwaysOnTop(!0,"screen-saver")}catch{try{s.setAlwaysOnTop(!0)}catch{}}}try{s.moveTop()}catch{}}}function Tt(t){if(U=!!t,dt(U),s&&!s.isDestroyed()){try{U?A():s.setAlwaysOnTop(!1)}catch{}try{s.webContents.send("always-on-top-changed",U)}catch{}}M()}function Ge(){try{return m.join(f.getPath("userData"),"quick-pill.log")}catch{return m.join(process.cwd(),"quick-pill.log")}}function c(t,e=null){const r=`[${new Date().toISOString()}] ${t}${e?` | Error: ${e.stack||e}`:""}
`;console.log(r.trim());try{const i=Ge();d.appendFileSync(i,r,"utf8")}catch{}}process.on("uncaughtException",t=>{c("UNCAUGHT EXCEPTION (Main Process)",t)});process.on("unhandledRejection",t=>{c("UNHANDLED REJECTION (Main Process)",t)});const G={0:"Alt+B",1:"Alt+W",2:"Alt+O",11:"Alt+H",12:"Alt+A",13:"Alt+P",14:"Alt+L",15:"Alt+Q",16:"Alt+I",3:"Alt+M",4:"Alt+C",5:"Alt+N",6:"Alt+G",7:"Alt+V",8:"Alt+T",10:"Alt+R","minimal-notch":"Alt+Shift+M"};let X=[];function Le(){try{const t=T();if(d.existsSync(t)){const e=JSON.parse(d.readFileSync(t,"utf8"));if(e&&typeof e.tabShortcuts=="object"&&e.tabShortcuts!==null)return{...G,...e.tabShortcuts}}}catch{}return{...G}}function Be(t){try{const e=T();let n={};if(d.existsSync(e))try{n=JSON.parse(d.readFileSync(e,"utf8"))}catch{}return n.tabShortcuts=t,d.writeFileSync(e,JSON.stringify(n,null,2),"utf8"),!0}catch(e){return c("Failed to save tabShortcuts preference:",e),!1}}function xt(t){if(Number(t)===9){Ee();return}if(!(!s||s.isDestroyed()))try{s.isVisible()||s.show(),A(),s.focus(),s.webContents.send("open-tab-instant",Number(t))}catch(e){c(`Failed to openTabInstant for tab ${t}:`,e)}}function ke(t){for(const r of X)try{te.unregister(r)}catch{}X=[];const e=t||Le();for(const[r,i]of Object.entries(e)){if(!i||typeof i!="string"||!i.trim())continue;const a=i.trim();if(a.toUpperCase().includes("CTRL")||a.toUpperCase().includes("CONTROL")){c(`Refusing to register shortcut with Ctrl: ${a}`);continue}if(r==="minimal-notch"){try{te.register(a,()=>{v=!v,ce(v),s&&!s.isDestroyed()&&(s.webContents.send("settings:minimal-notch-changed",v),s.webContents.send("toggle-minimal-notch-hotkey")),M()})?X.push(a):c(`Global shortcut conflict/in-use for ${a} (minimal-notch)`)}catch(l){c(`Error registering global shortcut ${a}:`,l)}continue}try{te.register(a,()=>{xt(parseInt(r,10))})?X.push(a):c(`Global shortcut conflict/in-use for ${a} (tab ${r})`)}catch(l){c(`Error registering global shortcut ${a}:`,l)}}const n=e["minimal-notch"]||"Alt+Shift+M";if(!X.includes(n))try{te.register(n,()=>{v=!v,ce(v),s&&!s.isDestroyed()&&(s.webContents.send("settings:minimal-notch-changed",v),s.webContents.send("toggle-minimal-notch-hotkey")),M()})&&X.push(n)}catch(r){c("Error registering fallback global shortcut for minimal notch:",r)}}const{exec:R,execFile:ue,spawn:Ie}=require("child_process");function ge(t){return Buffer.from(t,"utf16le").toString("base64")}o.handle("log-message",(t,e,n,r)=>{c(`[RENDERER ${String(e).toUpperCase()}] ${n} ${r?JSON.stringify(r):""}`)});o.handle("log-renderer-error",(t,e)=>{c(`[RENDERER ERROR] Unhandled Renderer Exception ${JSON.stringify(e)}`)});let ye=null;o.handle("set-ignore-mouse-events",(t,e,n)=>{if(s&&!s.isDestroyed())try{if(ye===e)return;if(ye=e,e){const r=n!==void 0?n:!0;s.setIgnoreMouseEvents(!0,{forward:r})}else s.setIgnoreMouseEvents(!1),A()}catch{try{s.setIgnoreMouseEvents(!0,{forward:!0})}catch{}}});o.handle("get-always-on-top",()=>U);o.handle("set-always-on-top",(t,e)=>(Tt(e),U));o.handle("focus-window",()=>{s&&!s.isDestroyed()&&(A(),s.focus())});o.handle("open-external",async(t,e)=>{await C.openExternal(e)});o.handle("get-mascot-mode",()=>B);o.handle("set-mascot-mode",(t,e)=>(B=!!e,je(B),M(),B));o.handle("get-minimal-notch",()=>v);o.handle("set-minimal-notch",(t,e)=>(v=!!e,ce(v),s&&!s.isDestroyed()&&s.webContents.send("settings:minimal-notch-changed",v),M(),v));o.handle("toggle-minimal-notch",()=>(v=!v,ce(v),s&&!s.isDestroyed()&&(s.webContents.send("settings:minimal-notch-changed",v),s.webContents.send("toggle-minimal-notch-hotkey")),M(),v));o.handle("get-smart-browser-avoidance",()=>ne);o.handle("set-smart-browser-avoidance",(t,e)=>(ne=!!e,wt(ne),s&&!s.isDestroyed()&&s.webContents.send("settings:smart-browser-avoidance-changed",ne),ne));o.handle("get-hidden-tabs",()=>Z);o.handle("set-hidden-tabs",(t,e)=>(Array.isArray(e)&&(Z=e,bt(Z),s&&!s.isDestroyed()&&s.webContents.send("settings:hidden-tabs-changed",Z),g&&!g.isDestroyed()&&g.webContents.send("settings:hidden-tabs-changed",Z)),Z));o.handle("get-tab-order",()=>Y);o.handle("set-tab-order",(t,e)=>(Array.isArray(e)&&(Y=e,At(Y),s&&!s.isDestroyed()&&s.webContents.send("settings:tab-order-changed",Y),g&&!g.isDestroyed()&&g.webContents.send("settings:tab-order-changed",Y)),Y));o.handle("get-privacy-dots",()=>oe);o.handle("set-privacy-dots",(t,e)=>(oe=!!e,mt(oe),s&&!s.isDestroyed()&&s.webContents.send("settings:privacy-dots-changed",oe),oe));o.handle("open-settings-window",()=>(Ee(),!0));o.on("settings-window:minimize",()=>{g&&!g.isDestroyed()&&g.minimize()});o.on("settings-window:close",()=>{g&&!g.isDestroyed()&&g.close()});const kt="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAMklEQVRYhe3OQQ0AIAwEwbf/h1GChwW0U4E2Z9Yk1fN7kG65AwAAAAAAAAAAAAAAwP8AO6kBX7K4Xy0AAAAASUVORK5CYII=";let D=null;function Je(){if(D&&typeof D.isEmpty=="function"&&!D.isEmpty())return D;try{const t=m.resolve(f.getAppPath?f.getAppPath():process.cwd(),"src/assets/icons/icon.png");if(d.existsSync(t)&&(D=V.createFromPath(t).resize({width:32,height:32}),!D.isEmpty()))return D}catch{}try{const t=K("png");if(d.existsSync(t)&&(D=V.createFromPath(t).resize({width:32,height:32}),!D.isEmpty()))return D}catch{}try{D=V.createFromDataURL(kt).resize({width:32,height:32})}catch{}return D}const fe=new Map;async function It(t){try{if(!t||typeof t!="string")return null;const e=m.resolve(t);if(!d.existsSync(e))return null;if(fe.has(e)){const r=fe.get(e);return r&&!r.isEmpty()?r.toDataURL():null}let n=null;try{typeof V.createThumbnailFromPath=="function"&&(n=await V.createThumbnailFromPath(e,{width:32,height:32}))}catch{}if(!n||n.isEmpty())try{typeof f.getFileIcon=="function"&&(n=await f.getFileIcon(e,{size:"normal"}),n&&!n.isEmpty()&&(n=n.resize({width:32,height:32})))}catch{}return(!n||n.isEmpty())&&(n=Je()),fe.set(e,n),n&&!n.isEmpty()?n.toDataURL():null}catch(e){return c("cacheShelfIcon error:",e),null}}function Ce(t,e){try{if(!t||typeof t.startDrag!="function"||!e||typeof e!="string")return!1;const n=m.resolve(e);if(!d.existsSync(n))return!1;let r=fe.get(n);return(!r||typeof r.isEmpty=="function"&&r.isEmpty())&&(r=Je()),!r||typeof r.isEmpty=="function"&&r.isEmpty()?(c("executeStartDragSync: no valid icon available, skipping startDrag to prevent crash"),!1):(t.startDrag({file:n,icon:r}),!0)}catch(n){return c("executeStartDragSync error:",n),!1}}o.on("shelf:start-drag",(t,e)=>{Ce(t.sender,e)});o.on("ondragstart",(t,e)=>{Ce(t.sender,e)});o.handle("start-drag",(t,e)=>Ce(t.sender,e));o.handle("shelf:cache-icon",async(t,e)=>await It(e));let H=null;function P(){if(!H){let t="";try{t=f.getPath("userData")}catch{t=process.cwd()}H=rt({userDataPath:t,shell:C,getFileIcon:(e,n)=>f.getFileIcon(e,n)})}return H}o.handle("launcher:search-apps",async(t,e,n)=>{try{return await P().searchApps(e,n)}catch(r){return c("Error in launcher:search-apps:",r),[]}});o.handle("launcher:get-catalog",async()=>{try{return await P().getCatalog()}catch(t){return c("Error in launcher:get-catalog:",t),[]}});o.handle("launcher:reindex-catalog",async()=>{try{return await P().reindexCatalog()}catch(t){return c("Error in launcher:reindex-catalog:",t),{success:!1,count:0}}});o.handle("launcher:launch-app",async(t,e)=>{try{return await P().launchApp(e)}catch(n){return c("Error in launcher:launch-app:",n),{success:!1,error:n.message}}});o.handle("launcher:get-running-windows",async(t,e)=>{try{return await P().getRunningWindows(e)}catch(n){return c("Error in launcher:get-running-windows:",n),[]}});o.handle("launcher:activate-window",async(t,e)=>{try{const n=await P().activateWindow(e);return n.success&&s&&!s.isDestroyed()&&s.webContents.send("launcher:window-activated",{hWnd:e}),n}catch(n){return c("Error in launcher:activate-window:",n),{success:!1,code:"FAILED",error:n.message}}});o.handle("launcher:get-favorites",async()=>{try{return await P().getFavorites()}catch(t){return c("Error in launcher:get-favorites:",t),[]}});o.handle("launcher:set-favorites",async(t,e)=>{try{return await P().setFavorites(e)}catch(n){return c("Error in launcher:set-favorites:",n),{success:!1}}});o.handle("launcher:open-app",async(t,e)=>{try{return e?await C.openPath(e)?await P().launchApp(e):{success:!0}:{success:!1,error:"No target specified"}}catch(n){return c("Error in launcher:open-app:",n),{success:!1,error:n.message}}});o.on("launcher:open-app",async(t,e)=>{try{if(!e)return;await C.openPath(e)&&await P().launchApp(e)}catch(n){c("Error in launcher:open-app (event):",n)}});o.handle("launcher:open-url",async(t,e)=>{try{if(!e)return{success:!1,error:"No URL specified"};let n=String(e).trim();return/^https?:\/\//i.test(n)||(n="https://"+n),await C.openExternal(n),{success:!0}}catch(n){return c("Error in launcher:open-url:",n),{success:!1,error:n.message}}});o.on("launcher:open-url",async(t,e)=>{try{if(!e)return;let n=String(e).trim();/^https?:\/\//i.test(n)||(n="https://"+n),await C.openExternal(n)}catch(n){c("Error in launcher:open-url (event):",n)}});o.handle("launcher:select-file",async()=>{try{const t=await Ue.showOpenDialog({title:"Select Application or Shortcut",properties:["openFile"],filters:[{name:"Applications & Shortcuts",extensions:["exe","lnk","bat","cmd"]},{name:"All Files",extensions:["*"]}]});if(!t.canceled&&t.filePaths.length>0){const e=t.filePaths[0],n=m.basename(e,m.extname(e));return{canceled:!1,filePath:e,name:n}}return{canceled:!0}}catch(t){return c("Error in launcher:select-file:",t),{canceled:!0,error:t.message}}});o.handle("workspaces:get-workspaces",async()=>{try{return await P().getWorkspaces()}catch(t){return c("Error in workspaces:get-workspaces:",t),[]}});o.handle("workspaces:save-workspace",async(t,e)=>{try{return await P().saveWorkspace(e)}catch(n){return c("Error in workspaces:save-workspace:",n),{success:!1,error:n.message}}});o.handle("workspaces:delete-workspace",async(t,e)=>{try{return await P().deleteWorkspace(e)}catch(n){return c("Error in workspaces:delete-workspace:",n),{success:!1,error:n.message}}});o.handle("workspaces:launch-workspace",async(t,e,n)=>{try{return await P().launchWorkspace(e,n)}catch(r){return c("Error in workspaces:launch-workspace:",r),{success:!1,results:[],error:r.message}}});let Se=null;function O(){if(!Se){let t="";try{t=f.getPath("userData")}catch{t=process.cwd()}Se=it({userDataPath:t,clipboard:j})}return Se}o.handle("notes:get-notes",async(t,e,n)=>{try{return await O().getNotes(e,n)}catch(r){return c("Error in notes:get-notes:",r),[]}});o.handle("notes:save-note",async(t,e)=>{try{const n=await O().saveNote(e);return s&&!s.isDestroyed()&&s.webContents.send("notes:updated",{action:"save",note:n}),n}catch(n){return c("Error in notes:save-note:",n),{success:!1,error:n.message}}});o.handle("notes:delete-note",async(t,e)=>{try{const n=await O().deleteNote(e);return n.success&&s&&!s.isDestroyed()&&s.webContents.send("notes:updated",{action:"delete",id:e}),n}catch(n){return c("Error in notes:delete-note:",n),{success:!1,error:n.message}}});o.handle("notes:undo-delete",async()=>{try{const t=await O().undoDelete();return t.success&&s&&!s.isDestroyed()&&s.webContents.send("notes:updated",{action:"restore",note:t.note}),t}catch(t){return c("Error in notes:undo-delete:",t),{success:!1,error:t.message}}});o.handle("notes:toggle-pin",async(t,e)=>{try{const n=await O().togglePin(e);return n.success&&s&&!s.isDestroyed()&&s.webContents.send("notes:updated",{action:"togglePin",id:e,isPinned:n.isPinned}),n}catch(n){return c("Error in notes:toggle-pin:",n),{success:!1,error:n.message}}});o.handle("notes:toggle-archive",async(t,e)=>{try{const n=await O().toggleArchive(e);return n.success&&s&&!s.isDestroyed()&&s.webContents.send("notes:updated",{action:"toggleArchive",id:e,isArchived:n.isArchived}),n}catch(n){return c("Error in notes:toggle-archive:",n),{success:!1,error:n.message}}});o.handle("notes:save-draft",async(t,e)=>{try{return await O().saveDraft(e)}catch(n){return c("Error in notes:save-draft:",n),{success:!1,error:n.message}}});o.handle("notes:get-draft",async()=>{try{return await O().getDraft()}catch(t){return c("Error in notes:get-draft:",t),null}});o.handle("notes:clear-draft",async()=>{try{return await O().clearDraft()}catch(t){return c("Error in notes:clear-draft:",t),{success:!1,error:t.message}}});o.handle("notes:get-contextual-capture",async(t,e)=>{try{return await O().getContextualCapture(e)}catch(n){return c("Error in notes:get-contextual-capture:",n),{success:!1,code:"CAPTURE_ERROR",error:n.message}}});o.handle("notes:search-notes",async(t,e,n)=>{try{return await O().searchNotes(e,n)}catch(r){return c("Error in notes:search-notes:",r),[]}});o.handle("notes:get-tags",async()=>{try{return await O().getTags()}catch(t){return c("Error in notes:get-tags:",t),[]}});o.handle("notes:convert-to-task",async(t,e)=>{try{return await O().convertToTask(e)}catch(n){return c("Error in notes:convert-to-task:",n),{success:!1,error:n.message}}});o.handle("shortcuts:get-tab-shortcuts",()=>Le());o.handle("shortcuts:set-tab-shortcuts",(t,e)=>{if(!e||typeof e!="object")return{success:!1,error:"Invalid shortcuts object"};const n={};for(const[i,a]of Object.entries(e))if(typeof a=="string"){const l=a.toUpperCase();if(l.includes("CTRL")||l.includes("CONTROL"))return{success:!1,error:"Ctrl cannot be used in tab shortcuts (reserved for Click-Through)"};n[i]=a.trim()}const r={...G,...n};return Be(r),ke(r),s&&!s.isDestroyed()&&s.webContents.send("shortcuts:updated",r),g&&!g.isDestroyed()&&g.webContents.send("shortcuts:updated",r),{success:!0,shortcuts:r}});o.handle("shortcuts:reset-tab-shortcuts",()=>(Be(G),ke(G),s&&!s.isDestroyed()&&s.webContents.send("shortcuts:updated",G),g&&!g.isDestroyed()&&g.webContents.send("shortcuts:updated",G),{success:!0,shortcuts:G}));function se(t,e){try{o.removeHandler(t)}catch{}o.handle(t,e)}se("jarvis:ask",async(t,e)=>{if(!e||typeof e!="string"||!e.trim())return{success:!1,error:"Empty prompt provided."};const n=me();if(!n.enabled)return{success:!1,error:"JARVIS integration is currently disabled in Settings."};const r=n.endpoint||ae;try{const i=new AbortController,a=setTimeout(()=>i.abort(),45e3),l={text:e.trim(),prompt:e.trim(),audio_target:"laptop"},u=await fetch(r,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json, text/plain, */*"},body:JSON.stringify(l),signal:i.signal});if(clearTimeout(a),!u.ok){const p=await u.text().catch(()=>"");return{success:!1,error:`JARVIS responded with error ${u.status}: ${p||u.statusText}`}}if((u.headers.get("content-type")||"").includes("application/json")){const p=await u.json();return{success:!0,response:p.reply||p.response||p.text||p.message||p.answer||p.output||p.result||(typeof p=="string"?p:JSON.stringify(p)),raw:p}}else return{success:!0,response:await u.text()}}catch(i){return i.name==="AbortError"?{success:!1,error:"JARVIS query timed out (45s). Your local model may be busy."}:{success:!1,error:"JARVIS local server offline. Make sure D:/JARVIS is running."}}});se("jarvis:testConnection",async(t,e)=>{const n=me(),r=e||n.endpoint||ae;try{const i=new AbortController,a=setTimeout(()=>i.abort(),4e3);let l=!1,u="";try{const p=`${new URL(r).origin}/api/status`,y=await fetch(p,{method:"GET",signal:i.signal});if(y.ok){const b=await y.json().catch(()=>null);b&&b.name?(l=!0,u=`${b.name} v${b.version||"2.5"} (${b.model||"Online"})`):y.status<500&&(l=!0,u=`Online (${y.status})`)}}catch{}if(!l)try{const h=await fetch(r,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:"ping",prompt:"ping"}),signal:i.signal});h.status<500&&(l=!0,u=`HTTP ${h.status}`)}catch{try{const p=new URL(r),y=await fetch(p.origin,{method:"GET",signal:i.signal});y.status<500&&(l=!0,u=`Host online (${y.status})`)}catch(p){throw p}}return clearTimeout(a),{success:!0,connected:l,details:u}}catch(i){return{success:!1,connected:!1,error:i.message||"Cannot reach server"}}});se("jarvis:getConfig",async()=>me());se("jarvis:setConfig",async(t,e)=>{Pt(e);const n=me();return s&&!s.isDestroyed()&&s.webContents.send("jarvis:configUpdated",n),g&&!g.isDestroyed()&&g.webContents.send("jarvis:configUpdated",n),{success:!0,config:n}});se("jarvis:stopServer",async()=>{try{try{const e=new AbortController,n=setTimeout(()=>e.abort(),1500);await fetch("http://127.0.0.1:8765/api/shutdown",{method:"POST",headers:{"Content-Type":"application/json"},signal:e.signal}).catch(()=>null),clearTimeout(n)}catch{}const t="D:\\JARVIS\\stop_jarvis.bat";return d.existsSync(t)&&R(`cmd /c "${t}"`,{cwd:"D:\\JARVIS"}),{success:!0,message:"JARVIS stopped and resources freed."}}catch(t){return{success:!1,error:t.message||"Failed to stop JARVIS"}}});se("jarvis:launchServer",async()=>{const t="D:\\JARVIS\\run_gui.bat";try{if(d.existsSync(t))return R(`cmd /c "${t}"`,{cwd:"D:\\JARVIS"}),{success:!0,message:"JARVIS launch initiated."}}catch(e){return{success:!1,error:e.message||"Failed to launch run_gui.bat"}}return{success:!1,error:"D:\\JARVIS\\run_gui.bat not found."}});o.handle("launch-app",async(t,e)=>await P().launchApp(e));o.handle("build-app-cache",async()=>await P().reindexCatalog());o.handle("search-apps",async(t,e)=>await P().searchApps(e));o.handle("get-displays",()=>F.getAllDisplays().map(e=>({id:e.id,label:e.label||`Display ${e.id}`,bounds:e.bounds})));o.handle("set-display",(t,e)=>{if(s&&!s.isDestroyed()){const r=F.getAllDisplays().find(h=>h.id.toString()===e.toString())||F.getPrimaryDisplay(),i=560,a=180,l=Math.round(r.bounds.x+(r.bounds.width-i)/2),u=r.bounds.y;s.setBounds({x:l,y:u,width:i,height:a}),s.show(),A()}});o.handle("update-window-position",(t,e,n)=>{});o.handle("set-auto-launch",(t,e)=>{try{f.setLoginItemSettings({openAtLogin:e,path:f.getPath("exe")}),e||Ne(),M(),g&&!g.isDestroyed()&&g.webContents.send("settings:auto-launch-changed",e),s&&!s.isDestroyed()&&s.webContents.send("settings:auto-launch-changed",e)}catch(n){console.error("Failed to set login item settings on Windows:",n)}});o.handle("get-auto-launch",()=>{try{return f.getLoginItemSettings().openAtLogin}catch{return!1}});o.handle("create-desktop-shortcut",()=>{try{const t=f.getPath("desktop"),e=m.join(t,"Quick Pill.lnk"),n=process.execPath||f.getPath("exe");let r=K("ico");d.existsSync(r)||(r=K("png"));const i={target:n,cwd:m.dirname(n),description:"Quick Pill - Dynamic Island for Windows",appUserModelId:"com.neosparkx.quickpill"};return d.existsSync(r)&&(i.icon=r,i.iconIndex=0),{success:C.writeShortcutLink(e,"create",i),path:e}}catch(t){return c("create-desktop-shortcut error:",t),{success:!1,error:(t==null?void 0:t.message)||String(t)}}});function Ne(){if(process.platform==="win32")try{const t=["electron.app.Ripple","electron.app.Electron","electron.app.Quick Pill","Ripple"];for(const e of t)R(`reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "${e}" /f`,()=>{})}catch{}}const Ct=["https://raw.githubusercontent.com/pikri-beep/Quick-Pill-Dynamic-Island-for-Windows/main/web%20app/public/version.json","https://raw.githubusercontent.com/nabil24024004/Quick-Pill/main/web%20app/public/version.json"];class Nt extends tt{constructor(){super(),this.manifestUrls=[...Ct],this.currentVersion=f?f.getVersion():"5.5.2",this.status="idle",this.updateInfo=null,this.downloadedFilePath=null,this.currentDownloadRequest=null,this.lastProgressEmit=0;const e=ut();this.autoDownload=e,this.autoInstall=e}compareVersions(e,n){const r=(e||"0.0.0").replace(/^v/i,"").trim(),i=(n||"0.0.0").replace(/^v/i,"").trim(),[a,l]=r.split("-"),[u,h]=i.split("-"),p=a.split(".").map(w=>parseInt(w,10)||0),y=u.split(".").map(w=>parseInt(w,10)||0),b=Math.max(p.length,y.length);for(let w=0;w<b;w++){const x=p[w]||0,k=y[w]||0;if(x>k)return 1;if(x<k)return-1}return!l&&h?1:l&&!h?-1:l&&h?l.localeCompare(h):0}getPlatformKey(){return`win32-${process.arch}`}fetchJson(e,n=12e3,r=5){return new Promise((i,a)=>{if(r<=0)return a(new Error("Too many redirects while fetching update manifest."));const u=(e.startsWith("https")?We:Me).get(e,{headers:{"User-Agent":`QuickPill-Updater/${this.currentVersion} (${process.platform} ${process.arch})`,Accept:"application/json, text/plain, */*"},timeout:n},h=>{if(h.statusCode>=300&&h.statusCode<400&&h.headers.location){const y=new URL(h.headers.location,e).href;return this.fetchJson(y,n,r-1).then(i).catch(a)}if(h.statusCode!==200)return h.resume(),a(new Error(`Server returned HTTP ${h.statusCode}: ${h.statusMessage}`));let p="";h.setEncoding("utf8"),h.on("data",y=>{p+=y}),h.on("end",()=>{try{const y=JSON.parse(p);i(y)}catch(y){a(new Error(`Invalid JSON received from update manifest: ${y.message}`))}})});u.on("timeout",()=>{u.destroy(),a(new Error("Connection timed out while checking for updates."))}),u.on("error",h=>{a(h)})})}async checkForUpdates(){var e,n,r;if(this.status==="checking"||this.status==="downloading")return{status:this.status,updateInfo:this.updateInfo};this.status="checking",this.emit("checking");try{let i=null,a=null;for(const h of this.manifestUrls)try{const p=`${h}${h.includes("?")?"&":"?"}_t=${Date.now()}`,y=await this.fetchJson(p);if(y&&y.version){i=y;break}}catch(p){a=p}if(!i||!i.version)throw a||new Error('Update manifest is missing required "version" field.');const l=i.version;if(this.compareVersions(l,this.currentVersion)>0){const h=this.getPlatformKey(),p=((e=i.platforms)==null?void 0:e[h])||((n=i.platforms)==null?void 0:n[`${process.platform}-x64`])||((r=i.platforms)==null?void 0:r["win32-x64"]),y=(p==null?void 0:p.url)||"";return this.updateInfo={version:l,currentVersion:this.currentVersion,name:i.name||`Quick Pill v${l}`,releaseDate:i.releaseDate||"",mandatory:!!i.mandatory,changelog:Array.isArray(i.changelog)?i.changelog:[],downloadUrl:y,sha256:(p==null?void 0:p.sha256)||"",size:(p==null?void 0:p.size)||0,installerType:(p==null?void 0:p.installerType)||"nsis"},this.status="available",this.emit("update-available",this.updateInfo),c(`[Auto-Updater] Update v${l} is available (installed: v${this.currentVersion}).`),this.autoDownload&&y&&(c(`[Auto-Updater] New update v${l} detected. Automatically downloading in background...`),setTimeout(()=>{this.startDownload().catch(b=>{c("[Auto-Updater] Automatic background download failed:",b)})},1e3)),{status:"available",updateInfo:this.updateInfo}}else{this.status="not-available";const h={currentVersion:this.currentVersion,latestVersion:l};return this.emit("update-not-available",h),{status:"not-available",updateInfo:h}}}catch(i){this.status="error";const a=i.message||"Unknown error occurred while checking for updates.";return this.emit("error",a),{status:"error",error:a}}}startDownload(){if(!this.updateInfo||!this.updateInfo.downloadUrl){const a=new Error("No update available or download URL is missing.");return this.emit("error",a.message),Promise.reject(a)}if(this.status==="downloading")return Promise.resolve({status:"downloading"});this.status="downloading",this.emit("download-started",this.updateInfo);const e=f.getPath("temp"),r=`quick-pill-update-v${this.updateInfo.version}.exe`,i=m.join(e,r);return new Promise((a,l)=>{if(d.existsSync(i))try{d.unlinkSync(i)}catch{}const u=d.createWriteStream(i);let h=0,p=this.updateInfo.size||0,y=0,b=Date.now(),w=0,x=!1;const k=E=>{if(!x){x=!0;try{u.destroy()}catch{}try{d.existsSync(i)&&d.unlinkSync(i)}catch{}this.status="error",c(`[Auto-Updater] ${E.message}`),this.emit("error",E.message),l(E)}},Oe=(E,W=5)=>{if(x)return;if(W<=0)return k(new Error("Too many redirects while downloading update binary."));const we=(E.startsWith("https")?We:Me).get(E,{headers:{"User-Agent":`QuickPill-Updater/${this.currentVersion} (${process.platform} ${process.arch})`}},N=>{if(x){N.resume();return}if(N.statusCode>=300&&N.statusCode<400&&N.headers.location){N.resume();const Q=new URL(N.headers.location,E).href;return Oe(Q,W-1)}if(N.statusCode!==200)return k(new Error(`Download failed with status HTTP ${N.statusCode}: ${N.statusMessage}`));const $e=parseInt(N.headers["content-length"],10);!isNaN($e)&&$e>0&&(p=$e),N.on("data",Q=>{h+=Q.length,u.write(Q);const pe=Date.now();if(pe-this.lastProgressEmit>=100||h===p){const _e=(pe-b)/1e3;_e>=.5&&(w=Math.round((h-y)/_e),y=h,b=pe);const Qe={percent:p>0?Math.min(100,Math.round(h/p*1e3)/10):0,transferredBytes:h,totalBytes:p,speedBytesPerSec:w};this.lastProgressEmit=pe,this.emit("download-progress",Qe)}}),N.on("end",()=>{x||u.end()}),N.on("error",Q=>{k(Q)})});this.currentDownloadRequest=we,we.on("error",N=>{k(N)})};u.on("finish",()=>{if(x)return;if(this.currentDownloadRequest=null,this.updateInfo.sha256&&this.updateInfo.sha256.trim()!=="")try{const W=et.createHash("sha256"),De=d.readFileSync(i);if(W.update(De),W.digest("hex").toLowerCase()!==this.updateInfo.sha256.trim().toLowerCase())return k(new Error("Integrity check failed (SHA-256 mismatch). The downloaded file might be corrupted."))}catch(W){console.warn("Could not verify SHA-256 checksum:",W)}this.downloadedFilePath=i,this.status="downloaded";const E={version:this.updateInfo.version,filePath:i};c(`[Auto-Updater] Update v${this.updateInfo.version} downloaded successfully (${h} bytes).`),this.emit("update-downloaded",E),a(E),this.autoInstall&&(c(`[Auto-Updater] Update v${this.updateInfo.version} downloaded successfully. Automatically installing in background in 2 seconds...`),setTimeout(()=>{Promise.resolve(this.installAndRelaunch()).catch(W=>{c("[Auto-Updater] Automatic install failed:",W)})},2e3))}),u.on("error",E=>{k(E)}),Oe(this.updateInfo.downloadUrl)})}cancelDownload(){if(this.currentDownloadRequest){try{this.currentDownloadRequest.destroy()}catch{}this.currentDownloadRequest=null}this.status="idle",this.emit("download-cancelled")}async installAndRelaunch(){if(!this.downloadedFilePath||!d.existsSync(this.downloadedFilePath)){const u=new Error("No downloaded update file found to install.");return c("[Auto-Updater] "+u.message),this.emit("error",u.message),!1}if(f&&f.isPackaged===!1){const u=new Error("Automatic installation is only available for the packaged Quick Pill build.");return c("[Auto-Updater] "+u.message),this.emit("error",u.message),!1}const e=this.downloadedFilePath,n=process.pid;let r="";try{r=f.getPath("exe")}catch{}try{typeof _<"u"&&_&&_.stop()}catch{}let i=null,a=null;try{i=ot({installerPath:e,currentPid:n,appExePath:r,logPath:Ge()}),a=ct(f.getPath("temp"),n),d.writeFileSync(a.scriptPath,i.script,"utf8"),d.writeFileSync(a.batchPath,at(a.scriptPath),"utf8")}catch(u){return c("[Auto-Updater] Failed to build install helper:",u),this.emit("error",`Failed to prepare the installer: ${u.message}`),!1}c(`[Auto-Updater] Handing the update over to the installer helper (pid ${n})`),c(`[Auto-Updater] Installer: ${e}`);let l=!1;try{const u=await C.openPath(a.batchPath);l=!u,u&&c(`[Auto-Updater] shell.openPath reported: ${u}`)}catch(u){c("[Auto-Updater] Failed to start the installer helper through the shell:",u)}if(!l)try{const u=Ie(i.command,i.args,{detached:!0,stdio:"ignore",windowsHide:!0});u.on("error",h=>{c("[Auto-Updater] Installer helper failed to start:",h)}),u.unref()}catch(u){return c("[Auto-Updater] Failed to launch the installer helper:",u),this.emit("error",`Failed to launch the installer: ${u.message}`),!1}return setTimeout(()=>{try{f&&(f.isQuitting=!0,f.quit())}catch{}setTimeout(()=>{try{process.exit(0)}catch{}},1500)},200),!0}}const S=new Nt;function J(t,e){s&&!s.isDestroyed()&&s.webContents.send("update-event",{event:t,data:e}),g&&!g.isDestroyed()&&g.webContents.send("update-event",{event:t,data:e})}S.on("checking",()=>J("checking"));S.on("update-available",t=>J("available",t));S.on("update-not-available",t=>J("not-available",t));S.on("download-started",t=>J("download-started",t));S.on("download-progress",t=>J("download-progress",t));S.on("update-downloaded",t=>J("downloaded",t));S.on("download-cancelled",()=>J("cancelled"));S.on("error",t=>J("error",t));o.handle("check-for-updates",async()=>await S.checkForUpdates());o.handle("start-update-download",async()=>await S.startDownload());o.handle("cancel-update-download",()=>(S.cancelDownload(),!0));o.handle("install-update",()=>S.installAndRelaunch());o.handle("get-updater-state",()=>({status:S.status,updateInfo:S.updateInfo,downloadedFilePath:S.downloadedFilePath,currentVersion:S.currentVersion}));o.handle("get-app-version",()=>f.getVersion());o.handle("get-auto-download-install",()=>S.autoDownload&&S.autoInstall);o.handle("set-auto-download-install",(t,e)=>{const n=!!e;return S.autoDownload=n,S.autoInstall=n,pt("autoDownloadInstall",n),n});const re=nt({autoUpdater:S,openPath:async t=>{try{d.existsSync(t)&&(d.statSync(t).isDirectory()?await C.openPath(t):C.showItemInFolder(t))}catch(e){c("[progress openPath error]",e)}}});re.coordinator.on("update",t=>{s&&!s.isDestroyed()&&s.webContents.send("progress:update",t)});o.handle("progress:get-snapshot",()=>re.coordinator.getSnapshot());o.handle("progress:execute-action",async(t,e,n,r)=>await re.coordinator.executeAction(e,n,r));o.handle("progress:start-file-op",async(t,e)=>await re.fileOpsProvider.startCopy(e));o.handle("progress:start-hash-op",async(t,e)=>await re.fileOpsProvider.startHash(e));o.handle("progress:clear-history",()=>(re.registry.clearHistory(),!0));o.handle("progress:select-file",async()=>{if(!s)return null;const t=await Ue.showOpenDialog(s,{properties:["openFile"]});return t.canceled||!t.filePaths.length?null:t.filePaths[0]});const K=(t=null)=>{const e=t||"ico";try{const n=m.join(f.getAppPath(),`src/assets/icons/icon.${e}`);if(d.existsSync(n))return n}catch{}try{const n=m.join(process.resourcesPath,`icon.${e}`);if(d.existsSync(n))return n;const r=m.join(process.resourcesPath,`assets/icons/icon.${e}`);if(d.existsSync(r))return r}catch{}return m.join(__dirname,`../../src/assets/icons/icon.${e}`)},I={hovering:!1,hitboxWidth:175,hitboxHeight:36,anchorX:null};let Fe=null;function Et(t,e,n,r){const i=Number(t),a=Number(e);Number.isFinite(i)&&i>0&&(I.hitboxWidth=i),Number.isFinite(a)&&a>0&&(I.hitboxHeight=a);const l=Number(r);I.anchorX=Number.isFinite(l)?l:null}function Ot(t){try{if(!s||s.isDestroyed())return!1;const e=t||F.getCursorScreenPoint(),n=s.getBounds(),r=I.anchorX!==null?n.x+I.anchorX:n.x+Math.round(n.width/2),i=I.hitboxWidth/2,a=r-i,l=r+i,u=n.y,h=n.y+I.hitboxHeight;return e.x>=a&&e.x<=l&&e.y>=u&&e.y<=h}catch{return!1}}function Dt(){Fe||(Fe=setInterval(()=>{if(!(!s||s.isDestroyed()))try{const t=F.getCursorScreenPoint(),e=Ot(t);e&&!I.hovering?(I.hovering=!0,s.setIgnoreMouseEvents(!1),s.webContents.send("notch-cursor-enter"),c(`[cursor-hit-test] enter at ${t.x},${t.y} hitbox=${I.hitboxWidth}x${I.hitboxHeight} anchor=${I.anchorX}`)):!e&&I.hovering?(I.hovering=!1,s.setIgnoreMouseEvents(!0,{forward:!0}),s.webContents.send("notch-cursor-leave"),c(`[cursor-hit-test] leave at ${t.x},${t.y}`)):e&&I.hovering&&ye!==!1&&(s.setIgnoreMouseEvents(!1),ye=!1)}catch(t){I.errorLogged||(I.errorLogged=!0,c("[cursor-hit-test] watcher error:",t))}},30))}o.on("notch:set-hitbox",(t,e)=>{const n=e||{};Et(n.width,n.height,n.expanded,n.anchorX),c(`[notch-hitbox] ${n.width}x${n.height} expanded=${n.expanded}`)});const Te=()=>{const t=F.getPrimaryDisplay(),{x:e,y:n,width:r,height:i}=t.bounds,a=560,l=180,u=Math.round(e+(r-a)/2),h=n;s=new xe({width:a,height:l,x:u,y:h,backgroundColor:"#00000000",transparent:!0,alwaysOnTop:!0,resizable:!1,minimizable:!1,maximizable:!1,fullscreenable:!1,frame:!1,thickFrame:!1,hasShadow:!1,skipTaskbar:!0,icon:K(),type:"toolbar",fullscreen:!1,visibleOnFullScreen:!0,acceptFirstMouse:!0,webPreferences:{preload:m.join(__dirname,"preload.js"),devTools:!f.isPackaged,backgroundThrottling:!1},show:!0}),s.setIgnoreMouseEvents(!0,{forward:!0}),s.once("ready-to-show",()=>{s&&(s.show(),A(),s.focus())}),s.webContents.on("console-message",(p,y,b,w,x)=>{y>=2&&c(`[RENDERER CONSOLE ${y===3?"ERROR":"WARN"}] (${x?m.basename(x):"unknown"}:${w}) ${b}`)}),s.webContents.on("render-process-gone",(p,y)=>{if(c(`[RENDERER PROCESS GONE] reason=${y==null?void 0:y.reason}, exitCode=${y==null?void 0:y.exitCode}`),s&&!s.isDestroyed())try{s.setIgnoreMouseEvents(!0,{forward:!0})}catch{}}),s.on("blur",()=>{A()}),s.on("minimize",()=>{s&&!s.isDestroyed()&&(s.restore(),A())}),s.on("restore",()=>{A()}),s.on("show",()=>{A()}),setTimeout(()=>{s&&!s.isVisible()&&(s.show(),A(),s.focus())},5e3),s.on("closed",()=>{s=null});try{s.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0})}catch{}if(!f.isPackaged&&process.env.NODE_ENV==="development")s.loadURL("http://localhost:5173");else{const p=[m.join(__dirname,"../renderer/main_window/index.html"),m.join(f.getAppPath(),".vite/renderer/main_window/index.html"),m.join(f.getAppPath(),"dist/index.html"),m.join(__dirname,"index.html"),m.join(f.getAppPath(),"index.html")];let y=!1;for(const b of p)if(d.existsSync(b)){c(`Loading renderer from: ${b}`),s.loadFile(b),y=!0;break}y||(c("No packaged renderer HTML found, falling back to localhost:5173"),s.loadURL("http://localhost:5173"))}};let g=null;function Ee(){if(g&&!g.isDestroyed()){g.show(),g.focus();return}if(g=new xe({width:680,height:560,title:"Quick Pill Settings",backgroundColor:"#121212",autoHideMenuBar:!0,resizable:!0,minimizable:!0,maximizable:!1,frame:!1,icon:K(),webPreferences:{preload:m.join(__dirname,"preload.js"),devTools:!f.isPackaged,backgroundThrottling:!1}}),!f.isPackaged&&process.env.NODE_ENV==="development")g.loadURL("http://localhost:5173#settings");else{const t=[m.join(__dirname,"../renderer/main_window/index.html"),m.join(f.getAppPath(),".vite/renderer/main_window/index.html"),m.join(f.getAppPath(),"dist/index.html"),m.join(__dirname,"index.html"),m.join(f.getAppPath(),"index.html")];for(const e of t)if(d.existsSync(e)){g.loadFile(e,{hash:"settings"});break}}g.on("closed",()=>{g=null})}function le(){try{if(!s||s.isDestroyed()){Te();return}s.isVisible()||s.show(),s.restore(),A(),s.focus(),s.webContents.send("toggle-minimal-notch-hotkey")}catch(t){c("restoreAndShowQuickPill error:",t)}}function M(){if(!L||L.isDestroyed())return;const t=f.getLoginItemSettings().openAtLogin,e=Ze.buildFromTemplate([{label:"Show Quick Pill",click:()=>{le()}},{type:"separator"},{label:"Start with Windows",type:"checkbox",checked:t,click:n=>{try{f.setLoginItemSettings({openAtLogin:n.checked,path:f.getPath("exe")}),n.checked||Ne(),g&&!g.isDestroyed()&&g.webContents.send("settings:auto-launch-changed",n.checked),s&&!s.isDestroyed()&&s.webContents.send("settings:auto-launch-changed",n.checked)}catch{}M()}},{label:"Mascot Mode",type:"checkbox",checked:B,click:n=>{B=n.checked,je(B),s&&!s.isDestroyed()&&s.webContents.send("settings:mascot-mode-changed",B),M()}},{label:"Minimal Notch",type:"checkbox",checked:v,click:n=>{v=n.checked,ce(v),s&&!s.isDestroyed()&&s.webContents.send("settings:minimal-notch-changed",v),M()}},{type:"separator"},{label:"Settings...",click:()=>{Ee()}},{type:"separator"},{label:"Exit",click:()=>{f.quit()}}]);L.setContextMenu(e)}let Re=!1,ee=null,_t=null;function Wt(){if(process.platform==="win32")try{const t=require("koffi"),e=t.load("user32.dll"),n=t.load("gdi32.dll"),r=t.struct("RECT",{left:"long",top:"long",right:"long",bottom:"long"});ee={GetForegroundWindow:e.func("GetForegroundWindow","intptr_t",[]),IsZoomed:e.func("IsZoomed","bool",["intptr_t"]),GetWindowRect:e.func("GetWindowRect","bool",["intptr_t",t.out(t.pointer(r))]),GetClassNameA:e.func("GetClassNameA","int",["intptr_t",t.out(t.pointer("char")),"int"]),GetWindowTextA:e.func("GetWindowTextA","int",["intptr_t",t.out(t.pointer("char")),"int"]),GetDC:e.func("GetDC","intptr_t",["intptr_t"]),ReleaseDC:e.func("ReleaseDC","int",["intptr_t","intptr_t"]),GetKeyState:e.func("GetKeyState","int16_t",["int"])},_t={GetPixel:n.func("GetPixel","uint32_t",["intptr_t","int","int"])}}catch(t){c("[Obstruction] Koffi user32/gdi32 init failed, falling back:",t)}}function Mt(){process.platform==="win32"&&(Wt(),setInterval(()=>{if(!s||s.isDestroyed())return;let t=!1;if(ee)try{const e=ee.GetForegroundWindow();if(e&&e!==0){const n=Buffer.alloc(256);ee.GetClassNameA(e,n,256);const r=n.toString("utf8").replace(/\0.*$/,"").trim(),i=r==="Progman"||r==="WorkerW"||r==="Shell_TrayWnd"||r==="Shell_SecondaryTrayWnd";let a=!1;try{const l=s.getNativeWindowHandle();l.readBigInt64LE&&l.readBigInt64LE(0)===BigInt(e)&&(a=!0)}catch{}try{if(g&&!g.isDestroyed()){const l=g.getNativeWindowHandle();l.readBigInt64LE&&l.readBigInt64LE(0)===BigInt(e)&&(a=!0)}}catch{}if(!i&&!a){const l={};ee.GetWindowRect(e,l);const u=ee.IsZoomed(e),h=F.getPrimaryDisplay(),p=h.bounds.width,y=h.bounds.height,b=(l.right||0)-(l.left||0),w=(l.bottom||0)-(l.top||0);l.left<=0&&l.top<=0&&l.right>=p&&l.bottom>=y&&!u?t=!0:u||l.top<=8&&b>=p*.9?ne&&(t=!0):t=!1}}}catch{}t!==Re&&(Re=t,s&&!s.isDestroyed()&&s.webContents.send("desktop:obstruction-status",{isObstructed:t}))},250))}f.whenReady().then(()=>{f.setAppUserModelId("com.neosparkx.quickpill"),Ne(),Te(),Dt(),Lt(),Mt(),Gt(),ke(),P().getCatalog().catch(t=>c("Failed to warm launcher catalog:",t)),f.on("activate",()=>{xe.getAllWindows().length===0&&Te()});try{let t=K(),e=V.createFromPath(t);e.isEmpty()&&(t=K("png"),e=V.createFromPath(t));const n=e.isEmpty()?t:e.resize({width:16,height:16});L=new Xe(n),L.setToolTip("Quick Pill"),L.on("click",()=>{le()}),L.on("double-click",()=>{le()}),M()}catch(t){console.error("Failed to create tray:",t)}F.on("display-metrics-changed",()=>{A()}),F.on("display-added",()=>{A()}),F.on("display-removed",()=>{A()}),be&&(be.on("resume",()=>{s&&!s.isDestroyed()&&s.webContents.send("system-resume");try{typeof $<"u"&&($!=null&&$.registry)&&$.registry.checkSnoozedDue()}catch{}setTimeout(A,500),setTimeout(A,2e3)}),be.on("unlock-screen",()=>{s&&!s.isDestroyed()&&s.webContents.send("system-resume");try{typeof $<"u"&&($!=null&&$.registry)&&$.registry.checkSnoozedDue()}catch{}setTimeout(A,500),setTimeout(A,2e3)})),setInterval(()=>{if(U&&s&&!s.isDestroyed()&&s.isVisible())if(!s.isAlwaysOnTop())A();else try{s.moveTop()}catch{}},2500),setTimeout(()=>{S.checkForUpdates().catch(t=>{c("Auto-update check on startup error:",t)})},4e3),setInterval(()=>{S.checkForUpdates().catch(t=>{c("Periodic background update check error:",t)})},2*60*60*1e3)});const qe=m.join(f.getPath("userData"),"get-media.ps1"),Ft=`[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
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
`,Ve=m.join(f.getPath("userData"),"control-media.ps1"),Rt=`param([string]$command = "playpause", [double]$seekSeconds = 0)

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
`;try{d.writeFileSync(qe,Ft,"utf8")}catch(t){console.error("Failed to write get-media.ps1 script:",t)}try{d.writeFileSync(Ve,Rt,"utf8")}catch(t){console.error("Failed to write control-media.ps1 script:",t)}let ve=!1;o.handle("get-system-media",async()=>ve?null:(ve=!0,new Promise(t=>{const e=n=>{ve=!1,t(n)};ue("powershell",["-NoProfile","-ExecutionPolicy","Bypass","-File",qe],{maxBuffer:10*1024*1024,encoding:"utf8"},(n,r)=>{if(n||!r||r.trim()==="null"||r.trim()==="'null'"){R(`powershell -NoProfile -Command "Get-Process | Where-Object {$_.ProcessName -eq 'Spotify'} | Select-Object MainWindowTitle"`,{encoding:"utf8"},(i,a)=>{var u;if(i||!a)return e(null);const l=(u=a.split(`
`).find(h=>h.includes("-")))==null?void 0:u.trim();if(l){const h=l.split(" - ");let p="Unknown",y=l;h.length>1&&(p=h[0].trim(),y=h.slice(1).join(" - ").trim()),e({name:y||l,artist:p||"Unknown",state:"playing",source:"Spotify",position:0,duration:0})}else e(null)});return}try{const i=JSON.parse(r.trim());if(!i||!i.Title&&!i.Artist)return e(null);e({name:i.Title||"Unknown Title",artist:i.Artist||"Unknown Artist",album:i.Album||"",artwork_url:i.Artwork||null,state:i.Status==="playing"?"playing":"paused",source:i.Source||"System",position:Number(i.Position)||0,duration:Number(i.Duration)||0})}catch{e(null)}})})));o.handle("get-bluetooth-status",async()=>new Promise(t=>{const n=Buffer.from(`
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$devs = @(Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'OK' -and $_.Present -eq $true -and $_.InstanceId -match 'BTHENUM' })
$names = @($devs | ForEach-Object { $_.FriendlyName })
@{ connected = ($devs.Count -gt 0); devices = $names } | ConvertTo-Json -Compress
`,"utf16le").toString("base64");R(`powershell -NoProfile -EncodedCommand ${n}`,(r,i)=>{if(r||!i)return t({connected:!1,devices:[]});try{const a=JSON.parse(i.trim());t({connected:!!a.connected,devices:Array.isArray(a.devices)?a.devices:a.devices?[a.devices]:[]})}catch{t({connected:!1,devices:[]})}})}));o.handle("get-camera-status",async()=>new Promise(t=>{ue("reg",["query","HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\webcam","/s"],(e,n)=>{if(e||!n)return t(!1);const r=n.match(/LastUsedTimeStop\s+REG_QWORD\s+0x0\b/i);t(!!r)})}));o.handle("get-microphone-status",async()=>new Promise(t=>{ue("reg",["query","HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone","/s"],(e,n)=>{if(e||!n)return t(!1);const r=n.match(/LastUsedTimeStop\s+REG_QWORD\s+0x0\b/i);t(!!r)})}));f.on("window-all-closed",()=>{L||f.quit()});o.handle("control-system-media",async(t,e,...n)=>{const r=typeof n[0]=="number"?n[0]:0;c(`Executing media control: ${e} ${r>0?`(seek: ${r}s)`:""}`),ue("powershell.exe",["-NoProfile","-ExecutionPolicy","Bypass","-File",Ve,"-command",e,"-seekSeconds",r.toString()],{timeout:4e3},i=>{i&&c("Media control error:",i)})});let ie=null;function Ut(){const t=Pe.cpus();if(!t||t.length===0)return 0;if(!ie||ie.length!==t.length)return ie=t,0;let e=0,n=0;for(let i=0;i<t.length;i++){const a=t[i],l=ie[i];let u=a.times.idle-l.times.idle,h=0;for(const p in a.times)h+=a.times[p]-l.times[p];e+=u,n+=h}if(ie=t,n===0)return 0;const r=e/n;return Math.max(0,Math.min(100,Math.round((1-r)*100)))}function jt(){const t=Pe.totalmem(),e=Pe.freemem();return t?Math.max(0,Math.min(100,Math.round((t-e)/t*100))):0}o.handle("get-system-metrics",async()=>({cpu:Ut(),ram:jt()}));let q=[],z="";function Gt(){try{const t=j.readText().trim();t&&(z=t,q.push({id:"clip-"+Date.now(),text:t,timestamp:Date.now()}))}catch{}setInterval(()=>{try{const t=j.readText().trim();t&&t!==z&&(z=t,q=[{id:"clip-"+Date.now()+"-"+Math.random().toString(36).slice(2,6),text:t,timestamp:Date.now()},...q.filter(n=>n.text!==t)].slice(0,15),s&&!s.isDestroyed()&&s.webContents.send("clipboard:update",q))}catch{}},600)}o.handle("clipboard:get-history",()=>q);o.on("clipboard:write",(t,e)=>{try{e&&(z=String(e).trim(),j.writeText(String(e)))}catch{}});o.on("clipboard:clear",()=>{try{q=[],z="",j.clear(),s&&!s.isDestroyed()&&s.webContents.send("clipboard:update",[])}catch{}});o.handle("get-clipboard-text",async()=>{try{return j.readText()}catch{return""}});o.handle("write-clipboard-text",async(t,e)=>{try{return e?(z=String(e).trim(),j.writeText(String(e))):j.clear(),!0}catch{return!1}});o.handle("clear-clipboard",async()=>{try{return q=[],z="",j.clear(),s&&!s.isDestroyed()&&s.webContents.send("clipboard:update",[]),!0}catch{return!1}});o.handle("control-system-volume",async(t,e)=>{if(process.platform==="win32"){let n="0xAF";e==="down"&&(n="0xAE"),e==="mute"&&(n="0xAD");const r=`
$type = '[DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);'
$MediaKey = Add-Type -MemberDefinition $type -Name "WinVolKey" -Namespace "WinAPI" -PassThru
$MediaKey::keybd_event(${n}, 0, 0, [UIntPtr]::Zero)
$MediaKey::keybd_event(${n}, 0, 2, [UIntPtr]::Zero)
`,i=ge(r);return R(`powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${i}`,a=>{a&&c("Volume control error:",a)}),!0}return!1});let he=null;function Lt(){if(process.platform!=="win32")return;let t=!1;setInterval(()=>{!s||s.isDestroyed()||t||(t=!0,R("wmic logicaldisk where drivetype=2 get name,volumename /format:csv",(e,n)=>{var a,l;if(t=!1,e)return;const r=new Map,i=n.trim().split(/\r?\n/).filter(u=>u.trim()&&!u.startsWith("Node"));for(const u of i){const h=u.trim().split(",");if(h.length>=3){const p=(a=h[1])==null?void 0:a.trim(),y=((l=h[2])==null?void 0:l.trim())||"USB Drive";p&&r.set(p,y)}}if(he!==null&&s&&!s.isDestroyed()){for(const[u,h]of r)he.has(u)||s.webContents.send("usb-change",{action:"connected",drive:u,name:h});for(const[u]of he)r.has(u)||s.webContents.send("usb-change",{action:"disconnected",drive:u,name:"USB Drive"})}he=r}))},5e3)}const He=m.join(f.getPath("userData"),"get-notifications.ps1"),Bt=`[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
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
`;try{d.writeFileSync(He,Bt,"utf8")}catch(t){c("Failed to write get-notifications.ps1:",t)}function Jt(){try{const t=m.join(f.getPath("userData"),"notifications-store.json");if(d.existsSync(t))return JSON.parse(d.readFileSync(t,"utf8"))}catch(t){c("Failed to load notifications-store.json:",t)}return null}function qt(t){try{const e=m.join(f.getPath("userData"),"notifications-store.json");d.writeFileSync(e,JSON.stringify(t,null,2),"utf8")}catch(e){c("Failed to save notifications-store.json:",e)}}async function Vt(t){return process.platform!=="win32"||!t?!1:new Promise(e=>{const n=`
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
`,r=ge(n);R(`powershell -NoProfile -EncodedCommand ${r}`,(i,a)=>{e((a==null?void 0:a.trim())==="true")})})}async function Ht(){return process.platform!=="win32"?!1:new Promise(t=>{const n=ge(`
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime
try {
    $listener = [Windows.UI.Notifications.Management.UserNotificationListener, Windows.UI.Notifications, ContentType = WindowsRuntime]::Current
    $listener.ClearNotifications()
    Write-Output "true"
} catch { Write-Output "false" }
`);R(`powershell -NoProfile -EncodedCommand ${n}`,(r,i)=>{t((i==null?void 0:i.trim())==="true")})})}async function ze(t,e){if(process.platform!=="win32"||!t&&!e)return!1;const n=(t||"").trim(),r=(e||"").trim();if(c(`focusNotificationApp: appId="${n}", appName="${r}"`),n&&(n.includes("!")||n.toLowerCase().startsWith("shell:appsfolder\\")))try{const a=n.toLowerCase().startsWith("shell:appsfolder\\")?n:`shell:AppsFolder\\${n}`,l=Ie("explorer.exe",[a],{detached:!0,stdio:"ignore"});return l&&typeof l.unref=="function"&&l.unref(),!0}catch(a){c("UWP explorer.exe launch failed:",a)}try{const a=typeof P=="function"?P():null;if(a){if(r){const l=await a.launchApp(r);if(l&&l.success)return!0}if(n&&n!==r){const l=await a.launchApp(n);if(l&&l.success)return!0}if(typeof a.getRunningWindows=="function"&&typeof a.activateWindow=="function"){const l=await a.getRunningWindows({forceRefresh:!0}),u=[r,n].filter(Boolean).map(p=>p.toLowerCase()),h=l.find(p=>{if(!p)return!1;const y=(p.processName||"").toLowerCase(),b=(p.title||"").toLowerCase();return u.some(w=>y===w||y.includes(w)||w.includes(y)||b.toLowerCase().includes(w))});if(h&&h.hWnd){const p=await a.activateWindow(h.hWnd);if(p&&p.success)return!0}}}}catch(a){c("LauncherEngine resolution in focusNotificationApp failed:",a)}const i=`${r} ${n}`.toLowerCase();try{if(i.includes("whatsapp"))return await C.openExternal("whatsapp://"),!0;if(i.includes("spotify"))return await C.openExternal("spotify://"),!0;if(i.includes("telegram"))return await C.openExternal("tg://"),!0;if(i.includes("discord"))return await C.openExternal("discord://"),!0;if(i.includes("slack"))return await C.openExternal("slack://"),!0}catch(a){c("URI protocol fallback failed:",a)}return new Promise(a=>{const l=new Set;[r,n].forEach(w=>{w&&(l.add(w),w.split(/\s+/).forEach(k=>{k.length>2&&l.add(k)}),w.split(/[._!\\\/]/).filter(k=>k.length>2&&!/^[0-9A-Fa-f]{8,}$/.test(k)).forEach(k=>l.add(k)))});const u=Array.from(l).filter(w=>w&&w.length>=2),h=u.length>0?u.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|"):(r||n).replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),p=n.replace(/'/g,"''"),y=`
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
$pattern = '(?i)(${h})'

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

if (-not $matched -and '${p}') {
    try {
        Start-Process "explorer.exe" "shell:AppsFolder\\${p}"
        $matched = $true
    } catch {}
}

if ($matched) { Write-Output "true" } else { Write-Output "false" }
`,b=ge(y);R(`powershell -NoProfile -EncodedCommand ${b}`,(w,x)=>{a((x==null?void 0:x.trim())==="true")})})}const $=st({savePersistence:qt,initialPersistedData:Jt(),removeNotificationSource:Vt,focusApp:ze,openExternal:async t=>C.openExternal(t)});$.registry.on("change",t=>{if(s&&!s.isDestroyed()){s.webContents.send("notification:update",t);try{s.webContents.invalidate()}catch{}}});setInterval(()=>{try{$.registry.checkSnoozedDue()}catch{}},1e4);let Ae=!1;async function Ke(){return process.platform!=="win32"?[]:Ae?[]:(Ae=!0,new Promise(t=>{ue("powershell",["-NoProfile","-ExecutionPolicy","Bypass","-File",He],{maxBuffer:5*1024*1024,encoding:"utf8",timeout:1e4},(e,n)=>{if(Ae=!1,e||!n)return t([]);try{const r=JSON.parse(n.trim()),i=Array.isArray(r)?r:r?[r]:[];$.syncNotifications(i,"windows-notification-listener"),t(i)}catch{t([])}})}))}o.handle("get-notifications",async()=>await Ke());o.handle("dismiss-notification",async(t,e)=>{const n=await $.dismiss(e);return!!(n!=null&&n.success)});o.handle("focus-notification-app",async(t,e,n)=>await ze(e,n));o.handle("notification:get-snapshot",()=>$.getSnapshot());o.handle("notification:sync-now",async()=>(await Ke(),$.getSnapshot()));o.handle("notification:execute-action",async(t,e,n,r)=>await $.executeAction(e,n,r));o.handle("notification:snooze",(t,e,n,r)=>$.snooze(e,n,r));o.handle("notification:cancel-snooze",(t,e)=>$.cancelSnooze(e));o.handle("notification:dismiss",async(t,e)=>await $.dismiss(e));o.handle("notification:dismiss-group",(t,e)=>$.dismissGroup(e));o.handle("notification:clear-all",async()=>{try{await Ht()}catch{}return $.clearAllActive()});o.handle("notification:undo-dismiss",(t,e)=>$.undoDismiss(e));o.handle("notification:mark-reviewed",(t,e)=>$.markReviewed(e));o.handle("notification:mark-all-reviewed",()=>$.markAllReviewed());o.handle("notification:set-hide-previews",(t,e)=>($.setHidePreviews(e),!0));o.handle("notification:set-app-excluded",(t,e,n)=>($.setAppExcluded(e,n),!0));o.handle("notification:clear-history",()=>($.clearHistory(),!0));o.handle("window:invalidate",()=>{if(s&&!s.isDestroyed())try{s.webContents.invalidate()}catch{}return!0});function zt(){const t=[m.join(process.resourcesPath,"audio-helper.exe"),m.join(process.resourcesPath,"native","bin","audio-helper.exe"),m.join(process.resourcesPath,"native","audio-helper.exe"),m.join(f.getAppPath(),"native","bin","audio-helper.exe"),m.join(__dirname,"..","native","bin","audio-helper.exe"),m.join(__dirname,"native","bin","audio-helper.exe"),m.join(process.cwd(),"native","bin","audio-helper.exe")];for(const e of t)try{if(d.existsSync(e))return e}catch{}return null}class Kt{constructor(){this.child=null,this.reqId=0,this.pending=new Map,this.buffer="",this.isStopping=!1,this.restartAttempts=0,this.maxRestartAttempts=5,this.restartTimer=null}start(){if(process.platform!=="win32"||this.child&&!this.child.killed)return;const e=zt();if(!e){c("[AudioMixer] audio-helper.exe not found in search paths.");return}try{this.child=Ie(e,[],{stdio:["pipe","pipe","pipe"],windowsHide:!0}),this.child.stdout.on("data",n=>{this.buffer+=n.toString("utf8");let r;for(;(r=this.buffer.indexOf(`
`))!==-1;){const i=this.buffer.slice(0,r).trim();this.buffer=this.buffer.slice(r+1),i&&this.handleLine(i)}}),this.child.stderr.on("data",n=>{c(`[AudioMixer stderr] ${n.toString("utf8").trim()}`)}),this.child.on("error",n=>{c("[AudioMixer process error]",n)}),this.child.on("close",n=>{c(`[AudioMixer] Process exited with code ${n}`),this.child=null;for(const[r,i]of this.pending.entries())clearTimeout(i.timer),i.reject(new Error("Audio helper process exited"));if(this.pending.clear(),!this.isStopping&&this.restartAttempts<this.maxRestartAttempts){this.restartAttempts++;const r=Math.min(1e3*Math.pow(2,this.restartAttempts),1e4);this.restartTimer=setTimeout(()=>{c(`[AudioMixer] Restarting audio-helper (attempt ${this.restartAttempts})...`),this.start()},r)}}),c(`[AudioMixer] Successfully spawned audio-helper from ${e}`),this.restartAttempts=0}catch(n){c("[AudioMixer] Failed to spawn audio-helper:",n)}}handleLine(e){try{const n=JSON.parse(e);if(typeof n.id=="number"&&this.pending.has(n.id)){const{resolve:r,reject:i,timer:a}=this.pending.get(n.id);clearTimeout(a),this.pending.delete(n.id),n.success?r(n.data):i(new Error(n.error||"Unknown audio helper error"))}}catch(n){c(`[AudioMixer] Failed to parse stdout line: ${e}`,n)}}send(e,n={},r=5e3){return new Promise((i,a)=>{if((!this.child||!this.child.stdin||this.child.killed)&&(this.start(),!this.child||!this.child.stdin))return a(new Error("Audio helper is not running"));const l=++this.reqId,u={id:l,cmd:e,...n},h=setTimeout(()=>{this.pending.has(l)&&(this.pending.delete(l),a(new Error(`Command '${e}' timed out after ${r}ms`)))},r);this.pending.set(l,{resolve:i,reject:a,timer:h});try{this.child.stdin.write(JSON.stringify(u)+`
`)}catch(p){clearTimeout(h),this.pending.delete(l),a(p)}})}stop(){if(this.isStopping=!0,this.restartTimer&&(clearTimeout(this.restartTimer),this.restartTimer=null),this.child){try{this.child.stdin&&!this.child.stdin.destroyed&&(this.child.stdin.on("error",()=>{}),this.child.stdin.write(JSON.stringify({id:0,cmd:"shutdown"})+`
`))}catch{}setTimeout(()=>{if(this.child){try{this.child.kill()}catch{}this.child=null}},400)}}}const _=new Kt;f.whenReady().then(()=>{_.start()});f.on("will-quit",()=>{_.stop();try{te.unregisterAll()}catch{}if(H)try{H.destroy()}catch{}});f.on("before-quit",()=>{_.stop();try{te.unregisterAll()}catch{}if(H)try{H.destroy()}catch{}});o.handle("audio-mixer:get-devices",async()=>{if(process.platform!=="win32")return{devices:[],defaultDeviceId:""};try{return await _.send("listDevices")}catch(t){return c("[audio-mixer:get-devices error]",t),{devices:[],defaultDeviceId:"",error:t.message}}});o.handle("audio-mixer:get-sessions",async(t,e)=>{if(process.platform!=="win32")return{sessions:[]};try{return await _.send("listSessions",{deviceId:e})}catch(n){return c("[audio-mixer:get-sessions error]",n),{sessions:[],error:n.message}}});o.handle("audio-mixer:set-volume",async(t,e={})=>{if(process.platform!=="win32")return!1;try{return await _.send("setSessionVolume",e)}catch(n){return c("[audio-mixer:set-volume error]",n),!1}});o.handle("audio-mixer:set-mute",async(t,e={})=>{if(process.platform!=="win32")return!1;try{return await _.send("setSessionMute",e)}catch(n){return c("[audio-mixer:set-mute error]",n),!1}});o.handle("audio-mixer:set-master-volume",async(t,e={})=>{if(process.platform!=="win32")return!1;try{return await _.send("setMasterVolume",e)}catch(n){return c("[audio-mixer:set-master-volume error]",n),!1}});o.handle("audio-mixer:set-master-mute",async(t,e={})=>{if(process.platform!=="win32")return!1;try{return await _.send("setMasterMute",e)}catch(n){return c("[audio-mixer:set-master-mute error]",n),!1}});
