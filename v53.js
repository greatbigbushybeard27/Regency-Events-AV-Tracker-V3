/* Regency Events AV Tracker V53 - Hire/Vans/Search UI update */
(function(){
  'use strict';

  function esc(x){
    if(typeof window.escV==='function') return window.escV(x);
    return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function v(id){const e=document.getElementById(id);return e?String(e.value||'').trim():''}
  function ensureV(){return typeof window.ensureV51==='function'?window.ensureV51():null}
  function persist(){if(typeof window.persist==='function')window.persist();else if(typeof window.save==='function')window.save()}
  function uid(){return 'hire-'+Date.now()+'-'+Math.random().toString(36).slice(2,8)}

  /* Move the old QR scanner to the banner: no Scan tab and no second QR button. */
  function installHeaderSearch(){
    document.querySelectorAll('.pwa-nav button').forEach(btn=>{
      const label=(btn.innerText||'').replace(/\s+/g,' ').trim().toLowerCase();
      if(label==='scan' || label.endsWith(' scan') || label.includes(' qr ')) btn.remove();
    });
    const old=document.getElementById('v51HeaderQR');
    if(old)old.remove();
    const inner=document.querySelector('.app-header-inner');
    const banner=document.querySelector('.app-header-banner');
    if(!inner||!banner)return;
    let btn=document.getElementById('v53HeaderSearch');
    if(!btn){
      inner.style.position='relative';
      btn=document.createElement('button');
      btn.id='v53HeaderSearch';
      btn.type='button';
      btn.setAttribute('aria-label','Scan QR or barcode');
      btn.title='Scan QR or barcode';
      btn.innerHTML='🔍';
      btn.onclick=function(){
        if(typeof window.startScan==='function'){ window.startScan(); return; }
        if(typeof window.showPage==='function') window.showPage('scanner');
      };
      inner.appendChild(btn);
    }
    btn.style.cssText='position:absolute;right:18px;top:12px;width:44px;height:44px;border:0!important;background:transparent!important;color:#fff!important;font-size:25px;line-height:1;display:flex;align-items:center;justify-content:center;z-index:20;box-shadow:none!important;padding:0;cursor:pointer;';
  }

  /* Make the Hire dashboard/nav entry always open a real Hire Vehicles page. */
  window.openHireVehicles=function(){
    if(typeof window.requireLogin==='function' && !window.requireLogin())return;
    let el=document.getElementById('hireVehicles');
    if(!el){
      const main=document.querySelector('main');
      if(!main)return alert('Hire Vehicles page could not be opened.');
      el=document.createElement('section');
      el.id='hireVehicles';
      el.className='hidden';
      main.appendChild(el);
    }
    ['dashboard','create','equipment','events','jobs','portaloo','marquee','activity','notifications','hours','healthSafety','crewHealthSafety','crewLoginEdit','scanner','hireVehicles'].forEach(id=>{
      const e=document.getElementById(id);if(e)e.classList.toggle('hidden',id!=='hireVehicles');
    });
    if(typeof window.stopScan==='function')window.stopScan();
    if(typeof window.renderHireVehicles==='function')window.renderHireVehicles();
    window.scrollTo({top:0,behavior:'smooth'});
  };

  /* Add registration number to the van record form and store it with the van. */
  window.newVanRecord=function(){
    if(typeof window.openModal!=='function')return;
    openModal(`<h2>Add van</h2>
      <label>Van photo</label><input class="photo-input" id="new_van_photo" type="file" accept="image/*">
      <label>Van name</label><input id="new_van" placeholder="Mercedes Sprinter / LWB Transit">
      <label>Registration number</label><input id="new_van_registration" placeholder="GY12 ABC" autocomplete="off" style="text-transform:uppercase">
      <button onclick="addVan()">＋ Add van</button>`);
  };

  window.addVan=async function(){
    const name=v('new_van');
    if(!name)return alert('Enter van name');
    const registration=v('new_van_registration').toUpperCase();
    const d=window.data;
    if(!d||!Array.isArray(d.vans))return alert('Van stock is not available.');
    if(registration && d.vans.some(x=>String(x.registration||'').toUpperCase()===registration))return alert('A van with that registration already exists.');
    const photo=typeof window.photoFromInput==='function'?await window.photoFromInput('new_van_photo'):'';
    d.vans.push({id:typeof window.makeId==='function'?window.makeId('van'):'van-'+Date.now(),name,registration,photo});
    if(typeof window.logActivity==='function')window.logActivity({itemName:name,action:'Van added',at:new Date().toISOString()});
    persist();
    if(typeof window.closeModal==='function')window.closeModal();
    if(typeof window.showPage==='function')window.showPage('create');
  };

  function vanOptions(selected){
    const d=window.data||{};
    const vans=Array.isArray(d.vans)?d.vans:[];
    if(!vans.length)return '<option value="">No vans in stock. Add a van first.</option>';
    return '<option value="">Select a van from stock</option>'+vans.map(x=>`<option value="${esc(x.id)}" ${String(x.id)===String(selected||'')?'selected':''}>${esc(x.name||'Unnamed van')}${x.registration?' • '+esc(x.registration):''}</option>`).join('');
  }

  function selectedVan(id){
    const d=window.data||{};
    return (d.vans||[]).find(x=>String(x.id)===String(id))||null;
  }

  /* New Hire Vehicle form: vehicle comes from van stock, customer name + dates remain. */
  window.openHireVehicleForm=function(existing){
    const state=ensureV();
    if(!state)return;
    const x=existing||{id:uid(),area:'Local',photoFileIds:[],vanId:''};
    window._v51EditingVehicle=x.id;
    const heading=existing?'Edit hire':'Hire vehicle';
    openModal(`<div>
      <div class="section-head"><div><h2 style="margin:0">🚐 ${heading}</h2></div></div>
      <div class="v51-form">
        <label>Vehicle from van stock
          <select id="hv_van">${vanOptions(x.vanId)}</select>
        </label>
        <label>Customer name
          <input id="hv_customer_name" value="${esc(x.customerName||x.customer||'')}" placeholder="Customer name">
        </label>
        <label>Hire start
          <input id="hv_start" type="date" value="${esc(x.start||'')}">
        </label>
        <label>Hire end
          <input id="hv_end" type="date" value="${esc(x.end||'')}">
        </label>
        <label>Area
          <select id="hv_area"><option>Local</option><option>UK</option><option>Europe</option></select>
        </label>
        <label>Notes
          <textarea id="hv_notes">${esc(x.notes||'')}</textarea>
        </label>
      </div>
      <h3>Documents & condition</h3>
      <div class="v51-upload-grid">
        <label>Driving licence<input type="file" id="hv_licence" accept=".pdf,.jpg,.jpeg,.png"></label>
        <label>Signed rental agreement<input type="file" id="hv_agreement" accept=".pdf,.jpg,.jpeg,.png"></label>
        <label>Damage / condition video<input type="file" id="hv_video" accept="video/*"></label>
      </div>
      <button style="width:100%;margin-top:14px" onclick="saveHireVehicle('${x.id}',${!!existing})">Save hire</button>
    </div>`);
    const a=document.getElementById('hv_area');if(a)a.value=x.area||'Local';
  };

  window.saveHireVehicle=async function(id,existing){
    const state=ensureV();if(!state)return;
    let x=state.hireVehicles.find(z=>z.id===id);
    if(!x){x={id,photoFileIds:[]};state.hireVehicles.push(x)}
    const vanId=v('hv_van');
    const van=selectedVan(vanId);
    const customer=v('hv_customer_name');
    x.vanId=vanId;
    x.vehicle=van?.name||'';
    x.registration=van?.registration||'';
    x.customerName=customer;
    x.customer=customer;
    x.start=v('hv_start');
    x.end=v('hv_end');
    x.area=v('hv_area')||'Local';
    x.notes=v('hv_notes');
    if(!van)return alert('Select a vehicle from van stock.');
    if(!customer)return alert('Enter the customer name.');
    if(!x.start)return alert('Enter the hire start date.');
    if(!x.end)return alert('Enter the hire end date.');
    if(x.end<x.start)return alert('Hire end date cannot be before the start date.');

    const jobs=[['hv_licence','licenceFileId','hire-licence'],['hv_agreement','agreementFileId','hire-agreement'],['hv_video','conditionVideoId','hire-condition']];
    for(const [id2,key,folder] of jobs){
      const file=document.getElementById(id2)?.files?.[0];
      if(file&&typeof window.uploadV51File==='function'){
        const rec=await window.uploadV51File(file,folder,x.id);
        if(rec){state.vehicleFiles.push(rec);x[key]=rec.id}
      }
    }
    x.updatedAt=new Date().toISOString();
    persist();
    if(typeof window.closeModal==='function')window.closeModal();
    if(typeof window.openHireVehicles==='function')window.openHireVehicles();
  };

  window.renderHireVehicles=function(){
    const el=document.getElementById('hireVehicles');if(!el)return;
    const state=ensureV();if(!state)return;
    const list=state.hireVehicles.slice().sort((a,b)=>(a.start||'').localeCompare(b.start||''));
    const filter=window._v53VehicleFilter||'';
    const query=(window._v53VehicleSearch||'').toLowerCase();
    const arr=list.filter(x=>!filter||vehicleStatus(x)===filter).filter(x=>!query||[x.vehicle,x.registration,x.customerName,x.customer,x.area].join(' ').toLowerCase().includes(query));
    el.innerHTML=`<div class="card"><div class="section-head"><div><h2 style="margin:0">🚐 Hire Vehicles</h2><div class="muted">Hire vehicles selected from your van stock.</div></div><button onclick="newHireVehicle()">＋ Hire vehicle</button></div>
      <div class="v51-filter"><select id="v53VehicleFilter" onchange="_v53SetFilter(this.value)"><option value="">All vehicles</option><option>Booked</option><option>On hire</option><option>Overdue</option><option>Returned</option></select><input id="v53VehicleSearch" placeholder="Search vehicle or customer" oninput="_v53SetSearch(this.value)"></div>
      <div id="v53VehicleList">${renderCards(arr)}</div></div>`;
    const f=document.getElementById('v53VehicleFilter');if(f)f.value=filter;
    const q=document.getElementById('v53VehicleSearch');if(q)q.value=window._v53VehicleSearch||'';
  };

  function renderCards(arr){
    if(!arr.length)return '<div class="empty">No hire vehicles found.</div>';
    return arr.map(x=>{
      const st=vehicleStatus(x);
      return `<div class="v51-vehicle-card"><div class="v51-vehicle-title"><div><h3>${esc(x.vehicle||'Unnamed vehicle')}</h3><div class="asset-id">${esc(x.registration||'No registration')}</div></div><span class="v51-status ${vehicleStatusClass(st)}">${st}</span></div>
      <div class="v51-grid"><div><small>Hire period</small><b>${esc(x.start||'Not set')} → ${esc(x.end||'Not set')}</b></div><div><small>Customer</small><b>${esc(x.customerName||x.customer||'')}</b></div><div><small>Area</small><b>${esc(x.area||'Local')}</b></div><div><small>Vehicle stock</small><b>${esc(x.vehicle||'')}</b></div></div>
      <div class="small muted">${x.notes?esc(x.notes):''}</div><div class="v51-file-chips">${x.licenceFileId?'🪪 Licence':''}${x.agreementFileId?' 📄 Agreement':''}${x.conditionVideoId?' 🎥 Condition video':''}</div>
      <div class="v51-actions"><button class="secondary" onclick="editHireVehicle('${x.id}')">Edit</button>${!x.returned?`<button onclick="returnHireVehicle('${x.id}')">Return vehicle</button>`:''}<button class="danger" onclick="deleteHireVehicle('${x.id}')">Delete</button></div></div>`;
    }).join('');
  }

  window._v53SetFilter=function(x){window._v53VehicleFilter=x;renderHireVehicles()};
  window._v53SetSearch=function(x){window._v53VehicleSearch=x;renderHireVehicles()};

  /* Keep the old Hire button entry points working with the new form. */
  window.newHireVehicle=function(){openHireVehicleForm(null)};
  window.editHireVehicle=function(id){const s=ensureV();const x=s?.hireVehicles.find(z=>z.id===id);if(x)openHireVehicleForm(x)};

  function install(){
    installHeaderSearch();
    if(!document.getElementById('hireVehicles')){
      const main=document.querySelector('main');
      if(main){const sec=document.createElement('section');sec.id='hireVehicles';sec.className='hidden';main.appendChild(sec)}
    }
    const nav=document.querySelector('.pwa-nav');
    if(nav&&!nav.__v53ScanObserver){
      const ob=new MutationObserver(installHeaderSearch);
      ob.observe(nav,{childList:true,subtree:true});
      nav.__v53ScanObserver=true;
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,50));
  else setTimeout(install,50);
  setInterval(installHeaderSearch,1500);
})();
