(()=>{
  let unlocked=sessionStorage.getItem('linxensPortalUnlocked')==='1';
  const form=document.getElementById('secureForm'), input=document.getElementById('securePassword'), msg=document.getElementById('secureMessage');
  const view=document.getElementById('viewLink'), download=document.getElementById('downloadLink');
  function render(){
    [view,download].forEach((el,i)=>{el.textContent=(unlocked?'':'🔒 ')+(i?'DOWNLOAD PDF':'VIEW DOCUMENT');el.classList.toggle('locked',!unlocked);});
    if(form) form.hidden=unlocked;
  }
  window.portalApplyLinks=(doc)=>{
    view.href=unlocked&&doc.hasView?`/.netlify/functions/portal-document?id=${encodeURIComponent(doc.no)}&action=view`:'#';
    download.href=unlocked&&doc.hasPdf?`/.netlify/functions/portal-document?id=${encodeURIComponent(doc.no)}&action=pdf`:'#';
    view.classList.toggle('disabled',unlocked&&!doc.hasView); download.classList.toggle('disabled',unlocked&&!doc.hasPdf);
    render();
  };
  [view,download].forEach(el=>el.addEventListener('click',e=>{if(!unlocked){e.preventDefault();form.hidden=false;input.focus();}}));
  form.addEventListener('submit',async e=>{
    e.preventDefault(); msg.textContent='Checking…';
    try{
      const r=await fetch('/.netlify/functions/portal-auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:input.value})});
      const j=await r.json();
      if(!r.ok){msg.textContent=j.error||'Incorrect password. Please try again.';return;}
      unlocked=true; sessionStorage.setItem('linxensPortalUnlocked','1'); input.value=''; msg.textContent='ACCESS GRANTED'; render();
      if(window.refreshPortalLinks) window.refreshPortalLinks();
      setTimeout(()=>{msg.textContent='';},2000);
    }catch(_){msg.textContent='Secure access is temporarily unavailable.';}
  });
  render();
})();