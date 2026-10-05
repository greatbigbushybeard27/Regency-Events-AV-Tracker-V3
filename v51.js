/* Regency Events AV Tracker V51 feature layer. */
(function(){
  'use strict';
  function ensureV51(){
    data.v51 = data.v51 || {};
    data.v51.documents = Array.isArray(data.v51.documents) ? data.v51.documents : [];
    data.v51.hires = Array.isArray(data.v51.hires) ? data.v51.hires : [];
    return data.v51;
  }
  const V=()=>ensureV51();
  const e=s=>esc(String(s??''));
  const today=()=>new Date().toISOString().slice(0,10);
  function fileMeta(f){return f?{name:f.name,size:f.size,type:f.type||'',lastModified:f.lastModified||0}:null}
  async function storeFile(file,folder,id){
    if(!file)return null;
    const meta=fileMeta(file);
    if(typeof cloudIsReady==='function'&&cloudIsReady()&&typeof supabaseClient!=='undefined'){
      const safe=(file.name||'file').replace(/[^a-zA-Z0-9._-]+/g,'_');
      const path=`v51/${folder}/${id}-${safe}`;
      try{const {error}=await supabaseClient.storage.from(HS_STORAGE_BUCKET).upload(path,file,{upsert:true,contentType:file.type||'application/octet-stream'});if(!error){meta.cloudPath=path;meta.cloud=true;}}catch(err){console.error('V51 file upload failed',err)}
    }
    return meta;
  }

  function v51Documents(){
    const u=currentUser(); if(!u)return showLoginOverlay();
    const docs=V().documents.filter(d=>d.userId===u.id);
    openModal(`<h2>📁 My Documents</h2>
      <p class="muted">Keep your personal certificates, right-to-work documents and other crew paperwork with your profile.</p>
      <div class="card"><label>Document name</label><input id="v51_doc_name" placeholder="e.g. IPAF Certificate"><label>Document type</label><input id="v51_doc_type" placeholder="Certificate / Right to Work / Licence"><label>File</label><input id="v51_doc_file" type="file" accept="image/*,.pdf,.doc,.docx"><button onclick="v51AddDocument()">＋ Upload Document</button></div>
      <div class="card"><h3>Your Documents</h3>${docs.length?docs.map(d=>`<div class="admin-hours-row"><div><b>${e(d.name)}</b><div class="small muted">${e(d.type||'Document')} · ${e(d.file?.name||'Uploaded file')}</div></div><button class="danger" onclick="v51DeleteDocument('${e(d.id)}')">Delete</button></div>`).join(''):'<div class="empty">No documents uploaded yet.</div>'}</div>
      <button class="secondary" onclick="openCrewProfile()">← My Profile</button>`);
  }
  async function v51AddDocument(){
    const u=currentUser(); if(!u)return;
    const name=v('v51_doc_name').trim(),type=v('v51_doc_type').trim(),f=document.getElementById('v51_doc_file')?.files?.[0];
    if(!name||!f)return alert('Enter a document name and choose a file.');
    const did=makeId('doc');const stored=await storeFile(f,'crew-documents',did);V().documents.push({id:did,userId:u.id,name,type,file:stored,addedAt:new Date().toISOString()});
    save(); v51Documents();
  }
  function v51DeleteDocument(id){if(!confirm('Delete this document?'))return;V().documents=V().documents.filter(d=>d.id!==id);save();v51Documents()}

  function v51WageSetup(){
    const u=currentUser(); if(!u)return showLoginOverlay();
    const w=ensureWageSettings(u); returnToProfileOnClose=true;
    openModal(`<h2>⚙️ Wage Setup</h2><p class="muted">Set the three hourly rates, tax percentage and your Social Security Number.</p>
      <label>Standard Rate (£/hour)</label><input id="w_standard" type="number" min="0" step="0.01" value="${w.standardRate.toFixed(2)}">
      <label>Enhanced Rate 1 (£/hour)</label><input id="w_enh1" type="number" min="0" step="0.01" value="${w.enhanced1Rate.toFixed(2)}">
      <label>Enhanced Rate 2 (£/hour)</label><input id="w_enh2" type="number" min="0" step="0.01" value="${w.enhanced2Rate.toFixed(2)}">
      <label>Tax deduction (%)</label><input id="w_tax" type="number" min="0" max="100" step="0.01" value="${w.taxPercent.toFixed(2)}">
      <label>Social Security Number</label><input id="w_ssn" type="text" inputmode="numeric" autocomplete="off" value="${e(u.socialSecurityNumber||'')}" placeholder="Enter Social Security Number">
      <p class="small muted">Your Social Security Number is attached to your crew profile and is used by the wage setup.</p><button onclick="v51SaveWageSetup()">Save Wage Setup</button>`);
  }
  function v51SaveWageSetup(){
    const u=currentUser();if(!u)return;
    const std=Math.max(0,Number(v('w_standard'))||0),e1=Math.max(0,Number(v('w_enh1'))||0),e2=Math.max(0,Number(v('w_enh2'))||0),tax=Math.max(0,Math.min(100,Number(v('w_tax'))||0));
    if(!std||!e1||!e2)return alert('Enter all three hourly rates.');
    u.wageSettings={standardRate:std,enhanced1Rate:e1,enhanced2Rate:e2,taxPercent:tax};u.socialSecurityNumber=v('w_ssn').trim();save();returnToProfileOnClose=false;closeModal();openCrewProfile();
  }

  function v51VehicleAvailability(vehicle,start,end,ignoreId){
    return !V().hires.some(h=>h.vehicle===vehicle&&h.id!==ignoreId&&h.status!=='Returned'&&h.start<=end&&h.end>=start);
  }
  function v51HireVehicles(){
    const hires=V().hires.slice().sort((a,b)=>String(b.start).localeCompare(String(a.start)));
    openModal(`<h2>🚐 Hire Vehicles</h2><p class="muted">Hire vehicles for jobs and keep the return process locked until the vehicle has been checked.</p>
      <div class="card"><h3>New Vehicle Hire</h3>
      <label>Vehicle</label><input id="v51_h_vehicle" placeholder="Vehicle name / registration">
      <label>Hire start</label><input id="v51_h_start" type="date" value="${today()}">
      <label>Return date</label><input id="v51_h_end" type="date" value="${today()}">
      <label>Region</label><select id="v51_h_region"><option>Local</option><option>UK</option><option>Europe</option></select>
      <label>Driving licence</label><input id="v51_h_licence" type="file" accept="image/*,.pdf">
      <label>Signed rental agreement</label><input id="v51_h_agreement" type="file" accept="image/*,.pdf">
      <label>Vehicle photos (up to 2)</label><input id="v51_h_photos" type="file" accept="image/*" multiple>
      <label>Short damage video</label><input id="v51_h_video" type="file" accept="video/*">
      <button onclick="v51AddHire()">＋ Start Vehicle Hire</button></div>
      <div class="card"><h3>Vehicle Hires</h3>${hires.length?hires.map(h=>v51HireRow(h)).join(''):'<div class="empty">No vehicle hires recorded.</div>'}</div>`);
  }
  function v51HireRow(h){
    const returnReady=h.status==='On Hire'&&h.returnChecked;
    return `<div class="admin-hours-row" style="align-items:flex-start"><div><b>${e(h.vehicle)}</b><div class="small muted">${e(h.start)} → ${e(h.end)} · ${e(h.region)}</div><div class="small">Status: <b>${e(h.status)}</b></div><div class="small muted">Licence ${h.licence?'✓':'✗'} · Agreement ${h.agreement?'✓':'✗'} · Photos ${Array.isArray(h.photos)?h.photos.length:(h.photos||0)}/2 · Damage video ${h.video?'✓':'✗'}</div>${h.returnCondition?`<div class="small muted">Return: ${e(h.returnCondition)}${h.returnNotes?' · '+e(h.returnNotes):''}</div>`:''}</div><div class="actions">${h.status==='On Hire'?`<button class="secondary" onclick="v51ReturnCheck('${e(h.id)}')">Return / Check Vehicle</button>`:`<span class="badge">Returned</span>`}</div></div>`;
  }
  async function v51AddHire(){
    const vehicle=v('v51_h_vehicle').trim(),start=v('v51_h_start'),end=v('v51_h_end'),region=v('v51_h_region'),lic=document.getElementById('v51_h_licence')?.files?.[0],agreement=document.getElementById('v51_h_agreement')?.files?.[0],photos=[...(document.getElementById('v51_h_photos')?.files||[])].slice(0,2),video=document.getElementById('v51_h_video')?.files?.[0];
    if(!vehicle||!start||!end||start>end)return alert('Enter valid hire dates.');
    if(!lic||!agreement)return alert('Driving licence and signed rental agreement are required.');
    if(!v51VehicleAvailability(vehicle,start,end))return alert('That vehicle is already on hire for part of those dates.');
    const hid=makeId('hire');const licence=await storeFile(lic,'hire-documents',hid+'-licence');const agreementMeta=await storeFile(agreement,'hire-documents',hid+'-agreement');const photoMeta=[];for(let i=0;i<photos.length;i++)photoMeta.push(await storeFile(photos[i],'hire-photos',hid+'-p'+i));const videoMeta=await storeFile(video,'hire-damage',hid+'-damage');V().hires.push({id:hid,vehicle,start,end,region,licence,agreement:agreementMeta,photos:photoMeta,video:videoMeta,status:'On Hire',returnChecked:false,createdAt:new Date().toISOString()});save();v51HireVehicles();
  }
  function v51ReturnCheck(id){
    const h=V().hires.find(x=>x.id===id);if(!h)return;
    openModal(`<h2>🔎 Vehicle Return Check</h2><p><b>${e(h.vehicle)}</b> cannot be closed until the return condition has been checked.</p><label>Return condition</label><select id="v51_return_condition"><option>Good / no new damage</option><option>New damage recorded</option><option>Needs inspection</option></select><label>Return photos</label><input id="v51_return_photos" type="file" accept="image/*" multiple><label>Return notes</label><textarea id="v51_return_notes" rows="4" placeholder="Record condition, damage or fuel notes"></textarea><button onclick="v51CompleteReturn('${e(id)}')">✓ Complete Return Check</button>`);
  }
  async function v51CompleteReturn(id){
    const h=V().hires.find(x=>x.id===id);if(!h)return;
    const photos=[...(document.getElementById('v51_return_photos')?.files||[])].slice(0,2);h.returnCondition=v('v51_return_condition');h.returnNotes=v('v51_return_notes');h.returnPhotos=[];for(let i=0;i<photos.length;i++)h.returnPhotos.push(await storeFile(photos[i],'hire-return',id+'-p'+i));h.returnChecked=true;h.status='Returned';h.returnedAt=new Date().toISOString();save();v51HireVehicles();
  }

  function v51Install(){
    if(!document.getElementById('v51ScanButton')){const b=document.createElement('button');b.id='v51ScanButton';b.className='v51-scan-button';b.title='Scan QR / barcode';b.textContent='🔍';b.onclick=()=>typeof startExistingQRScan==='function'?startExistingQRScan():showPage('scanner');document.body.appendChild(b)}
    document.querySelectorAll('.pwa-nav button').forEach(b=>{if(/^\s*Scan\s*$/i.test(b.textContent||''))b.remove()});
    const nav=document.querySelector('.pwa-nav');
    if(nav&&!document.getElementById('v51HireNav')){const b=document.createElement('button');b.id='v51HireNav';b.onclick=()=>v51HireVehicles();b.innerHTML='<span class="nav-icon">🚐</span><span class="nav-label">Hire Vehicles</span>';const portal=[...nav.querySelectorAll('button')].find(x=>/Portaloo/i.test(x.textContent||''));const notif=[...nav.querySelectorAll('button')].find(x=>/Notifications/i.test(x.textContent||''));if(portal&&notif)nav.insertBefore(b,notif);else nav.appendChild(b)}
    const p=document.getElementById('hireVehicles');if(p&&!p.innerHTML)p.innerHTML='';
  }
  window.v51Documents=v51Documents;window.v51AddDocument=v51AddDocument;window.v51DeleteDocument=v51DeleteDocument;window.v51WageSetup=v51WageSetup;window.v51SaveWageSetup=v51SaveWageSetup;window.v51HireVehicles=v51HireVehicles;window.v51AddHire=v51AddHire;window.v51ReturnCheck=v51ReturnCheck;window.v51CompleteReturn=v51CompleteReturn;
  const s=document.createElement('style');s.textContent='.v51-scan-button{position:fixed;top:14px;right:14px;z-index:99990;width:44px;height:44px;border-radius:50%;border:1px solid #555;background:#121712;color:#fff;font-size:21px;box-shadow:0 5px 20px #0008}.v51-scan-button:active{transform:scale(.96)}';document.head.appendChild(s);
  const oldProfile=window.openCrewProfile;
  window.openCrewProfile=function(){oldProfile();setTimeout(()=>{const sheet=document.querySelector('#modal:not(.hidden) .sheet');if(!sheet||sheet.querySelector('#v51ProfileTools'))return;const box=document.createElement('div');box.id='v51ProfileTools';box.className='profile-section';box.innerHTML='<h3>📁 My Documents</h3><p class="muted">Certificates, right-to-work and other personal documents.</p><button class="secondary" onclick="v51Documents()">My Documents</button>';sheet.appendChild(box)},50)};
  const oldWage=window.openWageSetup;
  window.openWageSetup=function(){v51WageSetup()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',v51Install);else v51Install();
})();
