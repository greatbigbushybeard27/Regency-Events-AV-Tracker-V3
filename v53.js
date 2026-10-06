
(function(){
'use strict';

function esc53(s){
  return typeof esc==='function' ? esc(String(s ?? '')) :
    String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function v53Data(){ return window.data || {}; }
function v53Ensure(){
  const d=v53Data();
  d.v51=d.v51||{};
  d.v51.hireVehicles=Array.isArray(d.v51.hireVehicles)?d.v51.hireVehicles:[];
  d.v51.vehicleFiles=Array.isArray(d.v51.vehicleFiles)?d.v51.vehicleFiles:[];
  return d.v51;
}
function v53Persist(){
  if(typeof save==='function') save();
  else localStorage.setItem('avtracker_v1',JSON.stringify(v53Data()));
}

/* -----------------------------------------------------------
   1. Fix the real Hire page routing problem.
   The original showPage() does not include hireVehicles.
----------------------------------------------------------- */
function installHireRouting(){
  if(typeof window.showPage!=='function' || window.showPage.__v53) return;
  const original=window.showPage;
  function fixedShowPage(page){
    if(page==='hireVehicles'){
      if(typeof requireLogin==='function' && !requireLogin()) return;
      ['dashboard','create','equipment','events','jobs','portaloo','marquee','activity','notifications','hours','healthSafety','crewHealthSafety','crewLoginEdit','scanner','hireVehicles']
        .forEach(id=>{
          const el=document.getElementById(id);
          if(el) el.classList.toggle('hidden',id!=='hireVehicles');
        });
      if(typeof renderHireVehicles==='function') setTimeout(()=>renderHireVehicles(),0);
      return;
    }
    return original.apply(this,arguments);
  }
  fixedShowPage.__v53=true;
  window.showPage=fixedShowPage;
}

/* -----------------------------------------------------------
   2. Clean Scan/search controls.
----------------------------------------------------------- */
function installHeaderAndNav(){
  document.querySelectorAll('.pwa-nav button').forEach(b=>{
    const t=(b.innerText||'').trim().toLowerCase();
    if(t==='scan') b.remove();
  });

  const oldQR=document.getElementById('v51HeaderQR');
  if(oldQR) oldQR.remove();

  const inner=document.querySelector('.app-header-inner');
  if(inner && !document.getElementById('v53HeaderSearch')){
    const b=document.createElement('button');
    b.id='v53HeaderSearch';
    b.type='button';
    b.setAttribute('aria-label','Search equipment');
    b.title='Search equipment';
    b.textContent='🔍';
    b.style.cssText=[
      'position:absolute','right:12px','top:10px','z-index:50',
      'width:42px','height:42px','border-radius:50%',
      'border:0','background:rgba(0,0,0,.58)',
      'color:#fff','font-size:22px','display:flex',
      'align-items:center','justify-content:center',
      'cursor:pointer','box-shadow:0 2px 8px rgba(0,0,0,.25)'
    ].join(';');
    b.onclick=function(){
      try{ showPage('equipment'); }catch(e){}
      setTimeout(()=>{
        const q=document.querySelector('#equipment input[placeholder*="earch"],#equipment input[type="search"],#equipment input');
        if(q){q.focus();q.scrollIntoView({behavior:'smooth',block:'center'});}
      },80);
    };
    inner.style.position=inner.style.position||'relative';
    inner.appendChild(b);
  }
}

/* -----------------------------------------------------------
   3. Van stock: registration number.
----------------------------------------------------------- */
window.newVanRecord=function(){
  if(typeof openModal!=='function') return;
  openModal(`
    <div class="section-head"><div><h2>🚐 Add Van</h2></div></div>
    <label>Van photo<input id="van_photo" type="file" accept="image/*"></label>
    <label>Van name<input id="van_name" placeholder="e.g. Transit 350"></label>
    <label>Registration number<input id="van_registration" placeholder="e.g. GU12 ABC" autocomplete="off"></label>
    <button style="width:100%;margin-top:14px" onclick="addVan()">Save van</button>
  `);
};

window.addVan=function(){
  const d=v53Data();
  d.vans=Array.isArray(d.vans)?d.vans:[];
  const name=(document.getElementById('van_name')?.value||'').trim();
  const registration=(document.getElementById('van_registration')?.value||'').trim().toUpperCase();
  if(!name) return alert('Enter the van name.');
  if(!registration) return alert('Enter the registration number.');
  if(d.vans.some(v=>(v.registration||'').toUpperCase()===registration))
    return alert('That registration number is already in van stock.');

  const v={id:'van_'+Date.now()+'_'+Math.random().toString(36).slice(2),name,registration};
  const f=document.getElementById('van_photo')?.files?.[0];
  if(f) v.photoFromInput=f.name;
  d.vans.push(v);
  v53Persist();
  if(typeof closeModal==='function') closeModal();
  if(typeof showPage==='function') showPage('create');
};

/* -----------------------------------------------------------
   4. Hire vehicles: clean form and vehicle-stock selection.
----------------------------------------------------------- */
function hireStatus(v){
  const now=new Date();
  const from=v.start?new Date(v.start+'T00:00:00'):null;
  const to=v.end?new Date(v.end+'T23:59:59'):null;
  if(v.returned) return 'Returned';
  if(from && now<from) return 'Booked';
  if(to && now>to) return 'Overdue';
  return 'On hire';
}
function hireStatusClass(s){return s.toLowerCase().replace(/\s+/g,'-')}

window.openHireVehicles=function(){
  if(typeof showPage==='function') showPage('hireVehicles');
  else if(typeof renderHireVehicles==='function') renderHireVehicles();
};

window.renderHireVehicles=function(){
  const el=document.getElementById('hireVehicles');
  if(!el) return;
  const h=v53Ensure();
  const arr=h.hireVehicles.slice().sort((a,b)=>(a.start||'').localeCompare(b.start||''));
  el.innerHTML=`
    <div class="card">
      <div class="section-head">
        <div>
          <h2 style="margin:0">🚐 Hire Vehicles</h2>
          <div class="muted">Track hired vehicles and their hire periods.</div>
        </div>
        <button onclick="newHireVehicle()">＋ Hire vehicle</button>
      </div>
      <div class="v51-filter">
        <select id="v53HireFilter" onchange="renderHireVehicles()">
          <option value="">All vehicles</option><option>Booked</option>
          <option>On hire</option><option>Overdue</option><option>Returned</option>
        </select>
        <input id="v53HireSearch" placeholder="Search vehicle or customer" oninput="renderHireVehicles()">
      </div>
      <div id="v53HireList">${renderHireCards(arr)}</div>
    </div>`;
  const f=document.getElementById('v53HireFilter');
  const q=document.getElementById('v53HireSearch');
  if(f) f.value=window._v53HireFilter||'';
  if(q) q.value=window._v53HireSearch||'';
};

function renderHireCards(all){
  const f=window._v53HireFilter||'';
  const q=(window._v53HireSearch||'').toLowerCase();
  const arr=all.filter(v=>!f||hireStatus(v)===f).filter(v=>
    !q || [v.vehicle,v.registration,v.customerName,v.customer].join(' ').toLowerCase().includes(q)
  );
  if(!arr.length) return '<div class="empty">No hire vehicles found.</div>';
  return arr.map(v=>{
    const st=hireStatus(v);
    return `<div class="v51-vehicle-card">
      <div class="v51-vehicle-title">
        <div><h3>${esc53(v.vehicle||'Unnamed vehicle')}</h3>
        <div class="asset-id">${esc53(v.registration||'No registration')}</div></div>
        <span class="v51-status ${hireStatusClass(st)}">${st}</span>
      </div>
      <div class="v51-grid">
        <div><small>Hire period</small><b>${esc53(v.start||'Not set')} → ${esc53(v.end||'Not set')}</b></div>
        <div><small>Customer</small><b>${esc53(v.customerName||v.customer||'')}</b></div>
        <div><small>Vehicle stock</small><b>${esc53(v.vehicleStockName||'')}</b></div>
        <div><small>Area</small><b>${esc53(v.area||'Local')}</b></div>
      </div>
      ${v.notes?`<div class="small muted">${esc53(v.notes)}</div>`:''}
      <div class="v51-actions">
        <button class="secondary" onclick="editHireVehicle('${v.id}')">Edit</button>
        ${!v.returned?`<button onclick="returnHireVehicle('${v.id}')">Return vehicle</button>`:''}
        <button class="danger" onclick="deleteHireVehicle('${v.id}')">Delete</button>
      </div>
    </div>`;
  }).join('');
}

window.v53HireSearch=function(x){window._v53HireSearch=x;renderHireVehicles()};

window.newHireVehicle=function(){openHireVehicleForm(null)};
window.editHireVehicle=function(id){
  const h=v53Ensure();
  openHireVehicleForm(h.hireVehicles.find(x=>x.id===id));
};

window.openHireVehicleForm=function(existing){
  const d=v53Data();
  const h=v53Ensure();
  const vans=Array.isArray(d.vans)?d.vans:[];
  const v=existing||{id:'hire_'+Date.now()+'_'+Math.random().toString(36).slice(2),area:'Local'};
  const options=vans.length
    ? vans.map(x=>`<option value="${esc53(x.id)}" ${x.id===v.vanId?'selected':''}>${esc53(x.name||'Unnamed van')} • ${esc53(x.registration||'No reg')}</option>`).join('')
    : '<option value="">No vehicles in van stock</option>';

  openModal(`
    <div class="section-head">
      <div><h2 style="margin:0">🚐 ${existing?'Edit hire':'Hire vehicle'}</h2></div>
    </div>
    <label>Vehicle from van stock
      <select id="hv_van">${options}</select>
    </label>
    <label>Customer name
      <input id="hv_customer_name" value="${esc53(v.customerName||v.customer||'')}">
    </label>
    <label>Hire start
      <input id="hv_start" type="date" value="${esc53(v.start||'')}">
    </label>
    <label>Hire end
      <input id="hv_end" type="date" value="${esc53(v.end||'')}">
    </label>
    <label>Area
      <select id="hv_area"><option>Local</option><option>UK</option><option>Europe</option></select>
    </label>
    <label>Notes<textarea id="hv_notes">${esc53(v.notes||'')}</textarea></label>
    <h3>Documents & condition</h3>
    <div class="v51-upload-grid">
      <label>Driving licence<input type="file" id="hv_licence" accept=".pdf,.jpg,.jpeg,.png"></label>
      <label>Signed rental agreement<input type="file" id="hv_agreement" accept=".pdf,.jpg,.jpeg,.png"></label>
      <label>Damage / condition video<input type="file" id="hv_video" accept="video/*"></label>
    </div>
    <button style="width:100%;margin-top:14px" onclick="saveHireVehicle('${v.id}',${!!existing})">Save vehicle</button>
  `);
  const a=document.getElementById('hv_area'); if(a) a.value=v.area||'Local';
};

window.saveHireVehicle=async function(id,existing){
  const h=v53Ensure();
  const d=v53Data();
  const van=d.vans?.find(x=>x.id===(document.getElementById('hv_van')?.value||''));
  const customer=(document.getElementById('hv_customer_name')?.value||'').trim();
  const start=document.getElementById('hv_start')?.value||'';
  const end=document.getElementById('hv_end')?.value||'';
  if(!van) return alert('Select a vehicle from van stock.');
  if(!customer) return alert('Enter the customer name.');
  if(!start||!end) return alert('Enter the hire start and end dates.');
  if(end<start) return alert('Hire end cannot be before hire start.');

  let x=h.hireVehicles.find(z=>z.id===id);
  if(!x){x={id,photoFileIds:[]};h.hireVehicles.push(x);}
  x.vanId=van.id;
  x.vehicle=van.name||'';
  x.registration=van.registration||'';
  x.vehicleStockName=van.name||'';
  x.customerName=customer;
  x.customer=customer;
  x.start=start;
  x.end=end;
  x.area=document.getElementById('hv_area')?.value||'Local';
  x.notes=(document.getElementById('hv_notes')?.value||'').trim();

  const jobs=[
    ['hv_licence','licenceFileId','hire-licence'],
    ['hv_agreement','agreementFileId','hire-agreement'],
    ['hv_video','conditionVideoId','hire-condition']
  ];
  for(const [input,key,folder] of jobs){
    const file=document.getElementById(input)?.files?.[0];
    if(file && typeof uploadV51File==='function'){
      const rec=await uploadV51File(file,folder,x.id);
      if(rec){h.vehicleFiles.push(rec);x[key]=rec.id;}
    }
  }
  x.updatedAt=new Date().toISOString();
  v53Persist();
  if(typeof closeModal==='function') closeModal();
  openHireVehicles();
};

/* Keep the existing V51 return/delete functions intact. */

/* -----------------------------------------------------------
   5. Make the Hire button reliable wherever it is generated.
----------------------------------------------------------- */
function hookHireButtons(){
  document.querySelectorAll('button,a').forEach(b=>{
    const t=(b.innerText||'').trim().toLowerCase();
    if(t==='hire' || t==='hire vehicles' || t.includes('hire vehicle')){
      if(!b.dataset.v53HireHooked){
        b.dataset.v53HireHooked='1';
        b.onclick=function(e){e.preventDefault();e.stopPropagation();openHireVehicles();};
      }
    }
  });
}

/* -----------------------------------------------------------
   Startup
----------------------------------------------------------- */
function boot53(){
  installHireRouting();
  installHeaderAndNav();
  hookHireButtons();
}
[50,300,1000,2000].forEach(ms=>setTimeout(boot53,ms));
window.addEventListener('load',()=>setTimeout(boot53,100));
})();
