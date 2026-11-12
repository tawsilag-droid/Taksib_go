// ============================================
// توصيلة سوهاج - النسخة النهائية
// دخول الأدمن مخفي - من غير ما يظهر لحد
// ============================================

const ADMIN_EMAIL = "sasahalawa123@gmail.com";
const ADMIN_PASS = "0000";
const ADMIN_PHONE = "01068131386";

// --- Firebase - بتاعك ---
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

let currentUser = null;
let currentRole = "client";
let currentTab = "login";
let isLocalAdmin = false;

// --- رسم التطبيق - من غير Firebase متصل - من غير صندوق أدمن ---
function renderApp(){
  const app = document.getElementById('tawsila-app');
  if(!app) return;
  app.innerHTML = `
  <div style="max-width:480px;margin:0 auto;padding:10px;padding-bottom:80px">
    <div style="background:#059669;color:#fff;border-radius:16px;padding:14px;text-align:center;position:sticky;top:10px;z-index:10">
      <h1 style="margin:0;font-size:22px">🚕 توصيلة سوهاج</h1>
      <p style="margin:4px 0 0;font-size:12px;opacity:.9">جرجا - طهطا - البلينا - سوهاج</p>
      <div style="display:flex;gap:6px;justify-content:center;margin-top:10px;flex-wrap:wrap">
        <a href="#" onclick="installPWA();return false" style="background:#facc15;color:#000;padding:6px 10px;border-radius:20px;font-size:12px;text-decoration:none;font-weight:bold">📥 تحميل التطبيق</a>
        <button onclick="showHelp()" style="background:#fff;color:#059669;border:none;padding:6px 10px;border-radius:20px;font-size:12px;font-weight:bold">💬 مساعد</button>
        ${currentUser || isLocalAdmin ? `<button onclick="logout()" style="background:#ef4444;color:#fff;border:none;padding:6px 10px;border-radius:20px;font-size:12px;font-weight:bold">خروج</button>` : ''}
      </div>
    </div>
    <div id="mainContent"></div>
  </div>
  `;
  if(currentUser || isLocalAdmin){ renderDashboard(); } else { renderAuth(); }
}

function renderAuth(){
  const c = document.getElementById('mainContent');
  c.innerHTML = `
  <div style="background:#fff;border-radius:16px;padding:16px;margin-top:10px;box-shadow:0 2px 10px #0001">
    <div style="display:flex;gap:8px;margin-bottom:14px">
      <button onclick="switchTab('login')" style="flex:1;padding:10px;border-radius:10px;border:none;font-weight:bold;cursor:pointer;background:${currentTab==='login'?'#0f172a':'#e2e8f0'};color:${currentTab==='login'?'#fff':'#000'}">دخول</button>
      <button onclick="switchTab('signup')" style="flex:1;padding:10px;border-radius:10px;border:none;font-weight:bold;cursor:pointer;background:${currentTab==='signup'?'#0f172a':'#e2e8f0'};color:${currentTab==='signup'?'#fff':'#000'}">حساب جديد</button>
    </div>
    <label style="font-weight:bold;font-size:13px">البريد الإلكتروني</label>
    <input id="emailInput" type="email" placeholder="name@gmail.com" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:10px;margin:6px 0 12px;box-sizing:border-box">
    <label style="font-weight:bold;font-size:13px">رقم الهاتف</label>
    <input id="phoneInput" type="tel" placeholder="01xxxxxxxxx" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:10px;margin:6px 0 12px;box-sizing:border-box">
    <div style="display:${currentTab==='signup'?'block':'none'}">
      <label style="font-weight:bold;font-size:13px">الاسم بالكامل</label>
      <input id="nameInput" type="text" placeholder="مثال: سيد أحمد" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:10px;margin:6px 0 12px;box-sizing:border-box">
      <label style="font-weight:bold;font-size:13px">نوع الحساب</label>
      <select id="roleInput" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:10px;margin:6px 0 12px">
        <option value="client">عميل - عايز توصيلة</option>
        <option value="driver">كابتن - معايا عربية / موتوسيكل</option>
      </select>
    </div>
    <label style="font-weight:bold;font-size:13px">كلمة المرور</label>
    <input id="passInput" type="password" placeholder="••••••••" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:10px;margin:6px 0 14px;box-sizing:border-box">
    <button onclick="${currentTab==='login'?'login()':'signup()'}" style="width:100%;background:#059669;color:#fff;border:none;padding:13px;border-radius:10px;font-weight:bold;font-size:15px;cursor:pointer">${currentTab==='login'?'🔒 دخول آمن':'✅ إنشاء حساب'}</button>
    <button onclick="loginGoogle()" style="width:100%;background:#fff;border:1px solid #ddd;padding:12px;border-radius:10px;margin-top:8px;font-weight:bold;cursor:pointer">🔵 دخول بجوجل</button>
    <p id="authMsg" style="text-align:center;color:#dc2626;font-size:13px;margin-top:10px"></p>
  </div>
  `;
}
function switchTab(t){ currentTab = t; renderAuth(); }
function showHelp(){ alert('توصيلة سوهاج\n\nعميل: سجل حساب واطلب رحلة\nكابتن: سجل ككابتن واستقبل الطلبات'); }

// --- الدخول - الأدمن ليه دخول خاص مخفي ---
async function login(){
  const email = document.getElementById('emailInput').value.trim().toLowerCase();
  const pass = document.getElementById('passInput').value;
  const phone = document.getElementById('phoneInput').value.trim();
  const msg = document.getElementById('authMsg');

  // 1. دخول الأدمن - مخفي - مش بيظهر لحد
  if(email === ADMIN_EMAIL && pass === ADMIN_PASS){
    isLocalAdmin = true;
    currentRole = 'admin';
    window._userData = { name: 'الأدمن', email: ADMIN_EMAIL, phone: ADMIN_PHONE, role: 'admin', wallet: 0 };
    sessionStorage.setItem('tawsila_admin','1');
    renderApp();
    return;
  }

  // 2. دخول باقي الناس بفايربيس
  if(!email || !pass){ msg.textContent = 'اكتب الإيميل وكلمة المرور'; return; }
  msg.textContent = 'جارى الدخول...';
  try{ await auth.signInWithEmailAndPassword(email, pass); }catch(e){ msg.textContent = 'خطأ: ' + translateError(e.code); }
}

async function signup(){
  const email = document.getElementById('emailInput').value.trim();
  const pass = document.getElementById('passInput').value;
  const phone = document.getElementById('phoneInput').value.trim();
  const name = document.getElementById('nameInput').value.trim();
  const role = document.getElementById('roleInput').value;
  const msg = document.getElementById('authMsg');
  if(!email || !pass || !phone || !name){ msg.textContent = 'اكمل كل البيانات'; return; }
  if(pass.length < 6){ msg.textContent = 'كلمة المرور لازم 6 حروف على الأقل'; return; }
  if(email.toLowerCase() === ADMIN_EMAIL){ msg.textContent = 'الإيميل ده محجوز للأدمن'; return; }
  msg.textContent = 'جارى إنشاء الحساب...';
  try{
    const res = await auth.createUserWithEmailAndPassword(email, pass);
    await db.ref('users/' + res.user.uid).set({ name, email, phone, role, wallet: 0, createdAt: Date.now() });
  }catch(e){ msg.textContent = 'خطأ: ' + translateError(e.code); }
}

async function loginGoogle(){
  try{
    const provider = new firebase.auth.GoogleAuthProvider();
    const res = await auth.signInWithPopup(provider);
    const snap = await db.ref('users/' + res.user.uid).once('value');
    if(!snap.exists()){
      await db.ref('users/' + res.user.uid).set({ name: res.user.displayName || 'مستخدم جوجل', email: res.user.email, phone: '', role: 'client', wallet: 0, createdAt: Date.now() });
    }
  }catch(e){ alert('خطأ جوجل: ' + e.message); }
}
function logout(){ isLocalAdmin = false; sessionStorage.removeItem('tawsila_admin'); auth.signOut(); }
function translateError(code){
  if(code==='auth/user-not-found') return 'الإيميل مش مسجل - اعمل حساب جديد';
  if(code==='auth/wrong-password') return 'كلمة المرور غلط';
  if(code==='auth/email-already-in-use') return 'الإيميل ده مسجل قبل كده - دوس دخول';
  if(code==='auth/invalid-email') return 'الإيميل مش صحيح';
  if(code==='auth/invalid-credential') return 'الإيميل أو كلمة المرور غلط';
  return code;
}

auth.onAuthStateChanged(async (user)=>{
  // لو أدمن محلي - متغيرش حالته
  if(isLocalAdmin || sessionStorage.getItem('tawsila_admin')==='1'){
    isLocalAdmin = true; currentRole = 'admin';
    window._userData = { name: 'الأدمن', email: ADMIN_EMAIL, phone: ADMIN_PHONE, role: 'admin', wallet: 0 };
    renderApp(); return;
  }
  if(user){
    currentUser = user;
    const snap = await db.ref('users/' + user.uid).once('value');
    let data = snap.val();
    if(!data){
      data = { name: user.displayName || 'مستخدم', email: user.email, phone: '', role: 'client', wallet: 0 };
      await db.ref('users/' + user.uid).set(data);
    }
    currentRole = data.role || 'client';
    window._userData = data;
  } else {
    currentUser = null; currentRole = 'client'; window._userData = null;
  }
  renderApp();
});

function renderDashboard(){
  const c = document.getElementById('mainContent');
  const u = window._userData || {};
  const name = u.name || 'مستخدم';

  if(currentRole === 'admin'){
    c.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:16px;margin-top:10px">
      <h2 style="margin:0">👑 لوحة الأدمن</h2>
      <p style="color:#666;font-size:13px">أهلاً ${name} - ${ADMIN_EMAIL} - ${ADMIN_PHONE}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0">
        <div style="background:#ecfdf5;padding:12px;border-radius:12px;text-align:center"><b id="statUsers">-</b><br><span style="font-size:12px">المستخدمين</span></div>
        <div style="background:#fef3c7;padding:12px;border-radius:12px;text-align:center"><b id="statOrders">-</b><br><span style="font-size:12px">الرحلات</span></div>
        <div style="background:#dbeafe;padding:12px;border-radius:12px;text-align:center"><b id="statDrivers">-</b><br><span style="font-size:12px">الكباتن</span></div>
        <div style="background:#fee2e2;padding:12px;border-radius:12px;text-align:center"><b id="statPending">-</b><br><span style="font-size:12px">طلبات معلقة</span></div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button onclick="showAllUsers()" style="flex:1;background:#0f172a;color:#fff;border:none;padding:10px;border-radius:10px">👥 كل المستخدمين</button>
        <button onclick="showAllOrders()" style="flex:1;background:#059669;color:#fff;border:none;padding:10px;border-radius:10px">🚕 كل الرحلات</button>
      </div>
      <div id="adminList" style="margin-top:14px"></div>
      <div style="background:#f1f5f9;padding:12px;border-radius:10px;margin-top:14px;font-size:12px">
        <b>💳 شحن محفظة عميل:</b><br>
        <input id="chargeEmail" placeholder="إيميل العميل" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;margin:8px 0">
        <input id="chargeAmount" type="number" placeholder="المبلغ - مثال 100" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;margin-bottom:8px">
        <button onclick="chargeWallet()" style="width:100%;background:#f59e0b;border:none;padding:10px;border-radius:8px;font-weight:bold">شحن +</button>
      </div>
    </div>
    `;
    loadAdminStats(); return;
  }

  if(currentRole === 'driver'){
    c.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:16px;margin-top:10px">
      <h2 style="margin:0">🚖 لوحة الكابتن</h2>
      <p style="font-size:13px;color:#666">أهلاً ${name} - رصيدك: <b>${u.wallet||0} جنيه</b></p>
      <button onclick="toggleOnline()" id="onlineBtn" style="width:100%;background:#059669;color:#fff;border:none;padding:12px;border-radius:10px;font-weight:bold;margin:10px 0">🟢 أنا متاح الآن</button>
      <h3 style="font-size:14px">📍 الطلبات القريبة منك</h3>
      <div id="driverOrders">جارى تحميل الطلبات...</div>
    </div>
    `;
    loadDriverOrders(); return;
  }

  c.innerHTML = `
  <div style="background:#fff;border-radius:16px;padding:16px;margin-top:10px">
    <h2 style="margin:0">👋 أهلاً ${name}</h2>
    <p style="font-size:13px;color:#666">رصيد محفظتك: <b>${u.wallet||0} جنيه</b> | <button onclick="requestTopup()" style="background:#f59e0b;border:none;padding:4px 10px;border-radius:8px;font-weight:bold">💳 شحن +</button></p>
    <div id="map" style="height:220px;border-radius:12px;margin:10px 0;background:#e2e8f0"></div>
    <label style="font-weight:bold;font-size:13px">من فين؟</label>
    <input id="fromInput" placeholder="مثال: جرجا - شارع البحر" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:10px;margin:6px 0">
    <label style="font-weight:bold;font-size:13px">رايح فين؟</label>
    <input id="toInput" placeholder="مثال: سوهاج - الجامعة" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:10px;margin:6px 0">
    <label style="font-weight:bold;font-size:13px">نوع الرحلة</label>
    <select id="typeInput" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:10px;margin:6px 0">
      <option value="توكتوك">🛺 توكتوك - 15 ج</option>
      <option value="موتوسيكل">🏍️ موتوسيكل - 25 ج</option>
      <option value="عربية">🚗 عربية - 50 ج</option>
    </select>
    <button onclick="requestRide()" style="width:100%;background:#059669;color:#fff;border:none;padding:13px;border-radius:10px;font-weight:bold;font-size:15px">🚕 اطلب توصيلة الآن</button>
    <h3 style="font-size:14px;margin-top:16px">📋 رحلاتي</h3>
    <div id="myOrders">جارى التحميل...</div>
  </div>
  `;
  initMap(); loadMyOrders();
}

function initMap(){
  try{
    if(typeof L === 'undefined') return;
    const el = document.getElementById('map'); if(!el) return;
    L.map('map').setView([28.33, 30.6], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(arguments[0]);
  }catch(e){}
  try{
    if(typeof L !== 'undefined'){
      const m = L.map('map').setView([28.33, 30.6], 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(m);
      L.marker([28.33, 30.6]).addTo(m).bindPopup('سوهاج - جرجا').openPopup();
    }
  }catch(e){}
}

async function requestRide(){
  const from = document.getElementById('fromInput').value.trim();
  const to = document.getElementById('toInput').value.trim();
  const type = document.getElementById('typeInput').value;
  if(!from || !to){ alert('اكتب من فين ورايح فين'); return; }
  const price = type==='توكتوك' ? 15 : type==='موتوسيكل' ? 25 : 50;
  await db.ref('orders').push({ clientId: currentUser ? currentUser.uid : 'guest', clientName: window._userData.name, clientPhone: window._userData.phone, from, to, type, price, status: 'pending', createdAt: Date.now() });
  alert('تم إرسال طلبك ✅'); loadMyOrders();
}
function loadMyOrders(){
  if(!currentUser) return;
  db.ref('orders').orderByChild('clientId').equalTo(currentUser.uid).on('value', snap=>{
    const el = document.getElementById('myOrders'); if(!el) return;
    const val = snap.val(); if(!val){ el.innerHTML = '<p style="font-size:13px;color:#888">لسه مفيش رحلات</p>'; return; }
    el.innerHTML = Object.entries(val).reverse().map(([id,o])=>`<div style="border:1px solid #eee;border-radius:10px;padding:10px;margin-bottom:8px"><b>${o.from} → ${o.to}</b><br><span style="font-size:12px;color:#666">${o.type} - ${o.price} ج - ${o.status==='pending'?'⏳ بانتظار كابتن':'✅ تم القبول'}</span></div>`).join('');
  });
}
function requestTopup(){ const a = prompt('عايز تشحن بكام؟'); if(a) alert('تم إرسال طلب شحن '+a+' جنيه'); }

let isOnline = false;
function toggleOnline(){ isOnline = !isOnline; document.getElementById('onlineBtn').textContent = isOnline ? '🔴 أنا مش متاح' : '🟢 أنا متاح الآن'; }
function loadDriverOrders(){
  db.ref('orders').orderByChild('status').equalTo('pending').on('value', snap=>{
    const el = document.getElementById('driverOrders'); if(!el) return;
    const val = snap.val(); if(!val){ el.innerHTML = '<p style="font-size:13px;color:#888">مفيش طلبات دلوقتي</p>'; return; }
    el.innerHTML = Object.entries(val).map(([id,o])=>`<div style="border:1px solid #eee;border-radius:10px;padding:10px;margin-bottom:8px"><b>${o.from} → ${o.to}</b><br><span style="font-size:12px">${o.type} - ${o.price} ج - ${o.clientName} - ${o.clientPhone}</span><br><button onclick="acceptOrder('${id}')" style="background:#059669;color:#fff;border:none;padding:8px 14px;border-radius:8px;margin-top:6px;font-weight:bold">قبول الرحلة ✅</button></div>`).join('');
  });
}
async function acceptOrder(id){ await db.ref('orders/'+id).update({ status:'accepted', driverId: currentUser.uid, driverName: window._userData.name }); alert('تم قبول الرحلة ✅'); }

function loadAdminStats(){
  db.ref('users').on('value', s=>{ const v=s.val()||{}; const arr=Object.values(v); const e=document.getElementById('statUsers'); if(e) e.textContent = arr.length; const d=document.getElementById('statDrivers'); if(d) d.textContent = arr.filter(x=>x.role==='driver').length; });
  db.ref('orders').on('value', s=>{ const v=s.val()||{}; const arr=Object.values(v); const e=document.getElementById('statOrders'); if(e) e.textContent = arr.length; const p=document.getElementById('statPending'); if(p) p.textContent = arr.filter(x=>x.status==='pending').length; });
}
function showAllUsers(){
  db.ref('users').once('value', s=>{ const v=s.val()||{}; document.getElementById('adminList').innerHTML = '<h3>👥 المستخدمين</h3>' + Object.entries(v).map(([id,u])=>`<div style="border:1px solid #eee;padding:8px;border-radius:8px;margin-bottom:6px;font-size:13px"><b>${u.name}</b> - ${u.email} - ${u.role} - ${u.wallet||0} ج - ${u.phone||''}</div>`).join(''); });
}
function showAllOrders(){
  db.ref('orders').once('value', s=>{ const v=s.val()||{}; document.getElementById('adminList').innerHTML = '<h3>🚕 الرحلات</h3>' + Object.entries(v).map(([id,o])=>`<div style="border:1px solid #eee;padding:8px;border-radius:8px;margin-bottom:6px;font-size:13px"><b>${o.from} → ${o.to}</b> - ${o.type} - ${o.price} ج - ${o.status}</div>`).join(''); });
}
async function chargeWallet(){
  const email = document.getElementById('chargeEmail').value.trim().toLowerCase();
  const amount = parseInt(document.getElementById('chargeAmount').value);
  if(!email || !amount){ alert('اكتب إيميل العميل والمبلغ'); return; }
  const snap = await db.ref('users').orderByChild('email').equalTo(email).once('value');
  const val = snap.val(); if(!val){ alert('الإيميل مش موجود'); return; }
  const uid = Object.keys(val)[0]; const cur = val[uid].wallet || 0;
  await db.ref('users/'+uid+'/wallet').set(cur + amount);
  alert('تم شحن '+amount+' جنيه ✅');
}

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); deferredPrompt = e; });
function installPWA(){ if(deferredPrompt){ deferredPrompt.prompt(); } else { alert('في Chrome دوس الـ 3 نقط فوق > إضافة إلى الشاشة الرئيسية > تثبيت'); } }

// لو الأدمن كان داخل قبل كده - ادخله على طول
if(sessionStorage.getItem('tawsila_admin')==='1'){ isLocalAdmin = true; currentRole='admin'; window._userData={ name:'الأدمن', email:ADMIN_EMAIL, phone:ADMIN_PHONE, role:'admin', wallet:0 }; }

renderApp();
