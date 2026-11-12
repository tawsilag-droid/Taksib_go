// ============================================
// توصيلة سوهاج - النسخة الكاملة المفحوصة v200
// أدمن: sasahalawa123@gmail.com / 0000 / 01068131386
// مميزات: أدمن كامل + باتش + حاقن أكواد
// ============================================
const ADMIN_EMAIL = "sasahalawa123@gmail.com";
const ADMIN_PASS = "0000";
const ADMIN_PHONE = "01068131386";

const firebaseConfig = {
  apiKey: "AIzaSyCInSPfdx4IVQNZP-d5N20Iph9pPrjgEgY",
  authDomain: "tawsila-37a80.firebaseapp.com",
  databaseURL: "https://tawsila-37a80-default-rtdb.firebaseio.com",
  projectId: "tawsila-37a80",
  storageBucket: "tawsila-37a80.firebasestorage.app",
  messagingSenderId: "445529499230",
  appId: "1:445529499230:web:3dd3c1d31414d7576436cf",
  measurementId: "G-FE5MJE4R28"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

let currentUser=null, currentRole="client", currentTab="login", isLocalAdmin=false;
let adminTab="dash", allUsers={}, allOrders={}, searchQ="";
let appSettings={prices:{toktok:15,moto:25,car:50},announcement:"",maintenance:false,whatsapp:"01068131386",appName:"توصيلة سوهاج",injectHTML:"",injectCSS:"",injectJS:""};
let settingsLoaded=false, listenersStarted=false, injectedOnce=false;

// --- تحميل الإعدادات مرة واحدة - من غير ما يمسح اللوحة ---
db.ref('settings').on('value', s=>{
  if(s.val()) appSettings=Object.assign(appSettings,s.val());
  if(!settingsLoaded){ settingsLoaded=true; renderApp(); applyInjector(); }
  else { applyInjector(); updateHeaderName(); }
});
function updateHeaderName(){ const h=document.querySelector('h1'); if(h) h.textContent='🚕 '+appSettings.appName; }

// --- حاقن الأكواد - بيشتغل عند كل المستخدمين ---
function applyInjector(){
  if(injectedOnce) return; injectedOnce=true;
  try{
    if(appSettings.injectCSS){
      let st=document.getElementById('inject-css'); if(!st){ st=document.createElement('style'); st.id='inject-css'; document.head.appendChild(st); }
      st.textContent=appSettings.injectCSS;
    }
    if(appSettings.injectHTML){
      let d=document.getElementById('inject-html'); if(!d){ d=document.createElement('div'); d.id='inject-html'; document.body.appendChild(d); }
      d.innerHTML=appSettings.injectHTML;
    }
    if(appSettings.injectJS){
      let sc=document.createElement('script'); sc.textContent=appSettings.injectJS; document.body.appendChild(sc);
    }
  }catch(e){ console.log('inject error',e); }
}
function reApplyInjector(){ injectedOnce=false; applyInjector(); }

function renderApp(){
  const app=document.getElementById('tawsila-app'); if(!app) return;
  if(appSettings.maintenance && !isLocalAdmin && currentRole!=='admin'){
    app.innerHTML=`<div style="max-width:480px;margin:40px auto;padding:20px;text-align:center;background:#fff;border-radius:16px"><h1>🚕 ${appSettings.appName}</h1><h2>🛠️ تحت الصيانة</h2><p>ارجع بعد شوية</p><p>واتساب: ${appSettings.whatsapp}</p></div>`; return;
  }
  const isLogged = !!(currentUser||isLocalAdmin);
  app.innerHTML=`
  <div style="max-width:520px;margin:0 auto;padding:10px;padding-bottom:90px">
    <div style="background:#059669;color:#fff;border-radius:16px;padding:14px;text-align:center;position:sticky;top:10px;z-index:10">
      <h1 style="margin:0;font-size:22px">🚕 ${appSettings.appName}</h1>
      <p style="margin:4px 0 0;font-size:12px;opacity:.9">جرجا - طهطا - البلينا - سوهاج</p>
      <div style="display:flex;gap:6px;justify-content:center;margin-top:10px;flex-wrap:wrap">
        <a href="#" onclick="installPWA();return false" style="background:#facc15;color:#000;padding:6px 10px;border-radius:20px;font-size:12px;text-decoration:none;font-weight:bold">📥 تحميل التطبيق</a>
        <button onclick="showHelp()" style="background:#fff;color:#059669;border:none;padding:6px 10px;border-radius:20px;font-size:12px;font-weight:bold">💬 مساعد</button>
        ${isLogged?`<button onclick="logout()" style="background:#ef4444;color:#fff;border:none;padding:6px 10px;border-radius:20px;font-size:12px;font-weight:bold">خروج</button>`:''}
      </div>
    </div>
    ${appSettings.announcement?`<div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:12px;padding:10px;margin-top:10px;text-align:center;font-size:13px;font-weight:bold">📢 ${appSettings.announcement}</div>`:''}
    <div id="mainContent"></div>
  </div>`;
  if(isLogged) renderDashboard(); else renderAuth();
}

function renderAuth(){
  const c=document.getElementById('mainContent'); if(!c) return;
  c.innerHTML=`<div style="background:#fff;border-radius:16px;padding:16px;margin-top:10px">
    <div style="display:flex;gap:8px;margin-bottom:14px">
      <button onclick="switchTab('login')" style="flex:1;padding:10px;border-radius:10px;border:none;font-weight:bold;background:${currentTab==='login'?'#0f172a':'#e2e8f0'};color:${currentTab==='login'?'#fff':'#000'}">دخول</button>
      <button onclick="switchTab('signup')" style="flex:1;padding:10px;border-radius:10px;border:none;font-weight:bold;background:${currentTab==='signup'?'#0f172a':'#e2e8f0'};color:${currentTab==='signup'?'#fff':'#000'}">حساب جديد</button>
    </div>
    <label style="font-weight:bold;font-size:13px">البريد الإلكتروني</label><input id="emailInput" type="email" placeholder="name@gmail.com" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:10px;margin:6px 0 12px">
    <label style="font-weight:bold;font-size:13px">رقم الهاتف</label><input id="phoneInput" type="tel" placeholder="01xxxxxxxxx" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:10px;margin:6px 0 12px">
    <div style="display:${currentTab==='signup'?'block':'none'}"><label style="font-weight:bold;font-size:13px">الاسم بالكامل</label><input id="nameInput" type="text" placeholder="مثال: سيد أحمد" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:10px;margin:6px 0 12px"><label style="font-weight:bold;font-size:13px">نوع الحساب</label><select id="roleInput" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:10px;margin:6px 0 12px"><option value="client">عميل</option><option value="driver">كابتن</option></select></div>
    <label style="font-weight:bold;font-size:13px">كلمة المرور</label><input id="passInput" type="password" placeholder="••••••••" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:10px;margin:6px 0 14px">
    <button onclick="${currentTab==='login'?'login()':'signup()'}" style="width:100%;background:#059669;color:#fff;border:none;padding:13px;border-radius:10px;font-weight:bold">${currentTab==='login'?'🔒 دخول آمن':'✅ إنشاء حساب'}</button>
    <button onclick="loginGoogle()" style="width:100%;background:#fff;border:1px solid #ddd;padding:12px;border-radius:10px;margin-top:8px;font-weight:bold">🔵 دخول بجوجل</button>
    <p id="authMsg" style="text-align:center;color:#dc2626;font-size:13px"></p></div>`;
}
function switchTab(t){currentTab=t;renderAuth();}
function showHelp(){alert('توصيلة سوهاج\nواتساب: '+appSettings.whatsapp);}

async function login(){
  const email=document.getElementById('emailInput').value.trim().toLowerCase();
  const pass=document.getElementById('passInput').value;
  const msg=document.getElementById('authMsg');
  if(email===ADMIN_EMAIL && pass===ADMIN_PASS){ isLocalAdmin=true; currentRole='admin'; window._userData={name:'الأدمن',email:ADMIN_EMAIL,phone:ADMIN_PHONE,role:'admin',wallet:0}; sessionStorage.setItem('tawsila_admin','1'); startListeners(); renderApp(); return; }
  if(!email||!pass){msg.textContent='اكتب الإيميل وكلمة المرور';return;}
  msg.textContent='جارى الدخول...';
  try{await auth.signInWithEmailAndPassword(email,pass);}catch(e){msg.textContent='خطأ: '+e.code;}
}
async function signup(){
  const email=document.getElementById('emailInput').value.trim(); const pass=document.getElementById('passInput').value; const phone=document.getElementById('phoneInput').value.trim(); const name=document.getElementById('nameInput').value.trim(); const role=document.getElementById('roleInput').value; const msg=document.getElementById('authMsg');
  if(!email||!pass||!phone||!name){msg.textContent='اكمل كل البيانات';return;}
  if(pass.length<6){msg.textContent='كلمة المرور لازم 6 حروف';return;}
  if(email.toLowerCase()===ADMIN_EMAIL){msg.textContent='الإيميل ده محجوز';return;}
  try{const res=await auth.createUserWithEmailAndPassword(email,pass); await db.ref('users/'+res.user.uid).set({name,email,phone,role,wallet:0,blocked:false,driverApproved:role==='driver'?false:true,createdAt:Date.now()});}catch(e){msg.textContent='خطأ: '+e.code;}
}
async function loginGoogle(){
  try{
    const provider=new firebase.auth.GoogleAuthProvider();
    const isMobile=/Android|iPhone|iPad/i.test(navigator.userAgent);
    if(isMobile){ await auth.signInWithRedirect(provider); }
    else { const res=await auth.signInWithPopup(provider); await saveGoogleUser(res.user); }
  }catch(e){ alert('خطأ جوجل: '+e.message+'\nفعّل Google في Firebase وضيف الدومين tawsilag-droid.github.io'); }
}
async function saveGoogleUser(user){ if(!user) return; const snap=await db.ref('users/'+user.uid).once('value'); if(!snap.exists()) await db.ref('users/'+user.uid).set({name:user.displayName||'مستخدم جوجل',email:user.email,phone:'',role:'client',wallet:0,blocked:false,createdAt:Date.now()}); }
auth.getRedirectResult().then(async res=>{ if(res&&res.user) await saveGoogleUser(res.user); }).catch(()=>{});
function logout(){ isLocalAdmin=false; sessionStorage.removeItem('tawsila_admin'); auth.signOut(); }

auth.onAuthStateChanged(async(user)=>{
  if(isLocalAdmin||sessionStorage.getItem('tawsila_admin')==='1'){ isLocalAdmin=true; currentRole='admin'; window._userData={name:'الأدمن',email:ADMIN_EMAIL,phone:ADMIN_PHONE,role:'admin',wallet:0}; startListeners(); renderApp(); return; }
  if(user){ currentUser=user; const snap=await db.ref('users/'+user.uid).once('value'); let d=snap.val(); if(!d){ d={name:user.displayName||'مستخدم',email:user.email,phone:'',role:'client',wallet:0}; await db.ref('users/'+user.uid).set(d); } if(d.blocked){ alert('حسابك محظور'); auth.signOut(); return; } currentRole=d.role||'client'; window._userData=d; startListeners(); } else { currentUser=null; currentRole='client'; window._userData=null; }
  renderApp();
});

function startListeners(){
  if(listenersStarted) return; listenersStarted=true;
  db.ref('users').on('value', s=>{ allUsers=s.val()||{}; renderAdminContent(); renderClientOrdersLive(); });
  db.ref('orders').on('value', s=>{ allOrders=s.val()||{}; renderAdminContent(); renderClientOrdersLive(); renderDriverOrdersLive(); });
}
function renderClientOrdersLive(){ const el=document.getElementById('myOrders'); if(!el||!currentUser) return; const v=Object.entries(allOrders).filter(([id,o])=>o.clientId===currentUser.uid); if(!v.length){el.innerHTML='<p>لسه مفيش رحلات</p>';return;} el.innerHTML=v.reverse().map(([id,o])=>`<div style="border:1px solid #eee;border-radius:10px;padding:10px;margin-bottom:8px"><b>${o.from} → ${o.to}</b><br><span style="font-size:12px">${o.type} - ${o.price} ج - ${o.status}</span></div>`).join(''); }
function renderDriverOrdersLive(){ const el=document.getElementById('driverOrders'); if(!el) return; const v=Object.entries(allOrders).filter(([id,o])=>o.status==='pending'); if(!v.length){el.innerHTML='<p>مفيش طلبات</p>';return;} el.innerHTML=v.map(([id,o])=>`<div style="border:1px solid #eee;border-radius:10px;padding:10px;margin-bottom:8px"><b>${o.from} → ${o.to}</b><br><span style="font-size:12px">${o.type} - ${o.price} ج - ${o.clientName} - ${o.clientPhone}</span><br><button onclick="acceptOrder('${id}')" style="background:#059669;color:#fff;border:none;padding:8px 14px;border-radius:8px;margin-top:6px">قبول ✅</button></div>`).join(''); }

function renderDashboard(){
  const c=document.getElementById('mainContent'); if(!c) return; const u=window._userData||{}; const name=u.name||'مستخدم';
  if(currentRole==='admin'){ renderAdmin(); return; }
  if(currentRole==='driver'){
    c.innerHTML=`<div style="background:#fff;border-radius:16px;padding:16px;margin-top:10px"><h2>🚖 لوحة الكابتن</h2><p>أهلاً ${name} - رصيدك: <b>${u.wallet||0} ج</b> ${u.driverApproved===false?'<br><span style="color:#dc2626">⏳ بانتظار موافقة الأدمن</span>':''}</p><button onclick="toggleOnline()" id="onlineBtn" style="width:100%;background:#059669;color:#fff;border:none;padding:12px;border-radius:10px;font-weight:bold">🟢 أنا متاح الآن</button><h3>📍 الطلبات</h3><div id="driverOrders">جارى التحميل...</div></div>`; renderDriverOrdersLive(); return;
  }
  const p=appSettings.prices||{};
  c.innerHTML=`<div style="background:#fff;border-radius:16px;padding:16px;margin-top:10px"><h2>👋 أهلاً ${name}</h2><p>رصيدك: <b>${u.wallet||0} ج</b> <button onclick="requestTopup()" style="background:#f59e0b;border:none;padding:4px 10px;border-radius:8px;font-weight:bold">💳 شحن +</button></p><div id="map" style="height:220px;border-radius:12px;margin:10px 0;background:#e2e8f0"></div><label>من فين؟</label><input id="fromInput" placeholder="جرجا - شارع البحر" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:10px;margin:6px 0"><label>رايح فين؟</label><input id="toInput" placeholder="سوهاج - الجامعة" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:10px;margin:6px 0"><label>نوع الرحلة</label><select id="typeInput" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:10px;margin:6px 0"><option value="توكتوك">🛺 توكتوك - ${p.toktok} ج</option><option value="موتوسيكل">🏍️ موتوسيكل - ${p.moto} ج</option><option value="عربية">🚗 عربية - ${p.car} ج</option></select><button onclick="requestRide()" style="width:100%;background:#059669;color:#fff;border:none;padding:13px;border-radius:10px;font-weight:bold">🚕 اطلب توصيلة الآن</button><h3>📋 رحلاتي</h3><div id="myOrders">جارى التحميل...</div></div>`;
  initMap(); renderClientOrdersLive();
}

// ============ الأدمن ============
function renderAdmin(){
  const c=document.getElementById('mainContent'); if(!c) return;
  c.innerHTML=`
  <div style="background:#fff;border-radius:16px;padding:14px;margin-top:10px">
    <h2 style="margin:0">👑 لوحة الأدمن</h2><p style="font-size:13px;color:#666">أهلاً الأدمن - ${ADMIN_EMAIL} - ${ADMIN_PHONE}</p>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0">
      ${[['dash','📊 الرئيسية'],['users','👥 المستخدمين'],['drivers','🚖 الكباتن'],['orders','🚕 الرحلات'],['prices','💰 الأسعار'],['settings','⚙️ إعدادات'],['inject','💉 حاقن أكواد'],['batch','📦 باتش']].map(([t,l])=>`<button onclick="setAdminTab('${t}')" style="padding:8px 12px;border-radius:20px;border:none;font-weight:bold;cursor:pointer;background:${adminTab===t?'#0f172a':'#e2e8f0'};color:${adminTab===t?'#fff':'#000'}">${l}</button>`).join('')}
    </div>
    <div id="adminContent" style="min-height:200px"><p style="text-align:center;color:#888">جارى تحميل البيانات... لو فضلت كده - اتأكد إن Rules في Firebase معمولة <b>.read true</b></p></div>
  </div>`;
  startListeners();
  renderAdminContent();
}
function setAdminTab(t){ adminTab=t; searchQ=""; renderAdmin(); }

function renderAdminContent(){
  const el=document.getElementById('adminContent'); if(!el || currentRole!=='admin') return;
  const users=Object.entries(allUsers); const orders=Object.entries(allOrders);
  const drivers=users.filter(([id,u])=>u.role==='driver');
  const pending=orders.filter(([id,o])=>o.status==='pending');
  const totalWallet=users.reduce((a,[id,u])=>a+(u.wallet||0),0);
  const q=searchQ.toLowerCase();

  if(adminTab==='dash'){
    el.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div style="background:#ecfdf5;padding:12px;border-radius:12px;text-align:center"><b style="font-size:22px">${users.length}</b><br>المستخدمين</div>
      <div style="background:#dbeafe;padding:12px;border-radius:12px;text-align:center"><b style="font-size:22px">${drivers.length}</b><br>الكباتن</div>
      <div style="background:#fef3c7;padding:12px;border-radius:12px;text-align:center"><b style="font-size:22px">${orders.length}</b><br>الرحلات</div>
      <div style="background:#fee2e2;padding:12px;border-radius:12px;text-align:center"><b style="font-size:22px">${pending.length}</b><br>معلقة</div>
    </div>
    <div style="background:#f1f5f9;padding:12px;border-radius:10px;margin-top:10px;text-align:center"><b>إجمالي المحافظ: ${totalWallet} ج</b> | ${new Date().toLocaleTimeString('ar-EG')}</div>
    <h3>آخر الرحلات</h3>${orders.slice(-5).reverse().map(([id,o])=>`<div style="border:1px solid #eee;padding:8px;border-radius:8px;margin-bottom:6px;font-size:13px"><b>${o.from} → ${o.to}</b> - ${o.type} - ${o.price} ج - ${o.status}</div>`).join('')||'مفيش رحلات'}`;
    return;
  }
  if(adminTab==='users'){
    const filtered=users.filter(([id,u])=>!q||(u.name||'').toLowerCase().includes(q)||(u.email||'').toLowerCase().includes(q)||(u.phone||'').includes(q));
    el.innerHTML=`<input value="${searchQ}" oninput="searchQ=this.value;renderAdminContent()" placeholder="🔍 ابحث بالاسم أو الإيميل أو الموبايل..." style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;margin-bottom:10px"><p style="font-size:12px;color:#666">النتائج: ${filtered.length}</p>
    ${filtered.map(([id,u])=>`<div style="border:1px solid #eee;border-radius:12px;padding:10px;margin-bottom:8px"><b>${u.name||'بدون اسم'}</b> ${u.blocked?'<span style="background:#dc2626;color:#fff;padding:2px 6px;border-radius:8px;font-size:11px">محظور</span>':''} ${u.driverApproved===false?'<span style="background:#fef3c7;padding:2px 6px;border-radius:8px;font-size:11px">بانتظار موافقة</span>':''}<br><span style="font-size:12px;color:#666">${u.email} - ${u.phone||''} - ${u.role} - محفظة: ${u.wallet||0} ج</span><div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:8px"><button onclick="chargeUser('${id}')" style="background:#f59e0b;border:none;padding:6px 10px;border-radius:8px;font-weight:bold">💳 شحن</button><button onclick="toggleBlock('${id}')" style="background:${u.blocked?'#059669':'#dc2626'};color:#fff;border:none;padding:6px 10px;border-radius:8px">${u.blocked?'فك حظر':'حظر'}</button><button onclick="makeDriver('${id}')" style="background:#0ea5e9;color:#fff;border:none;padding:6px 10px;border-radius:8px">خليه كابتن</button><button onclick="makeClient('${id}')" style="background:#e2e8f0;border:none;padding:6px 10px;border-radius:8px">خليه عميل</button><button onclick="deleteUser('${id}')" style="background:#fee2e2;border:none;padding:6px 10px;border-radius:8px">🗑️ حذف</button></div></div>`).join('')||'<p>مفيش نتائج</p>'}`;
    return;
  }
  if(adminTab==='drivers'){
    el.innerHTML=`<h3>الكباتن - ${drivers.length}</h3>${drivers.map(([id,u])=>`<div style="border:1px solid #eee;border-radius:12px;padding:10px;margin-bottom:8px"><b>${u.name}</b> - ${u.phone} - ${u.email}<br><span style="font-size:12px">الحالة: ${u.driverApproved===false?'⏳ بانتظار موافقة':u.blocked?'🚫 محظور':'✅ مقبول'}</span><div style="display:flex;gap:5px;margin-top:8px"><button onclick="approveDriver('${id}',true)" style="background:#059669;color:#fff;border:none;padding:6px 10px;border-radius:8px">✅ قبول</button><button onclick="approveDriver('${id}',false)" style="background:#f59e0b;border:none;padding:6px 10px;border-radius:8px">⏳ انتظار</button><button onclick="toggleBlock('${id}')" style="background:#dc2626;color:#fff;border:none;padding:6px 10px;border-radius:8px">حظر</button></div></div>`).join('')||'مفيش كباتن'}`;
    return;
  }
  if(adminTab==='orders'){
    el.innerHTML=`<h3>كل الرحلات - ${orders.length}</h3>${[...orders].reverse().map(([id,o])=>`<div style="border:1px solid #eee;border-radius:12px;padding:10px;margin-bottom:8px"><b>${o.from} → ${o.to}</b><br><span style="font-size:12px">${o.type} - ${o.price} ج - ${o.clientName||''} ${o.clientPhone||''} - ${o.status}</span><div style="display:flex;gap:5px;margin-top:8px;flex-wrap:wrap"><button onclick="updateOrder('${id}','accepted')" style="background:#059669;color:#fff;border:none;padding:6px 10px;border-radius:8px">قبول</button><button onclick="updateOrder('${id}','completed')" style="background:#0ea5e9;color:#fff;border:none;padding:6px 10px;border-radius:8px">إتمام</button><button onclick="updateOrder('${id}','cancelled')" style="background:#f59e0b;border:none;padding:6px 10px;border-radius:8px">إلغاء</button><button onclick="deleteOrder('${id}')" style="background:#fee2e2;border:none;padding:6px 10px;border-radius:8px">حذف</button></div></div>`).join('')||'مفيش رحلات'}`;
    return;
  }
  if(adminTab==='prices'){
    const p=appSettings.prices||{};
    el.innerHTML=`<h3>💰 أسعار الرحلات</h3><label>توكتوك</label><input id="priceToktok" type="number" value="${p.toktok}" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;margin:6px 0"><label>موتوسيكل</label><input id="priceMoto" type="number" value="${p.moto}" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;margin:6px 0"><label>عربية</label><input id="priceCar" type="number" value="${p.car}" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;margin:6px 0"><button onclick="savePrices()" style="width:100%;background:#059669;color:#fff;border:none;padding:12px;border-radius:10px;font-weight:bold">💾 حفظ الأسعار</button>`;
    return;
  }
  if(adminTab==='settings'){
    el.innerHTML=`<h3>⚙️ إعدادات التطبيق</h3><label>اسم التطبيق</label><input id="setName" value="${appSettings.appName}" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;margin:6px 0"><label>رسالة إعلان</label><input id="setAnn" value="${(appSettings.announcement||'').replace(/"/g,'')}" placeholder="مثال: خصم 20% النهارده" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;margin:6px 0"><label>واتساب الدعم</label><input id="setWa" value="${appSettings.whatsapp}" style="width:100%;padding:11px;border:1px solid #ddd;border-radius:10px;margin:6px 0"><label style="display:flex;gap:8px;align-items:center;margin:10px 0"><input id="setMaint" type="checkbox" ${appSettings.maintenance?'checked':''}> 🛠️ وضع الصيانة</label><button onclick="saveSettings()" style="width:100%;background:#0f172a;color:#fff;border:none;padding:12px;border-radius:10px;font-weight:bold">💾 حفظ الإعدادات</button>`;
    return;
  }
  if(adminTab==='inject'){
    el.innerHTML=`<h3>💉 حاقن الأكواد - Code Injector</h3><p style="font-size:12px;color:#666;background:#fef3c7;padding:10px;border-radius:8px">⚠️ الأكواد دي هتشتغل عند كل المستخدمين - استخدمها بحرص - مثال: بانر خصم - زرار واتساب عائم - تغيير ألوان</p>
    <label style="font-weight:bold">HTML - يظهر في الصفحة</label><textarea id="injectHTML" placeholder="<div style='...'>عرض خاص!</div>" style="width:100%;height:80px;padding:10px;border:1px solid #ddd;border-radius:10px;margin:6px 0;font-family:monospace">${(appSettings.injectHTML||'').replace(/</g,'&lt;')}</textarea>
    <label style="font-weight:bold">CSS - تنسيقات</label><textarea id="injectCSS" placeholder="body{background:#fff} .my-btn{...}" style="width:100%;height:80px;padding:10px;border:1px solid #ddd;border-radius:10px;margin:6px 0;font-family:monospace">${appSettings.injectCSS||''}</textarea>
    <label style="font-weight:bold">JavaScript</label><textarea id="injectJS" placeholder="alert('اهلا'); console.log('test');" style="width:100%;height:80px;padding:10px;border:1px solid #ddd;border-radius:10px;margin:6px 0;font-family:monospace">${appSettings.injectJS||''}</textarea>
    <div style="display:flex;gap:6px"><button onclick="saveInjector()" style="flex:1;background:#059669;color:#fff;border:none;padding:12px;border-radius:10px;font-weight:bold">💾 حفظ وتفعيل</button><button onclick="testInjector()" style="flex:1;background:#0ea5e9;color:#fff;border:none;padding:12px;border-radius:10px;font-weight:bold">👁️ معاينة</button><button onclick="clearInjector()" style="background:#fee2e2;border:none;padding:12px;border-radius:10px">🗑️ مسح الكل</button></div>
    <div style="background:#f1f5f9;padding:10px;border-radius:10px;margin-top:10px;font-size:12px"><b>أمثلة جاهزة - دوس للصق:</b><br><button onclick="pasteExample('banner')" style="margin:4px;padding:6px 10px;border-radius:8px;border:1px solid #ddd">🎉 بانر خصم</button><button onclick="pasteExample('whatsapp')" style="margin:4px;padding:6px 10px;border-radius:8px;border:1px solid #ddd">💬 زرار واتساب عائم</button><button onclick="pasteExample('dark')" style="margin:4px;padding:6px 10px;border-radius:8px;border:1px solid #ddd">🌙 تغيير ألوان</button></div>`;
    return;
  }
  if(adminTab==='batch'){
    el.innerHTML=`<h3>📦 أدوات الباتش</h3><div style="background:#fff7ed;border:1px solid #fdba74;padding:12px;border-radius:10px;font-size:13px">⚠️ العمليات دي مفيهاش تراجع - اتأكد قبل ما تدوس</div>
    <button onclick="batchDeletePending()" style="width:100%;background:#f59e0b;border:none;padding:12px;border-radius:10px;margin-top:10px;font-weight:bold">🗑️ حذف كل المعلقة (${pending.length})</button>
    <button onclick="batchDeleteAllOrders()" style="width:100%;background:#dc2626;color:#fff;border:none;padding:12px;border-radius:10px;margin-top:8px;font-weight:bold">🗑️ حذف كل الرحلات (${orders.length})</button>
    <button onclick="batchApproveDrivers()" style="width:100%;background:#059669;color:#fff;border:none;padding:12px;border-radius:10px;margin-top:8px;font-weight:bold">✅ قبول كل الكباتن المعلقة</button>
    <button onclick="batchBlockAll()" style="width:100%;background:#0f172a;color:#fff;border:none;padding:12px;border-radius:10px;margin-top:8px;font-weight:bold">🚫 حظر كل المستخدمين / فك حظر الكل</button>
    <button onclick="batchChargeAll()" style="width:100%;background:#0ea5e9;color:#fff;border:none;padding:12px;border-radius:10px;margin-top:8px;font-weight:bold">💳 شحن جماعي لكل العملاء</button>
    <button onclick="exportCSV()" style="width:100%;background:#fff;border:1px solid #ddd;padding:12px;border-radius:10px;margin-top:8px;font-weight:bold">📥 تصدير المستخدمين CSV</button>
    <div style="background:#f1f5f9;padding:12px;border-radius:10px;margin-top:12px"><b>شحن عميل واحد:</b><input id="chargeEmail" placeholder="إيميل العميل" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;margin:8px 0"><input id="chargeAmount" type="number" placeholder="المبلغ" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;margin-bottom:8px"><button onclick="chargeWalletByEmail()" style="width:100%;background:#f59e0b;border:none;padding:10px;border-radius:8px;font-weight:bold">شحن +</button></div>`;
    return;
  }
}

// --- وظائف الأدمن ---
async function chargeUser(id){ const a=prompt('اشحن بكام؟'); if(!a) return; await db.ref('users/'+id+'/wallet').set((allUsers[id].wallet||0)+parseInt(a)); alert('تم الشحن ✅'); }
async function toggleBlock(id){ await db.ref('users/'+id+'/blocked').set(!allUsers[id].blocked); }
async function makeDriver(id){ await db.ref('users/'+id).update({role:'driver',driverApproved:true}); alert('بقى كابتن ✅'); }
async function makeClient(id){ await db.ref('users/'+id).update({role:'client'}); }
async function deleteUser(id){ if(!confirm('متأكد تحذف المستخدم؟')) return; await db.ref('users/'+id).remove(); }
async function approveDriver(id,ok){ await db.ref('users/'+id+'/driverApproved').set(ok); alert(ok?'تم القبول ✅':'بقى في الانتظار'); }
async function updateOrder(id,st){ await db.ref('orders/'+id+'/status').set(st); }
async function deleteOrder(id){ if(!confirm('تحذف الرحلة؟')) return; await db.ref('orders/'+id).remove(); }
async function savePrices(){ const p={toktok:parseInt(document.getElementById('priceToktok').value),moto:parseInt(document.getElementById('priceMoto').value),car:parseInt(document.getElementById('priceCar').value)}; await db.ref('settings/prices').set(p); appSettings.prices=p; alert('تم حفظ الأسعار ✅'); }
async function saveSettings(){ await db.ref('settings').update({appName:document.getElementById('setName').value,announcement:document.getElementById('setAnn').value,whatsapp:document.getElementById('setWa').value,maintenance:document.getElementById('setMaint').checked}); alert('تم حفظ الإعدادات ✅'); }

// --- حاقن الأكواد ---
async function saveInjector(){
  const html=document.getElementById('injectHTML').value; const css=document.getElementById('injectCSS').value; const js=document.getElementById('injectJS').value;
  await db.ref('settings').update({injectHTML:html,injectCSS:css,injectJS:js});
  appSettings.injectHTML=html; appSettings.injectCSS=css; appSettings.injectJS=js;
  alert('تم حفظ وحقن الأكواد ✅ - هتشتغل عند كل المستخدمين'); reApplyInjector();
}
function testInjector(){ const html=document.getElementById('injectHTML').value; const css=document.getElementById('injectCSS').value; if(css){ let s=document.createElement('style'); s.textContent=css; document.head.appendChild(s); } if(html){ let d=document.createElement('div'); d.innerHTML=html; document.body.appendChild(d); setTimeout(()=>d.remove(),5000); } alert('تمت المعاينة - لو فيه HTML هيظهر 5 ثواني'); }
async function clearInjector(){ if(!confirm('تمسح كل الأكواد المحقونة؟')) return; await db.ref('settings').update({injectHTML:'',injectCSS:'',injectJS:''}); appSettings.injectHTML='';appSettings.injectCSS='';appSettings.injectJS=''; alert('تم المسح'); }
function pasteExample(type){
  if(type==='banner'){ document.getElementById('injectHTML').value=`<div style="background:#facc15;color:#000;text-align:center;padding:10px;font-weight:bold;position:fixed;bottom:0;left:0;right:0;z-index:999">🎉 خصم 20% النهارده - استخدم كود SOHAG20</div>`; }
  if(type==='whatsapp'){ document.getElementById('injectHTML').value=`<a href="https://wa.me/201068131386" style="position:fixed;bottom:80px;left:12px;background:#25D366;color:#fff;width:50px;height:50px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;text-decoration:none;z-index:999">💬</a>`; }
  if(type==='dark'){ document.getElementById('injectCSS').value=`body{background:#0f172a !important} #tawsila-app>div>div{background:#1e293b !important;color:#fff !important}`; }
  alert('تم لصق المثال - دوس حفظ وتفعيل');
}

// --- باتش ---
async function chargeWalletByEmail(){ const email=document.getElementById('chargeEmail').value.trim().toLowerCase(); const amount=parseInt(document.getElementById('chargeAmount').value); if(!email||!amount) return alert('اكتب الإيميل والمبلغ'); const snap=await db.ref('users').orderByChild('email').equalTo(email).once('value'); const v=snap.val(); if(!v) return alert('مش موجود'); const uid=Object.keys(v)[0]; await db.ref('users/'+uid+'/wallet').set((v[uid].wallet||0)+amount); alert('تم الشحن ✅'); }
async function batchDeletePending(){ if(!confirm('تحذف كل المعلقة؟')) return; const v=Object.entries(allOrders).filter(([id,o])=>o.status==='pending'); for(let [id] of v) await db.ref('orders/'+id).remove(); alert('تم حذف '+v.length); }
async function batchDeleteAllOrders(){ if(!confirm('تحذف كل الرحلات؟ مفيهاش تراجع')) return; await db.ref('orders').remove(); alert('تم حذف الكل'); }
async function batchApproveDrivers(){ let c=0; for(let [id,u] of Object.entries(allUsers)){ if(u.role==='driver'&&u.driverApproved===false){ await db.ref('users/'+id+'/driverApproved').set(true); c++; } } alert('تم قبول '+c+' كابتن ✅'); }
async function batchBlockAll(){ const doBlock=confirm('دوس OK لحظر الكل - Cancel لفك حظر الكل'); for(let id of Object.keys(allUsers)) await db.ref('users/'+id+'/blocked').set(doBlock); alert(doBlock?'تم حظر الكل':'تم فك حظر الكل'); }
async function batchChargeAll(){ const a=prompt('اشحن لكل عميل بكام؟'); if(!a) return; for(let id of Object.keys(allUsers)) await db.ref('users/'+id+'/wallet').set((allUsers[id].wallet||0)+parseInt(a)); alert('تم الشحن الجماعي ✅'); }
function exportCSV(){ let csv='Name,Email,Phone,Role,Wallet,Blocked\n'; for(let [id,u] of Object.entries(allUsers)) csv+=`"${u.name||''}","${u.email||''}","${u.phone||''}","${u.role}","${u.wallet||0}","${u.blocked?'yes':'no'}"\n`; const b=new Blob([csv],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='tawsila-users.csv'; a.click(); }

// --- عميل وكابتن ---
function initMap(){ try{ if(typeof L==='undefined') return; const m=L.map('map').setView([28.33,30.6],11); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(m); L.marker([28.33,30.6]).addTo(m).bindPopup('سوهاج - جرجا').openPopup(); }catch(e){} }
async function requestRide(){ const from=document.getElementById('fromInput').value.trim(); const to=document.getElementById('toInput').value.trim(); const type=document.getElementById('typeInput').value; if(!from||!to) return alert('اكتب من فين ورايح فين'); const p=appSettings.prices||{}; const price=type==='توكتوك'?p.toktok:type==='موتوسيكل'?p.moto:p.car; await db.ref('orders').push({clientId:currentUser.uid,clientName:window._userData.name,clientPhone:window._userData.phone,from,to,type,price,status:'pending',createdAt:Date.now()}); alert('تم إرسال طلبك ✅'); }
function requestTopup(){ const a=prompt('عايز تشحن بكام؟'); if(a) alert('تم إرسال طلب شحن '+a+' ج'); }
let isOnline=false; function toggleOnline(){ isOnline=!isOnline; const b=document.getElementById('onlineBtn'); if(b) b.textContent=isOnline?'🔴 أنا مش متاح':'🟢 أنا متاح الآن'; }
async function acceptOrder(id){ await db.ref('orders/'+id).update({status:'accepted',driverId:currentUser.uid,driverName:window._userData.name}); alert('تم القبول ✅'); }
let deferredPrompt=null; window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;}); function installPWA(){ if(deferredPrompt) deferredPrompt.prompt(); else alert('في Chrome دوس الـ 3 نقط > إضافة إلى الشاشة الرئيسية'); }
if(sessionStorage.getItem('tawsila_admin')==='1'){ isLocalAdmin=true; currentRole='admin'; window._userData={name:'الأدمن',email:ADMIN_EMAIL,phone:ADMIN_PHONE,role:'admin',wallet:0}; startListeners(); }
