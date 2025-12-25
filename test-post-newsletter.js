import fetch from 'node-fetch';

(async ()=>{
  try{
    const res = await fetch('http://localhost:3000/api/newsletter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'test@example.com'})});
    const txt = await res.text();
    console.log('status',res.status);
    console.log(txt);
  }catch(e){
    console.error('error',e.message);
  }
})();