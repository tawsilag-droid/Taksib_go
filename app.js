/**
 * تطبيق توصيلة - المحرك البرمجي الموحد
 * يدعم: تسجيل الدخول السري للأدمن، نظام الكباتن والاعتماد، نظام الركاب، الصوتيات، والباتشات
 */

// ==========================================
// 1. بيانات الأدمن الحصرية وقاعدة البيانات
// ==========================================
const ADMIN_CREDENTIALS = {
  phone: "01068131386",
  email: "tawsilag@gmail.com",
  password: "0000"
};

const DEFAULT_STORE = {
  currentUser: null, // { role: 'customer' | 'captain' | 'admin', name, phone, captainStatus }
  users: [
    { phone: "01011111111", password: "123", name: "عميل تجريبي", role: "customer", wallet: 150.0 },
    { phone: "01022222222", password: "123", name: "كابتن أحمد", role: "captain", vehicle: "سيارة ملاكي", plate: "هـ ص ج 4589", status: "approved", wallet: 300.0 }
  ],
  captainsPending: [], // الكباتن بانتظار موافقة الأدمن
  vehicles: [
    { id: 'tuktuk', name: 'توكتوك سوهاج', baseFare: 7.0, perKm: 2.5, icon: 'fa-solid fa-motorcycle', enabled: true },
    { id: 'moto', name: 'موتوسيكل سريع', baseFare: 9.0, perKm: 3.0, icon: 'fa-solid fa-bicycle', enabled: true },
    { id: 'car', name: 'سيارة ملاكي', baseFare: 12.0, perKm: 3.5, icon: 'fa-solid fa-car', enabled: true }
  ],
  selectedVehicleId: 'car',
  extraFare: 0
};

// حفظ واسترجاع آمن من localStorage
function getDB() {
  try {
    const raw = localStorage.getItem('TAWSILA_DATA_V3');
    return raw ? JSON.parse(raw) : DEFAULT_STORE;
  } catch(e) {
    return DEFAULT_STORE;
  }
}

function saveDB(d) {
  try {
    localStorage.setItem('TAWSILA_DATA_V3', JSON.stringify(d));
  } catch(e) {
    console.warn("Storage full! Cleaning up temp data...");
  }
}

let DB = getDB();
let activeTripData = null;
let countdownInterval = null;
let tempCaptainDocs = {};

// ==========================================
// 2. نظام تسجيل الدخول وتحديد الصلاحيات
// ==========================================
function handleUserLogin(e) {
  e.preventDefault();
  const idVal = document.getElementById('loginIdentifier').value.trim();
  const passVal = document.getElementById('loginPassword').value.trim();

  // فحص إذا كان الداخل هو الأدمن
  if ((idVal === ADMIN_CREDENTIALS.phone || idVal.toLowerCase() === ADMIN_CREDENTIALS.email) && passVal === ADMIN_CREDENTIALS.password) {
    DB.currentUser = {
      role: 'admin',
      name: 'مدير النظام',
      phone: ADMIN_CREDENTIALS.phone
    };
    saveDB(DB);
    updateNavUI();
    navigate('admin');
    alert("🎉 مرحباً بك يا أدمن! تم فتح لوحة التحكم الرئيسية.");
    return;
  }

  // فحص الكباتن تحت المراجعة
  const pendingCap = DB.captainsPending.find(c => c.phone === idVal && c.password === passVal);
  if (pendingCap) {
    DB.currentUser = {
      role: 'captain',
      name: pendingCap.name,
      phone: pendingCap.phone,
      captainStatus: pendingCap.status // 'pending' or 'approved'
    };
    saveDB(DB);
    updateNavUI();
    navigate('driver');
    return;
  }

  // فحص المستخدمين المسجلين (عملاء وكباتن معتمدين)
  const existingUser = DB.users.find(u => u.phone === idVal && u.password === passVal);
  if (existingUser) {
    DB.currentUser = existingUser;
    saveDB(DB);
    updateNavUI();
    if (existingUser.role === 'captain') navigate('driver');
    else navigate('customer');
    return;
  }

  alert("❌ خطأ: رقم الهاتف أو كلمة المرور غير صحيحة!");
}

function handleRegisterCustomer(e) {
  e.preventDefault();
  const name = document.getElementById('regCustName').value.trim();
  const phone = document.getElementById('regCustPhone').value.trim();
  const password = document.getElementById('regCustPass').value.trim();

  if (DB.users.some(u => u.phone === phone)) {
    alert("⚠️ هذا الرقم مسجل مسبقاً، يرجى تسجيل الدخول.");
    return;
  }

  const newUser = { role: 'customer', name, phone, password, wallet: 150.0 };
  DB.users.push(newUser);
  DB.currentUser = newUser;
  saveDB(DB);
  updateNavUI();
  navigate('customer');
  alert(`🎉 أهلاً بك يا ${name}! تم فتح حسابك بنجاح.`);
}

function handleRegisterCaptain(e) {
  e.preventDefault();
  const name = document.getElementById('regCapName').value.trim();
  const phone = document.getElementById('regCapPhone').value.trim();
  const password = document.getElementById('regCapPass').value.trim();
  const vehicle = document.getElementById('regCapVehicle').value;
  const plate = document.getElementById('regCapPlate').value.trim();

  if (!tempCaptainDocs.idFront || !tempCaptainDocs.idBack || !tempCaptainDocs.licenseDrive || !tempCaptainDocs.licenseCar) {
    alert("⚠️ يرجى رفع جميع صور المستندات الأربعة المطلوبة لإتمام التسجيل.");
    return;
  }

  const newCaptain = {
    id: 'cap_' + Date.now(),
    role: 'captain',
    name,
    phone,
    password,
    vehicle,
    plate,
    status: 'pending',
    wallet: 0.0,
    docs: { ...tempCaptainDocs }
  };

  DB.captainsPending.push(newCaptain);
  DB.currentUser = { role: 'captain', name, phone, captainStatus: 'pending' };
  saveDB(DB);
  updateNavUI();
  navigate('driver');
  alert("✅ تم إرسال بياناتك ومستنداتك بنجاح! طلبك الآن بانتظار مراجعة وتفعيل الأدمن.");
}

function logoutUser() {
  DB.currentUser = null;
  saveDB(DB);
  updateNavUI();
  navigate('auth');
}

function updateNavUI() {
  const u = DB.currentUser;
  const btnAdmin = document.getElementById('nav-btn-admin');
  const btnCustomer = document.getElementById('nav-btn-customer');
  const btnDriver = document.getElementById('nav-btn-driver');
  const btnLogin = document.getElementById('nav-btn-login');
  const userBadge = document.getElementById('navUserBadge');
  const userName = document.getElementById('navUserName');
  const walletBox = document.getElementById('navCustomerWalletBox');

  // إخفاء الكل افتراضياً
  btnAdmin.classList.add('hidden');
  btnCustomer.classList.add('hidden');
  btnDriver.classList.add('hidden');
  userBadge.classList.add('hidden');
  walletBox.classList.add('hidden');
  btnLogin.classList.remove('hidden');

  if (u) {
    btnLogin.classList.add('hidden');
    userBadge.classList.remove('hidden');
    userName.innerText = u.name;

    if (u.role === 'admin') {
      btnAdmin.classList.remove('hidden');
      btnCustomer.classList.remove('hidden');
      btnDriver.classList.remove('hidden');
    } else if (u.role === 'customer') {
      btnCustomer.classList.remove('hidden');
      walletBox.classList.remove('hidden');
      document.getElementById('navCustomerWallet').innerText = (u.wallet || 150).toFixed(2);
    } else if (u.role === 'captain') {
      btnDriver.classList.remove('hidden');
    }
  }
}

function switchAuthTab(tab) {
  document.getElementById('btnAuthTabLogin').className = "flex-1 py-2 rounded-xl text-slate-600 transition";
  document.getElementById('btnAuthTabRegCust').className = "flex-1 py-2 rounded-xl text-slate-600 transition";
  document.getElementById('btnAuthTabRegCap').className = "flex-1 py-2 rounded-xl text-slate-600 transition";

  document.getElementById('formLogin').classList.add('hidden');
  document.getElementById('formRegCustomer').classList.add('hidden');
  document.getElementById('formRegCaptain').classList.add('hidden');

  if (tab === 'login') {
    document.getElementById('btnAuthTabLogin').className = "flex-1 py-2 rounded-xl bg-emerald-600 text-white font-black shadow";
    document.getElementById('formLogin').classList.remove('hidden');
  } else if (tab === 'reg-customer') {
    document.getElementById('btnAuthTabRegCust').className = "flex-1 py-2 rounded-xl bg-emerald-600 text-white font-black shadow";
    document.getElementById('formRegCustomer').classList.remove('hidden');
  } else if (tab === 'reg-captain') {
    document.getElementById('btnAuthTabRegCap').className = "flex-1 py-2 rounded-xl bg-amber-500 text-slate-900 font-black shadow";
    document.getElementById('formRegCaptain').classList.remove('hidden');
  }
}

// ضغط صور المستندات لحجم صغير جداً لحفظ الذاكرة
function handleCompressUpload(event, key) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const maxDim = 320;
      let w = img.width, h = img.height;
      if (w > h && w > maxDim) { h *= maxDim / w; w = maxDim; }
      else if (h > maxDim) { w *= maxDim / h; h = maxDim; }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      tempCaptainDocs[key] = canvas.toDataURL('image/webp', 0.6);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ==========================================
// 3. إدارة الأدمن: مراجعة وثائق الكباتن والاعتماد
// ==========================================
function renderAdminCaptains() {
  const tbody = document.getElementById('adminCaptainsListTable');
  const countEl = document.getElementById('adminPendingCount');
  if (!tbody) return;

  const pending = DB.captainsPending.filter(c => c.status === 'pending');
  if (countEl) countEl.innerText = pending.length;

  if (DB.captainsPending.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-400">لا توجد طلبات كباتن مسجلة حالياً</td></tr>`;
    return;
  }

  tbody.innerHTML = DB.captainsPending.map(c => `
    <tr class="border-b hover:bg-slate-50">
      <td class="p-3 font-bold text-slate-800">${c.name}</td>
      <td class="p-3 font-mono">${c.phone}<br><span class="text-slate-500">${c.plate}</span></td>
      <td class="p-3">${c.vehicle}</td>
      <td class="p-3">
        <button onclick="inspectCaptainDocs('${c.id}')" class="px-2.5 py-1 bg-slate-800 hover:bg-black text-white rounded text-[11px] font-bold">
          <i class="fa-solid fa-eye ml-1"></i> فحص المستندات (4)
        </button>
      </td>
      <td class="p-3">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${c.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : c.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}">
          ${c.status === 'approved' ? 'معتمد ومفعل' : c.status === 'rejected' ? 'مرفوض' : 'بانتظار موافقتك'}
        </span>
      </td>
      <td class="p-3 text-center space-x-1 space-x-reverse">
        ${c.status !== 'approved' ? `<button onclick="approveCaptainByAdmin('${c.id}')" class="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs">قبول وتفعيل الكابتن</button>` : ''}
        ${c.status !== 'rejected' ? `<button onclick="rejectCaptainByAdmin('${c.id}')" class="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-xs">رفض</button>` : ''}
      </td>
    </tr>
  `).join('');
}

function inspectCaptainDocs(capId) {
  const cap = DB.captainsPending.find(c => c.id === capId);
  if (!cap || !cap.docs) return;
  document.getElementById('inspectCaptainTitle').innerText = `مستندات ورخص الكابتن: ${cap.name}`;
  const grid = document.getElementById('inspectImagesGrid');
  
  const docsList = [
    { label: "بطاقة الرقم القومي (وجه)", src: cap.docs.idFront },
    { label: "بطاقة الرقم القومي (ظهر)", src: cap.docs.idBack },
    { label: "رخصة القيادة", src: cap.docs.licenseDrive },
    { label: "رخصة تسيير المركبة", src: cap.docs.licenseCar }
  ];

  grid.innerHTML = docsList.map(d => `
    <div class="border rounded-2xl p-2 bg-slate-50 space-y-1">
      <span class="font-bold text-slate-700 block">${d.label}</span>
      <div class="h-32 bg-white rounded-xl border flex items-center justify-center overflow-hidden">
        ${d.src ? `<img src="${d.src}" class="w-full h-full object-contain cursor-pointer" onclick="window.open('${d.src}')">` : '<span class="text-slate-400">غير متوفر</span>'}
      </div>
    </div>
  `).join('');

  document.getElementById('adminDocsInspectModal').classList.remove('hidden');
}

function closeDocsInspectModal() {
  document.getElementById('adminDocsInspectModal').classList.add('hidden');
}

function approveCaptainByAdmin(capId) {
  const cap = DB.captainsPending.find(c => c.id === capId);
  if (!cap) return;
  cap.status = 'approved';

  // إضافة الكابتن إلى قائمة المستخدمين الفعليين
  if (!DB.users.some(u => u.phone === cap.phone)) {
    DB.users.push({
      role: 'captain',
      name: cap.name,
      phone: cap.phone,
      password: cap.password,
      vehicle: cap.vehicle,
      plate: cap.plate,
      status: 'approved',
      wallet: 200.0
    });
  }

  saveDB(DB);
  renderAdminCaptains();
  alert(`✅ تم اعتماد الكابتن "${cap.name}" بنجاح! الآن يستطيع فتح التطبيق واستقبال الرحلات فوراً.`);
}

function rejectCaptainByAdmin(capId) {
  const cap = DB.captainsPending.find(c => c.id === capId);
  if (!cap) return;
  cap.status = 'rejected';
  saveDB(DB);
  renderAdminCaptains();
  alert(`تم تسجيل رفض الكابتن "${cap.name}".`);
}

function switchAdminTab(tab) {
  document.querySelectorAll('.admin-tab-btn').forEach(b => b.className = "admin-tab-btn flex-1 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100");
  ['captains', 'pricing', 'patches'].forEach(t => document.getElementById(`admintab-${t}`)?.classList.add('hidden'));

  document.getElementById(`btn-admin-${tab}`).className = "admin-tab-btn flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold";
  document.getElementById(`admintab-${tab}`).classList.remove('hidden');

  if (tab === 'captains') renderAdminCaptains();
  if (tab === 'pricing') renderAdminPricing();
  if (tab === 'patches') renderPatches();
}

function renderAdminPricing() {
  const tbody = document.getElementById('adminPricingTable');
  if (!tbody) return;
  tbody.innerHTML = DB.vehicles.map(v => `
    <tr class="border-b">
      <td class="p-3 font-bold">${v.name}</td>
      <td class="p-3"><input type="number" step="0.5" value="${v.baseFare}" onchange="updateVehicleFare('${v.id}', 'baseFare', this.value)" class="w-16 border rounded p-1 font-bold"></td>
      <td class="p-3"><input type="number" step="0.25" value="${v.perKm}" onchange="updateVehicleFare('${v.id}', 'perKm', this.value)" class="w-16 border rounded p-1 font-bold"></td>
      <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${v.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">${v.enabled ? 'مفعل' : 'معطل'}</span></td>
      <td class="p-3 text-center"><button onclick="toggleVehicleStatus('${v.id}')" class="px-2 py-1 bg-slate-200 rounded font-bold">${v.enabled ? 'إيقاف' : 'تشغيل'}</button></td>
    </tr>
  `).join('');
}

function updateVehicleFare(id, key, val) {
  const v = DB.vehicles.find(x => x.id === id);
  if (v) { v[key] = parseFloat(val) || 0; saveDB(DB); renderCustomerVehicles(); recalcTrip(); }
}

function toggleVehicleStatus(id) {
  const v = DB.vehicles.find(x => x.id === id);
  if (v) { v.enabled = !v.enabled; saveDB(DB); renderAdminPricing(); renderCustomerVehicles(); }
}

// ==========================================
// 4. المحرك الصوتي المرتفع وسارينة التنبيه
// ==========================================
let alertAudioCtx = null;
let isAlertRinging = false;
let alertLoopTimeout = null;

function initAudioContext() {
  if (!alertAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) alertAudioCtx = new AudioContextClass();
  }
  if (alertAudioCtx && alertAudioCtx.state === 'suspended') {
    alertAudioCtx.resume();
  }
}
document.addEventListener('click', initAudioContext, { once: false });

function playHighPitchDispatchAlarm(callback) {
  initAudioContext();
  if (!alertAudioCtx) { if (callback) callback(); return; }

  const now = alertAudioCtx.currentTime;
  const osc1 = alertAudioCtx.createOscillator();
  const osc2 = alertAudioCtx.createOscillator();
  const gain = alertAudioCtx.createGain();

  osc1.type = 'sawtooth';
  osc2.type = 'square';

  osc1.frequency.setValueAtTime(750, now);
  osc1.frequency.exponentialRampToValueAtTime(1450, now + 0.25);
  osc1.frequency.linearRampToValueAtTime(800, now + 0.5);
  osc1.frequency.exponentialRampToValueAtTime(1600, now + 0.75);

  osc2.frequency.setValueAtTime(850, now);
  osc2.frequency.exponentialRampToValueAtTime(1550, now + 0.25);
  osc2.frequency.linearRampToValueAtTime(900, now + 0.5);
  osc2.frequency.exponentialRampToValueAtTime(1700, now + 0.75);

  gain.gain.setValueAtTime(1.0, now);
  gain.gain.setValueAtTime(1.0, now + 0.85);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(alertAudioCtx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 1.1);
  osc2.stop(now + 1.1);

  if (callback) setTimeout(() => { if (isAlertRinging) callback(); }, 1150);
}

function speakTripDetailsArabic(trip) {
  if (!isAlertRinging || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const speechText = `يا كابتن! في مشوار جديد واصلك. الركوب من: ${trip.from}. والجهة إلى: ${trip.to}. والأجرة: ${Math.round(trip.fare)} جنيه مصري.`;
  const utterance = new SpeechSynthesisUtterance(speechText);
  utterance.lang = 'ar-EG';
  utterance.rate = 0.95;
  utterance.pitch = 1.1;
  utterance.volume = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const arVoice = voices.find(v => v.lang === 'ar-EG') || voices.find(v => v.lang.startsWith('ar'));
  if (arVoice) utterance.voice = arVoice;

  utterance.onend = () => {
    if (isAlertRinging) {
      alertLoopTimeout = setTimeout(() => {
        if (isAlertRinging) playHighPitchDispatchAlarm(() => speakTripDetailsArabic(trip));
      }, 1200);
    }
  };

  window.speechSynthesis.speak(utterance);
}

function startIncomingTripAlert(trip) {
  isAlertRinging = true;
  initAudioContext();
  clearTimeout(alertLoopTimeout);
  playHighPitchDispatchAlarm(() => speakTripDetailsArabic(trip));
}

function stopIncomingTripAlert() {
  isAlertRinging = false;
  clearTimeout(alertLoopTimeout);
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

function testDriverAlertSound() {
  initAudioContext();
  alert("🔊 جاري تشغيل سارينة التنبيه ونطق تجريبي...");
  stopIncomingTripAlert();
  isAlertRinging = true;
  playHighPitchDispatchAlarm(() => {
    speakTripDetailsArabic({ from: "ميدان الثقافة", to: "جامعة سوهاج", fare: 35 });
    setTimeout(stopIncomingTripAlert, 6000);
  });
}

// ==========================================
// 5. دورة الرحلة والخرائط
// ==========================================
let map, pickupMarker, dropoffMarker, routeLine;
let pickupPoint = [26.5569, 31.6948];
let dropoffPoint = [26.5510, 31.7010];

function initMap() {
  if (map) return;
  const mapContainer = document.getElementById('map');
  if (!mapContainer) return;

  map = L.map('map').setView(pickupPoint, 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  const pIcon = L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', iconSize: [25, 41], iconAnchor: [12, 41] });
  const dIcon = L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', iconSize: [25, 41], iconAnchor: [12, 41] });

  pickupMarker = L.marker(pickupPoint, { icon: pIcon, draggable: true }).addTo(map);
  dropoffMarker = L.marker(dropoffPoint, { icon: dIcon, draggable: true }).addTo(map);

  pickupMarker.on('dragend', e => { pickupPoint = [e.target.getLatLng().lat, e.target.getLatLng().lng]; recalcTrip(); });
  dropoffMarker.on('dragend', e => { dropoffPoint = [e.target.getLatLng().lat, e.target.getLatLng().lng]; recalcTrip(); });

  map.on('click', e => {
    dropoffPoint = [e.latlng.lat, e.latlng.lng];
    dropoffMarker.setLatLng(dropoffPoint);
    document.getElementById('dropoffInput').value = "الموقع المحدد على الخريطة";
    recalcTrip();
  });

  document.getElementById('pickupInput').value = "ميدان الثقافة - سوهاج";
  document.getElementById('dropoffInput').value = "كورنيش النيل الشرقي - سوهاج";
  renderCustomerVehicles();
  recalcTrip();
}

function recalcTrip() {
  const dist = 4.5;
  document.getElementById('calcDistanceText').innerText = `${dist} كم`;

  if (routeLine && map) map.removeLayer(routeLine);
  if (map) routeLine = L.polyline([pickupPoint, dropoffPoint], { color: '#059669', weight: 4 }).addTo(map);

  const veh = DB.vehicles.find(v => v.id === DB.selectedVehicleId) || DB.vehicles[0];
  document.getElementById('calcVehicleTypeText').innerText = veh.name;

  const total = (veh.baseFare + (dist * veh.perKm) + DB.extraFare).toFixed(2);
  document.getElementById('calcTotalFareText').innerText = `${total} ج.م`;
}

function renderCustomerVehicles() {
  const g = document.getElementById('vehicleTypesGrid');
  if (!g) return;
  g.innerHTML = DB.vehicles.filter(v => v.enabled).map(v => `
    <button onclick="selectVehicle('${v.id}')" class="p-2 rounded-2xl border-2 transition text-center flex flex-col items-center justify-between ${v.id === DB.selectedVehicleId ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 bg-white'}">
      <i class="${v.icon} text-xl text-slate-600 mb-1"></i>
      <div class="font-black text-[11px]">${v.name}</div>
      <div class="text-[9px] text-emerald-700 font-bold">يبدأ ${v.baseFare} ج.م</div>
    </button>
  `).join('');
}

function selectVehicle(id) {
  DB.selectedVehicleId = id;
  saveDB(DB);
  renderCustomerVehicles();
  recalcTrip();
}

function setExtraFare(amt) {
  DB.extraFare = amt;
  document.getElementById('extraFareBadge').innerText = `+${amt} ج.م`;
  recalcTrip();
}

function handleSearchSuggestions(q, type) {
  const c = document.getElementById(`${type}Suggestions`);
  if (!q.trim()) { c.classList.add('hidden'); return; }
  const landmarks = ["ميدان الثقافة", "ميدان العارف", "كورنيش النيل", "جامعة سوهاج الجديدة", "أخميم"];
  const matches = landmarks.filter(i => i.includes(q.trim()));
  c.innerHTML = matches.map(m => `
    <div onclick="document.getElementById('${type}Input').value='${m}'; document.getElementById('${type}Suggestions').classList.add('hidden');" class="p-2 hover:bg-emerald-50 cursor-pointer font-bold text-slate-700">
      <i class="fa-solid fa-map-pin text-emerald-600 ml-1"></i> ${m}
    </div>
  `).join('') || `<div class="p-2 text-slate-400">لا توجد نتائج</div>`;
  c.classList.remove('hidden');
}

function getCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(p => {
      pickupPoint = [p.coords.latitude, p.coords.longitude];
      if (pickupMarker) pickupMarker.setLatLng(pickupPoint);
      if (map) map.setView(pickupPoint, 15);
      document.getElementById('pickupInput').value = "موقعي الحالي (GPS)";
      recalcTrip();
    });
  }
}

// طلب الرحلة
function handleCustomerRequestRide() {
  initAudioContext();
  const fare = parseFloat(document.getElementById('calcTotalFareText').innerText);
  const veh = DB.vehicles.find(v => v.id === DB.selectedVehicleId);

  activeTripData = {
    from: document.getElementById('pickupInput').value,
    to: document.getElementById('dropoffInput').value,
    vehicle: veh.name,
    fare: fare
  };

  document.getElementById('btnRequestRide').disabled = true;
  document.getElementById('btnRequestRide').innerText = "جاري البحث عن كابتن...";
  document.getElementById('custStatusBadge').innerText = "تم إرسال الطلب";

  // إظهار العرض في شاشة الكابتن وبدء الرنين العالي والنطق
  document.getElementById('driverIdleBox').classList.add('hidden');
  document.getElementById('driverOfferBox').classList.remove('hidden');
  document.getElementById('offerFromText').innerText = activeTripData.from;
  document.getElementById('offerToText').innerText = activeTripData.to;
  document.getElementById('offerVehicleText').innerText = activeTripData.vehicle;
  document.getElementById('offerFareText').innerText = `${activeTripData.fare} ج.م`;

  startIncomingTripAlert(activeTripData);

  let timeLeft = 25;
  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    timeLeft--;
    const t = document.getElementById('countdownTimer');
    if (t) t.innerText = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(countdownInterval);
      stopIncomingTripAlert();
      resetCaptain();
      alert("انتهى وقت قبول المشوار.");
    }
  }, 1000);
}

function captainAcceptTrip() {
  clearInterval(countdownInterval);
  stopIncomingTripAlert();
  document.getElementById('driverOfferBox').classList.add('hidden');
  document.getElementById('driverActiveTripBox').classList.remove('hidden');
  document.getElementById('driverActiveTripFare').innerText = `الأجرة: ${activeTripData.fare} ج.م`;
  document.getElementById('customerDriverCard').classList.remove('hidden');
  document.getElementById('custStatusBadge').innerText = "الكابتن قادم لموقعك";
}

function captainRejectTrip() {
  clearInterval(countdownInterval);
  stopIncomingTripAlert();
  resetCaptain();
  document.getElementById('btnRequestRide').disabled = false;
  document.getElementById('btnRequestRide').innerText = "طلب المشوار فوراً";
  document.getElementById('custStatusBadge').innerText = "تم الرفض، جرب مرة أخرى";
}

function captainNotifyArrived() {
  document.getElementById('btnCaptainArrived').classList.add('hidden');
  document.getElementById('btnCaptainStartTrip').classList.remove('hidden');
  document.getElementById('tripLiveStatusPill').innerText = "الكابتن وصل لموقعك 🚖";
  alert("🔔 إشعار للعميل: وصل الكابتن وهو بانتظارك!");
}

function captainStartTrip() {
  document.getElementById('btnCaptainStartTrip').classList.add('hidden');
  document.getElementById('btnCaptainCompleteTrip').classList.remove('hidden');
  document.getElementById('tripLiveStatusPill').innerText = "الرحلة جارية نحو الوجهة 🟢";
}

function captainCompleteTrip() {
  const fare = activeTripData.fare;
  const u = DB.currentUser;
  if (u && u.role === 'customer' && u.wallet >= fare) u.wallet -= fare;
  saveDB(DB);
  updateNavUI();
  resetCaptain();

  document.getElementById('btnRequestRide').disabled = false;
  document.getElementById('btnRequestRide').innerText = "طلب المشوار فوراً";
  document.getElementById('customerDriverCard').classList.add('hidden');
  document.getElementById('custStatusBadge').innerText = "اكتملت الرحلة";
  alert(`✅ تم إنهاء الرحلة وتحصيل ${fare} ج.م بنجاح!`);
}

function resetCaptain() {
  document.getElementById('driverOfferBox').classList.add('hidden');
  document.getElementById('driverActiveTripBox').classList.add('hidden');
  document.getElementById('driverIdleBox').classList.remove('hidden');
}

// ==========================================
// 6. مركز الباتشات البرمجية المباشر
// ==========================================
function getPatches() {
  try {
    const raw = localStorage.getItem('TAWSILA_PATCHES');
    return raw ? JSON.parse(raw) : [];
  } catch(e) { return []; }
}
function savePatches(p) { localStorage.setItem('TAWSILA_PATCHES', JSON.stringify(p)); }

function injectPatch(p, idx) {
  const oldS = document.getElementById(`injected-patch-css-${idx}`);
  if (oldS) oldS.remove();
  const oldH = document.getElementById(`injected-patch-html-${idx}`);
  if (oldH) oldH.remove();

  if (!p.enabled) return;
  if (p.type === 'css') {
    const s = document.createElement('style');
    s.id = `injected-patch-css-${idx}`;
    s.textContent = p.code;
    document.head.appendChild(s);
  } else if (p.type === 'html') {
    const c = document.getElementById('patchHtmlContainer');
    if (c) {
      const d = document.createElement('div');
      d.id = `injected-patch-html-${idx}`;
      d.innerHTML = p.code;
      c.appendChild(d);
    }
  } else if (p.type === 'js') {
    try { new Function(p.code)(); } catch(err) { console.error("Patch Error:", err); }
  }
}

function applyAllPatches() {
  getPatches().forEach((p, idx) => { if (p.enabled) injectPatch(p, idx); });
}

function renderPatches() {
  const tbody = document.getElementById('adminPatchesListTable');
  if (!tbody) return;
  const p = getPatches();
  tbody.innerHTML = p.map((item, idx) => `
    <tr class="border-b">
      <td class="p-3 font-bold">${item.name}</td>
      <td class="p-3 uppercase text-[10px] font-bold font-mono">${item.type}</td>
      <td class="p-3"><button onclick="togglePatchStatus(${idx})" class="px-2 py-0.5 rounded text-[10px] font-bold ${item.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">${item.enabled ? 'مفعل ومحقون' : 'معطل'}</button></td>
      <td class="p-3 text-center"><button onclick="deletePatch(${idx})" class="text-rose-600 font-bold text-xs">حذف</button></td>
    </tr>
  `).join('') || `<tr><td colspan="4" class="p-4 text-center text-slate-400">لا توجد باتشات</td></tr>`;
}

function openNewPatchModal() {
  document.getElementById('patchNameInput').value = '';
  document.getElementById('patchCodeInput').value = '';
  document.getElementById('patchEditorModal').classList.remove('hidden');
}
function closePatchModal() { document.getElementById('patchEditorModal').classList.add('hidden'); }

function handleSavePatch(e) {
  e.preventDefault();
  const name = document.getElementById('patchNameInput').value.trim();
  const type = document.getElementById('patchTypeInput').value;
  const code = document.getElementById('patchCodeInput').value;
  const p = getPatches();
  p.push({ name, type, code, enabled: true });
  savePatches(p);
  applyAllPatches();
  renderPatches();
  closePatchModal();
  alert("تم حقن الباتش فوراً!");
}

function togglePatchStatus(idx) {
  const p = getPatches();
  if (p[idx]) { p[idx].enabled = !p[idx].enabled; savePatches(p); applyAllPatches(); renderPatches(); }
}

function deletePatch(idx) {
  const p = getPatches();
  p.splice(idx, 1);
  savePatches(p);
  applyAllPatches();
  renderPatches();
}

// ==========================================
// 7. التنقل والمحفظة والشات
// ==========================================
function navigate(view) {
  document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
  const target = document.getElementById(`view-${view}`);
  if (target) target.classList.remove('hidden');

  if (view === 'customer') {
    setTimeout(() => { initMap(); if (map) map.invalidateSize(); }, 200);
  } else if (view === 'driver') {
    handleDriverViewLogic();
  } else if (view === 'admin') {
    switchAdminTab('captains');
  }
}

function handleDriverViewLogic() {
  const u = DB.currentUser;
  const pendingScreen = document.getElementById('captainPendingScreen');
  const activeScreen = document.getElementById('captainActiveScreen');

  // إذا كان الكابتن قيد المراجعة
  if (u && u.role === 'captain' && u.captainStatus === 'pending') {
    pendingScreen.classList.remove('hidden');
    activeScreen.classList.add('hidden');
    document.getElementById('pendingCapName').innerText = u.name;
  } else {
    // كابتن معتمد أو الأدمن نفسه يتفقد الشاشة
    pendingScreen.classList.add('hidden');
    activeScreen.classList.remove('hidden');
    if (u) {
      document.getElementById('driverDashboardName').innerText = `الكابتن: ${u.name}`;
      document.getElementById('driverWalletEGP').innerText = `${(u.wallet || 300).toFixed(2)} ج.م`;
    }
  }
}

function handleLogoClick() {
  const u = DB.currentUser;
  if (!u) navigate('auth');
  else if (u.role === 'admin') navigate('admin');
  else if (u.role === 'captain') navigate('driver');
  else navigate('customer');
}

function openWalletModal() { document.getElementById('walletModal').classList.remove('hidden'); }
function closeWalletModal() { document.getElementById('walletModal').classList.add('hidden'); }
function confirmCustomerRecharge() {
  const amt = parseFloat(document.getElementById('walletRechargeAmount').value) || 50;
  if (DB.currentUser) DB.currentUser.wallet = (DB.currentUser.wallet || 0) + amt;
  saveDB(DB);
  updateNavUI();
  closeWalletModal();
  alert(`تم شحن المحفظة بمبلغ ${amt} ج.م بنجاح!`);
}

function openChatModal() { document.getElementById('chatModal').classList.remove('hidden'); }
function closeChatModal() { document.getElementById('chatModal').classList.add('hidden'); }
function handleSendChatMessage(e) {
  e.preventDefault();
  const inp = document.getElementById('chatInputText');
  document.getElementById('chatMessagesBox').innerHTML += `<div class="bg-emerald-600 text-white p-2 rounded-xl text-xs max-w-[80%] mr-auto">${inp.value}</div>`;
  inp.value = '';
}

function startVoiceCall() { document.getElementById('voiceCallModal').classList.remove('hidden'); }
function endVoiceCall() { document.getElementById('voiceCallModal').classList.add('hidden'); }

// التشغيل المبدئي عند التحميل
window.addEventListener('DOMContentLoaded', () => {
  updateNavUI();
  applyAllPatches();

  if (DB.currentUser) {
    if (DB.currentUser.role === 'admin') navigate('admin');
    else if (DB.currentUser.role === 'captain') navigate('driver');
    else navigate('customer');
  } else {
    navigate('auth');
  }
});
