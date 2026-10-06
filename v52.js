/* Regency Events AV Tracker V52 - Cloud password recovery */
(function(){
  'use strict';
  const SUPABASE_URL='https://ocavwsnobededtjtyrxu.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY='sb_publishable_wRWHfsVX78PdFPMCZqe1TQ_xz27C3W6';
  const APP_URL=window.location.origin+window.location.pathname;
  let recoveryClient=null;

  function el(id){return document.getElementById(id)}
  function val(id){const x=el(id);return x?String(x.value||'').trim():''}

  function client(){
    if(recoveryClient)return recoveryClient;
    if(!window.supabase?.createClient)return null;
    recoveryClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
    return recoveryClient;
  }

  function recoveryModal(message){
    openModal('<div class="cloud-modal-head"><div><h2 style="margin:0">🔐 Reset Cloud Password</h2><div class="cloud-modal-status"><span class="cloud-dot offline"></span>Password recovery</div></div></div>'+
      '<p class="muted">Choose a new password for your Regency Cloud account.</p>'+ 
      '<label>New password</label><input id="cloud_new_password" type="password" autocomplete="new-password" placeholder="New password">'+
      '<label>Confirm new password</label><input id="cloud_new_password2" type="password" autocomplete="new-password" placeholder="Confirm password">'+
      '<div class="actions"><button onclick="cloudCompletePasswordReset()">Save new password</button><button class="secondary" onclick="closeModal()">Cancel</button></div>'+ 
      '<div id="cloud_reset_msg" class="small" style="margin-top:10px;color:#ffcc66">'+(message?esc(message):'')+'</div>');
  }

  window.cloudForgotPassword=async function(){
    const email=val('cloud_email'),m=el('cloud_auth_msg');
    if(!email){if(m)m.textContent='Enter your email address first, then tap Forgot password.';return}
    const c=client();
    if(!c){if(m)m.textContent='Cloud service is not available. Please try again.';return}
    if(m)m.textContent='Sending password reset email…';
    try{
      const {error}=await c.auth.resetPasswordForEmail(email,{redirectTo:APP_URL});
      if(error)throw error;
      if(m)m.textContent='Password reset email sent. Check your inbox and spam folder.';
    }catch(e){console.error('Password reset request failed',e);if(m)m.textContent='Could not send the reset email. '+(e?.message||'Please try again.')}
  };

  window.cloudCompletePasswordReset=async function(){
    const p=val('cloud_new_password'),p2=val('cloud_new_password2'),m=el('cloud_reset_msg');
    if(p.length<6){if(m)m.textContent='Password must be at least 6 characters.';return}
    if(p!==p2){if(m)m.textContent='The two passwords do not match.';return}
    const c=client();if(!c){if(m)m.textContent='Cloud service is not available.';return}
    if(m)m.textContent='Saving your new password…';
    try{
      const {error}=await c.auth.updateUser({password:p});
      if(error)throw error;
      if(m)m.textContent='Password changed successfully.';
      setTimeout(()=>{closeModal();if(typeof cloudAuthModal==='function')cloudAuthModal()},700);
    }catch(e){console.error('Password update failed',e);if(m)m.textContent='Could not change the password. '+(e?.message||'Please try again.')}
  };

  function installRecovery(){
    const c=client();if(!c||installRecovery.done)return;
    installRecovery.done=true;
    c.auth.onAuthStateChange((event)=>{if(event==='PASSWORD_RECOVERY')setTimeout(()=>recoveryModal(),100)});
    // If the recovery redirect was loaded before this script registered the listener,
    // the client will still have the recovery session and we can offer the reset screen.
    setTimeout(async()=>{
      try{
        const {data}=await c.auth.getSession();
        if(data?.session && /type=recovery|code=/i.test(window.location.href))recoveryModal();
      }catch(e){}
    },300);
  }

  function patchCloudLogin(){
    installRecovery();
    if(typeof window.cloudAuthModal!=='function')return false;
    if(window.cloudAuthModal.__v52patched)return true;
    const original=window.cloudAuthModal;
    function patched(){
      original();
      if(window.cloudSession)return;
      setTimeout(()=>{
        const msg=el('cloud_auth_msg');
        if(!msg||el('cloud_forgot_password'))return;
        const btn=document.createElement('button');
        btn.id='cloud_forgot_password';btn.type='button';btn.className='secondary';btn.textContent='Forgot password?';btn.style.marginTop='8px';btn.style.width='100%';btn.onclick=window.cloudForgotPassword;
        msg.parentElement?.appendChild(btn);
      },50);
    }
    patched.__v52patched=true;
    window.cloudAuthModal=patched;
    return true;
  }

  function boot(){let tries=0;const t=setInterval(()=>{tries++;if(patchCloudLogin()||tries>160)clearInterval(t)},250)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
