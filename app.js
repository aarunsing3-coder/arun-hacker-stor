(() => {
  const cfg = window.APP_CONFIG || {};
  const configured = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_URL.includes("PASTE_") && !cfg.SUPABASE_ANON_KEY.includes("PASTE_");
  const $ = id => document.getElementById(id);
  const modal = $("adminModal");
  let client = null, currentUser = null, apps = [];
  const BUCKET = "app-files";
  $("year").textContent = new Date().getFullYear();

  function notice(message) {
    $("notice").textContent = message;
    $("notice").classList.remove("hidden");
    setTimeout(() => $("notice").classList.add("hidden"), 3500);
  }
  function modalMessage(message, error=false) {
    $("modalMessage").textContent = message;
    $("modalMessage").style.color = error ? "#ff9b9b" : "#00f5a0";
  }
  function fallbackIcon(title, fileType) {
    return `<div class="app-icon" aria-label="${escapeHtml(fileType||"FILE")} icon">${fileType === "ZIP" ? "ZIP" : escapeHtml((title||"AH").slice(0,2).toUpperCase())}</div>`;
  }
  function iconMarkup(app) {
    if (app.file_type === "APK" && app.icon_data && /^data:image\/(png|jpeg|webp);base64,/i.test(app.icon_data)) {
      return `<img class="app-icon" src="${app.icon_data}" alt="${escapeHtml(app.title)} app icon" loading="lazy">`;
    }
    return fallbackIcon(app.title, app.file_type);
  }
  function iconDataFromResult(result) {
    const value = result && result.icon;
    if (typeof value !== "string" || !value) return null;
    if (value.startsWith("data:image/")) return value;
    if (/^[A-Za-z0-9+/=\r\n]+$/.test(value)) return `data:image/png;base64,${value.replace(/\s/g,"")}`;
    return null;
  }
  async function extractApkIcon(file) {
    if (!window.AppInfoParser) return null;
    const result = await new window.AppInfoParser(file).parse();
    return iconDataFromResult(result);
  }
  function formatSize(bytes) {
    if (!bytes) return "UNKNOWN SIZE";
    const units = ["B","KB","MB","GB"]; let n=bytes, i=0;
    while(n>=1024 && i<units.length-1){n/=1024;i++;}
    return `${n.toFixed(i ? 1 : 0)} ${units[i]}`;
  }
  function escapeHtml(value="") {
    return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function init() {
    if (!configured) {
      $("appGrid").innerHTML = '<div class="loading">SETUP REQUIRED — ADD YOUR SUPABASE URL AND ANON KEY IN config.js</div>';
      $("adminOpen").disabled = true;
      return;
    }
    client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    loadApps();
    client.auth.getSession().then(({data}) => { if(data.session) setAdmin(data.session.user); });
    client.auth.onAuthStateChange((_event, session) => setAdmin(session?.user || null));
  }
  async function loadApps() {
    const {data,error} = await client.from("apps").select("*").order("created_at",{ascending:false});
    if(error){ $("appGrid").innerHTML='<div class="loading">Could not load store. Check Supabase setup.</div>'; console.error(error); return; }
    apps = data || [];
    $("totalApps").textContent = apps.length;
    renderApps();
    renderAdminList();
  }
  function renderApps() {
    const term = $("searchInput").value.trim().toLowerCase();
    const cat = $("categoryFilter").value;
    const shown = apps.filter(a => (!cat || a.category===cat) &&
      [a.title,a.description,a.category].join(" ").toLowerCase().includes(term));
    $("visibleCount").textContent = `${shown.length} FILE${shown.length===1?"":"S"}`;
    $("appGrid").innerHTML = shown.map(a => `
      <article class="app-card">
        <div class="card-top">${iconMarkup(a)}
          <div style="min-width:0"><div class="app-name">${escapeHtml(a.title)}</div><div class="app-meta">v${escapeHtml(a.version||"1.0")} · ${escapeHtml(a.category||"Other")}</div></div>
          <span class="tag">${escapeHtml(a.file_type||"FILE")}</span>
        </div>
        <p class="app-desc">${escapeHtml(a.description||"No description provided.")}</p>
        <div class="card-bottom"><span class="size">${formatSize(a.file_size)} · ${Number(a.downloads||0)} DOWNLOADS</span>
          <button class="download-btn" data-download="${a.id}">↓ DOWNLOAD</button></div>
      </article>`).join("");
    $("emptyState").classList.toggle("hidden", shown.length>0);
    $("appGrid").classList.toggle("hidden", shown.length===0);
    document.querySelectorAll("[data-download]").forEach(btn => btn.addEventListener("click", () => downloadApp(btn.dataset.download)));
  }
  async function downloadApp(id) {
    const app = apps.find(a=>a.id===id); if(!app) return;
    const {data,error} = await client.storage.from(BUCKET).createSignedUrl(app.storage_path,60);
    if(error){notice("Download link could not be created. Please try again."); return;}
    await client.rpc("increment_download_count",{p_app_id:id});
    const link=document.createElement("a"); link.href=data.signedUrl; link.download=app.file_name; document.body.appendChild(link); link.click(); link.remove();
    notice("Your download is starting...");
    setTimeout(loadApps,800);
  }
  function setAdmin(user) {
    currentUser=user;
    $("loginForm").classList.toggle("hidden",!!user);
    $("adminPanel").classList.toggle("hidden",!user);
    $("modalTitle").textContent=user?"Store management":"Admin access";
    $("modalIntro").textContent=user?"Upload, edit or remove store files.":"Sign in to manage store files.";
    if(user) renderAdminList();
  }
  function openModal(){modal.classList.remove("hidden");modalMessage("");}
  function closeModal(){modal.classList.add("hidden");}
  $("adminOpen").addEventListener("click",openModal);
  $("closeModal").addEventListener("click",closeModal);
  modal.querySelector(".modal-backdrop").addEventListener("click",closeModal);
  $("searchInput").addEventListener("input",renderApps);
  $("categoryFilter").addEventListener("change",renderApps);

  $("loginForm").addEventListener("submit",async e=>{
    e.preventDefault(); modalMessage("Signing in...");
    const {error}=await client.auth.signInWithPassword({email:$("adminEmail").value,password:$("adminPassword").value});
    if(error) modalMessage(error.message,true); else modalMessage("Signed in successfully.");
  });
  $("logoutBtn").addEventListener("click",async()=>{await client.auth.signOut(); modalMessage("Logged out.");});
  function renderAdminList(){
    if(!currentUser) return;
    $("adminList").innerHTML=apps.length ? apps.map(a=>`<div class="admin-row"><span>${escapeHtml(a.title)} <small style="color:#71867a">(${escapeHtml(a.file_type)})</small></span><button data-edit="${a.id}">EDIT</button><button class="delete" data-delete="${a.id}">DELETE</button></div>`).join("") : '<p class="hint">No files uploaded yet.</p>';
    document.querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>beginEdit(b.dataset.edit)));
    document.querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>deleteApp(b.dataset.delete)));
  }
  function beginEdit(id){
    const a=apps.find(x=>x.id===id); if(!a)return;
    $("editId").value=a.id; $("fileTitle").value=a.title; $("fileVersion").value=a.version||"";
    $("fileCategory").value=a.category||"Other"; $("fileDescription").value=a.description||"";
    $("fileInput").required=false; $("uploadBtn").innerHTML='SAVE CHANGES <span>✓</span>';
    $("cancelEdit").classList.remove("hidden"); modalMessage("Editing "+a.title);
    $("uploadForm").scrollIntoView({behavior:"smooth",block:"start"});
  }
  function resetEdit(){
    $("uploadForm").reset(); $("editId").value=""; $("fileInput").required=true;
    $("uploadBtn").innerHTML='UPLOAD FILE <span>↑</span>'; $("cancelEdit").classList.add("hidden");
  }
  $("cancelEdit").addEventListener("click",resetEdit);
  $("uploadForm").addEventListener("submit",async e=>{
    e.preventDefault(); if(!currentUser){modalMessage("Please sign in first.",true);return;}
    const id=$("editId").value, file=$("fileInput").files[0], title=$("fileTitle").value.trim();
    if(!id && !file){modalMessage("Choose an APK or ZIP file.",true);return;}
    if(file){
      const ext=file.name.split(".").pop().toLowerCase();
      if(!["apk","zip"].includes(ext)){modalMessage("Only .apk and .zip files are allowed.",true);return;}
      if(file.size>100*1024*1024){modalMessage("File is larger than 100 MB.",true);return;}
    }
    $("uploadBtn").disabled=true; modalMessage(file?"Uploading file...":"Saving changes...");
    try{
      let existing=apps.find(a=>a.id===id), storagePath=existing?.storage_path, fileName=existing?.file_name, fileType=existing?.file_type, fileSize=existing?.file_size;
      let iconData=existing?.icon_data || null;
      if(file){
        if(file.name.toLowerCase().endsWith(".apk")) {
          modalMessage("APK icon is being extracted...");
          try { iconData = await extractApkIcon(file); } catch(parseError) { console.warn("APK icon extraction failed:",parseError); iconData=null; }
        } else { iconData=null; }
        storagePath=`${crypto.randomUUID()}.${file.name.split(".").pop().toLowerCase()}`;
        const {error:upErr}=await client.storage.from(BUCKET).upload(storagePath,file,{upsert:false,contentType:file.type||"application/octet-stream"});
        if(upErr) throw upErr;
        fileName=file.name; fileType=file.name.split(".").pop().toUpperCase(); fileSize=file.size;
      }
      const record={title,version:$("fileVersion").value.trim()||"1.0",category:$("fileCategory").value,description:$("fileDescription").value.trim(),icon_data:iconData,storage_path:storagePath,file_name:fileName,file_type:fileType,file_size:fileSize};
      let result;
      if(id) result=await client.from("apps").update(record).eq("id",id);
      else result=await client.from("apps").insert({...record,downloads:0});
      if(result.error) throw result.error;
      if(file && existing) await client.storage.from(BUCKET).remove([existing.storage_path]);
      resetEdit(); modalMessage("Saved successfully."); await loadApps();
    }catch(err){console.error(err);modalMessage(err.message||"Upload failed.",true);}
    finally{$("uploadBtn").disabled=false;}
  });
  $("backfillIcons").addEventListener("click", async () => {
    if (!currentUser) { modalMessage("Please sign in first.",true); return; }
    const pending = apps.filter(a => a.file_type === "APK" && !a.icon_data);
    if (!pending.length) { modalMessage("All APK icons are already generated."); return; }
    const button = $("backfillIcons"); button.disabled = true;
    let done = 0, failed = 0;
    for (const app of pending) {
      modalMessage(`Generating old APK icons: ${done+failed+1}/${pending.length} — ${app.title}`);
      try {
        const {data,error} = await client.storage.from(BUCKET).createSignedUrl(app.storage_path,120);
        if (error) throw error;
        const response = await fetch(data.signedUrl);
        if (!response.ok) throw new Error("Could not read APK file");
        const blob = await response.blob();
        const iconData = await extractApkIcon(new File([blob],app.file_name,{type:"application/vnd.android.package-archive"}));
        if (!iconData) throw new Error("APK icon not found in this file");
        const {error:updateError} = await client.from("apps").update({icon_data:iconData}).eq("id",app.id);
        if (updateError) throw updateError;
        done++;
      } catch(err) { console.warn("Could not generate icon for",app.title,err); failed++; }
    }
    button.disabled = false;
    modalMessage(`Finished: ${done} icons generated, ${failed} could not be extracted.`);
    await loadApps();
  });

  async function deleteApp(id){
    const a=apps.find(x=>x.id===id); if(!a || !confirm(`Delete "${a.title}"? This cannot be undone.`))return;
    const {error}=await client.from("apps").delete().eq("id",id);
    if(error){modalMessage(error.message,true);return;}
    await client.storage.from(BUCKET).remove([a.storage_path]);
    modalMessage("File deleted."); await loadApps();
  }
  init();
})();
