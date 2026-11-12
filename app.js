/**
 * تطبيق توصيلة سوهاج - Tawsila Super App Engine
 * يتضمن:
 * 1. تهيئة Firebase & Google Authentication & State Listener
 * 2. نظام التنبيه الصوتي عالي التردد (Siren) وقراءة الرحلات بالعامية المصرية
 * 3. نظام الإشعارات الفورية للمتصفح (Web Push Notifications)
 * 4. محرك الباتشات البرمجية المصلح بالكامل (Live Code Injector)
 * 5. نظام الخرائط التفاعلية (Leaflet) والتسعير
 */

// ==========================================
// 1. إعدادات ومصادقة Firebase الرسمية
// ==========================================
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA4rZQpm8RI-tEcZl6SmUkc-Pu2KGBIBZE",
  authDomain: "tawsila-77a90-21747.firebaseapp.com",
  projectId: "tawsila-77a90",
  storageBucket: "tawsila-77a90.firebasestorage.app",
  messagingSenderId: "973291114004",
  appId: "1:973291114004:web:d78e6d373b97a3cce12101",
  measurementId: "G-QHXQP80GEX"
};

let firebaseAuth = null;
try {
  if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    firebaseAuth = firebase.auth();

    // مراقبة الجلسة وحالة تسجيل الدخول تلقائياً
    firebaseAuth.onAuthStateChanged((user) => {
      if (user) {
        updateUserUI(user.displayName || "مستخدم مسجل", user.photoURL);
        console.log("✅ المستخدم مسجل الدخول حالياً:", user.displayName);
      } else {
        resetUserUI();
      }
    });

    console.log("✅ تم ربط محرك Firebase بنجاح بمشروع:", FIREBASE_CONFIG.projectId);
  }
} catch (e) {
  console.error("Firebase Initialization Error:", e);
}

// تسجيل الدخول بحساب Google الرسمي
function loginWithGoogleFirebase() {
  if (firebaseAuth) {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');

    firebaseAuth.signInWithPopup(provider)
      .then((result) => {
        const user = result.user;
        alert(`🎉 أهلاً بك يا ${user.displayName}!\nتم تسجيل الدخول بنجاح عبر حساب Google.`);
        updateUserUI(user.displayName, user.photoURL);
        navigate('customer');
      })
      .catch((error) => {
        console.error("Google Auth Error:", error);
        alert(`فشل تسجيل الدخول بـ Google:\n${error.message}`);
      });
  } else {
    // تسجيل دخول محلي تجريبي في حال انقطاع الشبكة
    alert("🎉 تم تسجيل الدخول التجريبي بنجاح!");
    updateUserUI("كابتن / عميل تجريبي", "https://cdn-icons-png.flaticon.com/512/3135/3135715.png");
    navigate('customer');
  }
}

function logoutFirebase() {
  if (firebaseAuth && firebaseAuth.currentUser) {
    firebaseAuth.signOut().then(() => {
      alert("تم تسجيل الخروج بنجاح.");
      resetUserUI();
    });
  } else {
    resetUserUI();
  }
}

function updateUserUI(name, photoURL) {
  const badge = document.getElementById('userProfileBadge');
  const img = document.getElementById('userAvatarImg');
  const nameEl = document.getElementById('userNameText');
  if (badge && img && nameEl) {
    img.src = photoURL || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
    nameEl.innerText = name;
    badge.classList.remove('hidden');
    badge.classList.add('flex');
  }
}

function resetUserUI() {
  const badge = document.getElementById('userProfileBadge');
  if (badge) {
    badge.classList.add('hidden');
    badge.classList.remove('flex');
  }
}

// ==========================================
// 2. نظام الإشعارات الفورية (System Notifications)
// ==========================================
function requestNotificationPermission() {
  if (!("Notification" in window)) {
    alert("متصفحك لا يدعم إشعارات النظام.");
    return;
  }
  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      alert("🔔 تم تفعيل إشعارات المشاوير بنجاح! ستصلك تنبيهات حتى لو كان المتصفح في الخلفية.");
    } else {
      alert("⚠️ تم رفض إذن الإشعارات، يمكنك تفعيله من إعدادات المتصفح.");
    }
  });
}

function sendSystemNotification(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, {
        body: body,
        icon: "https://cdn-icons-png.flaticon.com/512/3202/3202926.png",
        vibrate: [200, 100, 200]
      });
    } catch (e) {
      console.log("Notification send error:", e);
    }
  }
}

// ==========================================
// 3. نظام التنبيه الصوتي المرتفع والنطق بالعامية
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

// تشغيل سارينة إنذار قوية جداً (Loud Dual-Tone Siren)
function playHighPitchDispatchAlarm(callback) {
  initAudioContext();
  if (!alertAudioCtx) {
    if (callback) callback();
    return;
  }

  const now = alertAudioCtx.currentTime;
  const osc1 = alertAudioCtx.createOscillator();
  const osc2 = alertAudioCtx.createOscillator();
  const gain = alertAudioCtx.createGain();

  osc1.type = 'sawtooth';
  osc2.type = 'square';

  // ترددات متناوبة تخترق الضوضاء المحيطة
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

  if (callback) {
    setTimeout(() => {
      if (isAlertRinging) callback();
    }, 1150);
  }
}

// قراءة بيانات الرحلة باللغة العربية العامية المصرية
function speakTripDetailsArabic(trip) {
  if (!isAlertRinging) return;
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();

  const pickupClean = trip.from || "موقع الركوب";
  const dropoffClean = trip.to || "جهة الوصول";
  const fareClean = Math.round(trip.fare);

  const speechText = `يا كابتن! في مشوار جديد واصلك في سوهاج. الركوب من: ${pickupClean}. رايح على: ${dropoffClean}. والأجرة المقدرة: ${fareClean} جنيه مصري.`;

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
        if (isAlertRinging) startAlarmCycle(trip);
      }, 1200);
    }
  };

  utterance.onerror = () => {
    if (isAlertRinging) {
      alertLoopTimeout = setTimeout(() => {
        if (isAlertRinging) startAlarmCycle(trip);
      }, 1500);
    }
  };

  window.speechSynthesis.speak(utterance);
}

function startAlarmCycle(trip) {
  if (!isAlertRinging) return;
  playHighPitchDispatchAlarm(() => {
    speakTripDetailsArabic(trip);
  });
}

function startIncomingTripAlert(trip) {
  isAlertRinging = true;
  initAudioContext();
  clearTimeout(alertLoopTimeout);
  startAlarmCycle(trip);

  // إرسال إشعار فوري للنظام (Push Notification)
  sendSystemNotification("🔔 طلب مشوار جديد في سوهاج!", `من: ${trip.from} إلى: ${trip.to} - الأجرة: ${trip.fare} ج.م`);
}

function stopIncomingTripAlert() {
  isAlertRinging = false;
  clearTimeout(alertLoopTimeout);
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

function testDriverAlertSound() {
  initAudioContext();
  alert("🔊 جاري تشغيل نغمة المشوار وقراءة صوتية تجريبية للتأكد من الصوت...");
  const dummyTrip = { from: "ميدان الثقافة بسوهاج", to: "جامعة سوهاج الجديدة", fare: 35 };
  stopIncomingTripAlert();
  isAlertRinging = true;
  playHighPitchDispatchAlarm(() => {
    speakTripDetailsArabic(dummyTrip);
    setTimeout(() => { stopIncomingTripAlert(); }, 7000);
  });
}

if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };
}

// ==========================================
// 4. محرك الباتشات البرمجية المصلح (Live Code Injector)
// ==========================================
function getStoredPatches() {
  try {
    const raw = localStorage.getItem('TAWSILA_PATCHES');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveStoredPatches(patches) {
  localStorage.setItem('TAWSILA_PATCHES', JSON.stringify(patches));
}

// إزالة باتش معين من المتصفح
function removePatchFromDOM(index) {
  // إزالة وسم CSS إن وجد
  const styleEl = document.getElementById(`injected-patch-css-${index}`);
  if (styleEl) styleEl.remove();

  // إزالة عنصر HTML إن وجد
  const htmlEl = document.getElementById(`injected-patch-html-${index}`);
  if (htmlEl) htmlEl.remove();
}

// تطبيق وحقن باتش داخل الصفحة فورياً
function injectPatch(patch, index) {
  removePatchFromDOM(index);
  if (!patch.enabled) return;

  if (patch.type === 'css') {
    const style = document.createElement('style');
    style.id = `injected-patch-css-${index}`;
    style.textContent = patch.code;
    document.head.appendChild(style);
  } else if (patch.type === 'html') {
    const container = document.getElementById('patchHtmlContainer');
    if (container) {
      const wrapper = document.createElement('div');
      wrapper.id = `injected-patch-html-${index}`;
      wrapper.innerHTML = patch.code;
      container.appendChild(wrapper);
    }
  } else if (patch.type === 'js') {
    try {
      // تنفيذ كود الجافاسكريبت مباشرة
      const executeJS = new Function(patch.code);
      executeJS();
    } catch (err) {
      console.error(`خطأ في تنفيذ الباتش البرمجي (${patch.name}):`, err);
    }
  }
}

// تشغيل كافة الباتشات المفعلة عند إقلاع التطبيق
function applyAllPatches() {
  const patches = getStoredPatches();
  patches.forEach((p, idx) => {
    if (p.enabled) injectPatch(p, idx);
  });
}

function renderPatches() {
  const patches = getStoredPatches();
  const table = document.getElementById('patchesListTable');
  if (!table) return;

  if (!patches.length) {
    table.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400">لا توجد باتشات مضافة حتى الآن. اضغط على "إضافة باتش جديد".</td></tr>`;
    return;
  }

  table.innerHTML = patches.map((item, idx) => `
    <tr class="border-b hover:bg-slate-50">
      <td class="p-3 font-bold text-slate-800">
        <i class="fa-solid ${item.type === 'js' ? 'fa-code text-amber-500' : item.type === 'css' ? 'fa-palette text-blue-500' : 'fa-cubes text-emerald-500'} ml-1"></i>
        ${item.name}
      </td>
      <td class="p-3 font-mono uppercase text-[10px] font-bold text-slate-500">${item.type}</td>
      <td class="p-3">
        <button onclick="togglePatchStatus(${idx})" class="px-2 py-0.5 rounded text-[10px] font-bold transition ${item.enabled ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}">
          ${item.enabled ? '🟢 شغال ومحقون' : '⚪ معطل'}
        </button>
      </td>
      <td class="p-3 text-center space-x-1 space-x-reverse">
        <button onclick="editPatch(${idx})" class="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-bold">تعديل</button>
        <button onclick="deletePatch(${idx})" class="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-xs font-bold">حذف</button>
      </td>
    </tr>
  `).join('');
}

function openNewPatchModal() {
  document.getElementById('editPatchIndex').value = "-1";
  document.getElementById('patchNameInput').value = "";
  document.getElementById('patchTypeInput').value = "css";
  document.getElementById('patchCodeInput').value = "";
  document.getElementById('patchModalTitle').innerText = "إضافة باتش برمجى جديد";
  document.getElementById('patchEditorModal').classList.remove('hidden');
}

function editPatch(idx) {
  const patches = getStoredPatches();
  const p = patches[idx];
  if (!p) return;
  document.getElementById('editPatchIndex').value = idx;
  document.getElementById('patchNameInput').value = p.name;
  document.getElementById('patchTypeInput').value = p.type;
  document.getElementById('patchCodeInput').value = p.code;
  document.getElementById('patchModalTitle').innerText = "تعديل الباتش: " + p.name;
  document.getElementById('patchEditorModal').classList.remove('hidden');
}

function closePatchModal() {
  document.getElementById('patchEditorModal').classList.add('hidden');
}

function handleSavePatch(e) {
  e.preventDefault();
  const idx = parseInt(document.getElementById('editPatchIndex').value);
  const name = document.getElementById('patchNameInput').value.trim();
  const type = document.getElementById('patchTypeInput').value;
  const code = document.getElementById('patchCodeInput').value;

  const patches = getStoredPatches();

  if (idx >= 0 && patches[idx]) {
    patches[idx] = { ...patches[idx], name, type, code };
    injectPatch(patches[idx], idx);
  } else {
    const newPatch = { name, type, code, enabled: true };
    patches.push(newPatch);
    injectPatch(newPatch, patches.length - 1);
  }

  saveStoredPatches(patches);
  closePatchModal();
  renderPatches();
  alert("✅ تم حفظ الباتش وحقنه في الصفحة فوراً!");
}

function togglePatchStatus(idx) {
  const patches = getStoredPatches();
  if (!patches[idx]) return;
  patches[idx].enabled = !patches[idx].enabled;
  saveStoredPatches(patches);
  if (patches[idx].enabled) {
    injectPatch(patches[idx], idx);
  } else {
    removePatchFromDOM(idx);
  }
  renderPatches();
}

function deletePatch(idx) {
  if (!confirm("هل أنت متأكد من رغبتك في حذف هذا الباتش نهائياً؟")) return;
  removePatchFromDOM(idx);
  const patches = getStoredPatches();
  patches.splice(idx, 1);
  saveStoredPatches(patches);
  renderPatches();
  // إعادة حقن الباتشات لتحديث مؤشرات الـ IDs
  applyAllPatches();
}

// ==========================================
// 5. قاعدة البيانات المحلية وبيانات سوهاج
// ==========================================
const SOHAG_LANDMARKS = [
  { name: "ميدان الثقافة - سوهاج", lat: 26.5569, lng: 31.6948 },
  { name: "ميدان العارف بالله - سوهاج", lat: 26.5595, lng: 31.6931 },
  { name: "كورنيش النيل الشرقي - سوهاج", lat: 26.5510, lng: 31.7010 },
  { name: "جامعة سوهاج الجديدة - الكوامل", lat: 26.4715, lng: 31.6685 },
  { name: "جامعة سوهاج القديمة - مدينة ناصر", lat: 26.5650, lng: 31.6990 },
  { name: "شارع سيتي وميدان العروبة", lat: 26.5620, lng: 31.6880 },
  { name: "مدينة أخميم - شارع الترعة المردومة", lat: 26.5600, lng: 31.7450 }
];

const DEFAULT_SYSTEM_DATA = {
  settings: { baseFare: 10.0, perKm: 3.5 },
  customerWallet: 150.00,
  selectedVehicleId: 'car',
  extraFare: 0,
  vehicles: [
    { id: 'tuktuk', name: 'توكتوك سوهاج', icon: 'fa-solid fa-motorcycle', baseFare: 7.0, perKm: 2.5, waitingRate: 0.5, multiplier: 0.7, image: null, enabled: true },
    { id: 'moto', name: 'موتوسيكل سريع', icon: 'fa-solid fa-bicycle', baseFare: 9.0, perKm: 3.0, waitingRate: 0.5, multiplier: 0.85, image: null, enabled: true },
    { id: 'car', name: 'سيارة ملاكي مكيفة', icon: 'fa-solid fa-car', baseFare: 12.0, perKm: 3.5, waitingRate: 0.75, multiplier: 1.0, image: null, enabled: true }
  ],
  paymentGateways: [
    { id: 'vodafone', name: 'فودافون كاش', account: '01012345678', enabled: true },
    { id: 'instapay', name: 'إنستاباي (InstaPay)', account: 'sohag.ride@instapay', enabled: true }
  ]
};

function getSystemDB() {
  const d = localStorage.getItem('TAWSILA_SYSTEM_STORE');
  return d ? JSON.parse(d) : DEFAULT_SYSTEM_DATA;
}
function saveSystemDB(d) {
  localStorage.setItem('TAWSILA_SYSTEM_STORE', JSON.stringify(d));
}

let DB = getSystemDB();
let activeTripData = null;
let countdownInterval = null;

// ==========================================
// 6. محرك الخرائط Leaflet وحساب المسافات
// ==========================================
let map, pickupMarker, dropoffMarker, nearestCapMarker, routeLine;
let pickupPoint = [26.5569, 31.6948];
let dropoffPoint = [26.5510, 31.7010];
let captainPoint = [26.5540, 31.6900];

function initSohagMap() {
  if (map) return;
  const mapContainer = document.getElementById('map');
  if (!mapContainer) return;

  map = L.map('map').setView([26.5569, 31.6948], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  const pIcon = L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', iconSize: [25, 41], iconAnchor: [12, 41] });
  const dIcon = L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', iconSize: [25, 41], iconAnchor: [12, 41] });
  const cIcon = L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png', iconSize: [36, 36], iconAnchor: [18, 18] });

  pickupMarker = L.marker(pickupPoint, { icon: pIcon, draggable: true }).addTo(map);
  dropoffMarker = L.marker(dropoffPoint, { icon: dIcon, draggable: true }).addTo(map);
  nearestCapMarker = L.marker(captainPoint, { icon: cIcon }).addTo(map);

  pickupMarker.on('dragend', e => {
    pickupPoint = [e.target.getLatLng().lat, e.target.getLatLng().lng];
    recalcTrip();
  });
  dropoffMarker.on('dragend', e => {
    dropoffPoint = [e.target.getLatLng().lat, e.target.getLatLng().lng];
    recalcTrip();
  });

  map.on('click', e => {
    dropoffPoint = [e.latlng.lat, e.latlng.lng];
    dropoffMarker.setLatLng(dropoffPoint);
    document.getElementById('dropoffInput').value = "الموقع المحدد بالخريطة";
    recalcTrip();
  });

  document.getElementById('pickupInput').value = "ميدان الثقافة - سوهاج";
  document.getElementById('dropoffInput').value = "كورنيش النيل الشرقي - سوهاج";
  renderCustomerVehicles();
  recalcTrip();
}

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1);
}

function recalcTrip() {
  const dist = Math.max(1.0, parseFloat(getDistanceKm(pickupPoint[0], pickupPoint[1], dropoffPoint[0], dropoffPoint[1])));
  document.getElementById('calcDistanceText').innerText = `${dist} كم`;

  if (routeLine) map.removeLayer(routeLine);
  routeLine = L.polyline([pickupPoint, dropoffPoint], { color: '#059669', weight: 4, dashArray: '6, 8' }).addTo(map);

  const veh = DB.vehicles.find(v => v.id === DB.selectedVehicleId) || DB.vehicles[0];
  document.getElementById('calcVehicleTypeText').innerText = veh.name;

  const base = veh.baseFare !== undefined ? veh.baseFare : 10.0;
  const perKm = veh.perKm !== undefined ? veh.perKm : 3.5;
  const total = (base + (dist * perKm) + DB.extraFare).toFixed(2);
  document.getElementById('calcTotalFareText').innerText = `${total} ج.م`;
}

function renderCustomerVehicles() {
  const g = document.getElementById('vehicleTypesGrid');
  if (!g) return;
  g.innerHTML = DB.vehicles.filter(v => v.enabled).map(v => `
    <button onclick="selectVehicle('${v.id}')" class="p-2 rounded-2xl border-2 transition text-center flex flex-col items-center justify-between ${v.id === DB.selectedVehicleId ? 'border-emerald-600 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white'}">
      <div class="w-12 h-12 rounded-xl overflow-hidden mb-1 flex items-center justify-center bg-slate-100">
        ${v.image ? `<img src="${v.image}" class="w-full h-full object-cover">` : `<i class="${v.icon} text-xl text-slate-600"></i>`}
      </div>
      <div class="font-black text-[11px]">${v.name}</div>
      <div class="text-[9px] text-emerald-700 font-bold">يبدأ ${v.baseFare} ج.م</div>
    </button>
  `).join('');
}

function selectVehicle(id) {
  DB.selectedVehicleId = id;
  saveSystemDB(DB);
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
  const matches = SOHAG_LANDMARKS.filter(i => i.name.includes(q.trim()));
  if (!matches.length) {
    c.innerHTML = `<div class="p-2 text-slate-400">لا توجد اقتراحات مطابقة</div>`;
  } else {
    c.innerHTML = matches.map(m => `
      <div onclick="selectLocationSuggestion('${m.name}', ${m.lat}, ${m.lng}, '${type}')" class="p-2 hover:bg-emerald-50 cursor-pointer font-bold text-slate-700">
        <i class="fa-solid fa-map-pin text-emerald-600 ml-1"></i> ${m.name}
      </div>
    `).join('');
  }
  c.classList.remove('hidden');
}

function selectLocationSuggestion(name, lat, lng, type) {
  document.getElementById(`${type}Input`).value = name;
  document.getElementById(`${type}Suggestions`).classList.add('hidden');
  if (type === 'pickup') {
    pickupPoint = [lat, lng];
    pickupMarker.setLatLng(pickupPoint);
  } else {
    dropoffPoint = [lat, lng];
    dropoffMarker.setLatLng(dropoffPoint);
  }
  map.fitBounds([pickupPoint, dropoffPoint], { padding: [50, 50] });
  recalcTrip();
}

function getCurrentLocationSohag() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(p => {
      pickupPoint = [p.coords.latitude, p.coords.longitude];
      pickupMarker.setLatLng(pickupPoint);
      map.setView(pickupPoint, 15);
      document.getElementById('pickupInput').value = "موقعي الحالي (سوهاج)";
      recalcTrip();
    }, () => {
      alert("يرجى تفعيل صلاحية الـ GPS للوصول لموقعك.");
    });
  }
}

// ==========================================
// 7. دورة طلب الرحلة وقبول الكابتن
// ==========================================
function handleCustomerRequestRide() {
  initAudioContext();
  const fare = parseFloat(document.getElementById('calcTotalFareText').innerText);
  const veh = DB.vehicles.find(v => v.id === DB.selectedVehicleId);

  activeTripData = {
    id: 'CRM-' + Math.floor(100 + Math.random() * 900),
    from: document.getElementById('pickupInput').value,
    to: document.getElementById('dropoffInput').value,
    vehicle: veh.name,
    fare: fare
  };

  document.getElementById('btnRequestRide').disabled = true;
  document.getElementById('btnRequestRide').innerText = "جاري الاتصال بالكابتن...";
  document.getElementById('custStatusBadge').innerText = "تم إرسال الطلب";

  document.getElementById('driverIdleBox').classList.add('hidden');
  document.getElementById('driverOfferBox').classList.remove('hidden');
  document.getElementById('offerFromText').innerText = activeTripData.from;
  document.getElementById('offerToText').innerText = activeTripData.to;
  document.getElementById('offerVehicleText').innerText = activeTripData.vehicle;
  document.getElementById('offerFareText').innerText = `${activeTripData.fare} ج.م`;

  // إطلاق التنبيه الصوتي والنطق بالعامية
  startIncomingTripAlert(activeTripData);

  let timeLeft = 25;
  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    timeLeft--;
    document.getElementById('countdownTimer').innerText = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(countdownInterval);
      stopIncomingTripAlert();
      resetCaptain();
      alert("انتهت مهلة قبول المشوار.");
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

function captainNotifyArrived() {
  document.getElementById('btnCaptainArrived').classList.add('hidden');
  document.getElementById('btnCaptainStartTrip').classList.remove('hidden');
  document.getElementById('tripLiveStatusPill').innerText = "الكابتن وصل وينتظرك 🚖";
  alert("🔔 تنبيه للعميل: وصل الكابتن الآن وهو بانتظارك أمام نقطة الركوب!");
}

function captainStartTrip() {
  document.getElementById('btnCaptainStartTrip').classList.add('hidden');
  document.getElementById('btnCaptainCompleteTrip').classList.remove('hidden');
  document.getElementById('tripLiveStatusPill').innerText = "الرحلة جارية نحو الوجهة 🟢";
  alert("🚀 إشعار فوري: بدأت الرحلة بسلامة الله نحو الوجهة!");
}

function captainCompleteTrip() {
  if (DB.customerWallet >= activeTripData.fare) {
    DB.customerWallet -= activeTripData.fare;
  }
  saveSystemDB(DB);
  document.getElementById('navCustomerWallet').innerText = DB.customerWallet.toFixed(2);
  resetCaptain();
  document.getElementById('btnRequestRide').disabled = false;
  document.getElementById('btnRequestRide').innerHTML = `<i class="fa-solid fa-bolt"></i> طلب الرحلة فوراً في سوهاج`;
  document.getElementById('customerDriverCard').classList.add('hidden');
  document.getElementById('custStatusBadge').innerText = "اكتملت الرحلة";
  alert(`✅ تم إنهاء الرحلة وتحصيل ${activeTripData.fare} ج.م`);
}

function resetCaptain() {
  stopIncomingTripAlert();
  document.getElementById('driverOfferBox').classList.add('hidden');
  document.getElementById('driverActiveTripBox').classList.add('hidden');
  document.getElementById('driverIdleBox').classList.remove('hidden');
}

// ==========================================
// 8. إدارة المركبات (رفع الصور وتعديل الأسعار)
// ==========================================
function handleVehImgChange(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const target = 180;
      canvas.width = target;
      canvas.height = target;
      const minD = Math.min(img.width, img.height);
      canvas.getContext('2d').drawImage(img, (img.width-minD)/2, (img.height-minD)/2, minD, minD, 0, 0, target, target);
      const dataUrl = canvas.toDataURL('image/webp', 0.85);
      document.getElementById('vehImgBase64').value = dataUrl;
      document.getElementById('vehImgPreviewBox').innerHTML = `<img src="${dataUrl}" class="w-full h-full object-cover">`;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function handleSaveVehicleData(e) {
  e.preventDefault();
  const id = document.getElementById('vehEditId').value;
  const name = document.getElementById('vehNameInput').value;
  const baseFare = parseFloat(document.getElementById('vehBaseFareInput').value) || 10;
  const perKm = parseFloat(document.getElementById('vehPerKmInput').value) || 3.5;
  const waiting = parseFloat(document.getElementById('vehWaitingInput').value) || 0.75;
  const image = document.getElementById('vehImgBase64').value || null;

  if (id) {
    const v = DB.vehicles.find(x => x.id === id);
    if (v) {
      v.name = name;
      v.baseFare = baseFare;
      v.perKm = perKm;
      v.waitingRate = waiting;
      if (image) v.image = image;
    }
  } else {
    DB.vehicles.push({
      id: 'veh-' + Date.now(),
      name,
      baseFare,
      perKm,
      waitingRate: waiting,
      multiplier: 1.0,
      icon: 'fa-solid fa-car',
      image,
      enabled: true
    });
  }
  saveSystemDB(DB);
  renderAdminVehicles();
  renderCustomerVehicles();
  closeAddVehicleModal();
  alert("تم حفظ بيانات المركبة بنجاح!");
}

function renderAdminVehicles() {
  const table = document.getElementById('adminVehiclesTable');
  if (!table) return;
  table.innerHTML = DB.vehicles.map(v => `
    <tr class="hover:bg-slate-50 border-b">
      <td class="p-3 font-bold flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-slate-100 border overflow-hidden flex items-center justify-center">
          ${v.image ? `<img src="${v.image}" class="w-full h-full object-cover">` : `<i class="${v.icon}"></i>`}
        </div>
        ${v.name}
      </td>
      <td class="p-3 font-bold text-emerald-700">${v.baseFare} ج.م</td>
      <td class="p-3 font-bold text-blue-700">${v.perKm} ج.م</td>
      <td class="p-3 font-bold text-amber-700">${v.waitingRate} ج.م</td>
      <td class="p-3">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${v.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
          ${v.enabled ? 'مفعل' : 'معطل'}
        </span>
      </td>
      <td class="p-3 text-center space-x-1 space-x-reverse">
        <button onclick="editVehicle('${v.id}')" class="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-bold">تعديل</button>
        <button onclick="toggleVehicle('${v.id}')" class="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded text-xs font-bold">${v.enabled ? 'إيقاف' : 'تشغيل'}</button>
      </td>
    </tr>
  `).join('');
}

function editVehicle(id) {
  const v = DB.vehicles.find(x => x.id === id);
  if (!v) return;
  document.getElementById('vehEditId').value = v.id;
  document.getElementById('vehNameInput').value = v.name;
  document.getElementById('vehBaseFareInput').value = v.baseFare;
  document.getElementById('vehPerKmInput').value = v.perKm;
  document.getElementById('vehWaitingInput').value = v.waitingRate;
  document.getElementById('vehImgBase64').value = v.image || '';
  document.getElementById('vehImgPreviewBox').innerHTML = v.image ? `<img src="${v.image}" class="w-full h-full object-cover">` : `<i class="${v.icon} text-2xl text-slate-300"></i>`;
  document.getElementById('addVehicleModal').classList.remove('hidden');
}

function toggleVehicle(id) {
  const v = DB.vehicles.find(x => x.id === id);
  if (v) {
    v.enabled = !v.enabled;
    saveSystemDB(DB);
    renderAdminVehicles();
    renderCustomerVehicles();
  }
}

function openAddVehicleModal() {
  document.getElementById('vehEditId').value = '';
  document.getElementById('vehNameInput').value = '';
  document.getElementById('vehBaseFareInput').value = 10;
  document.getElementById('vehPerKmInput').value = 3.5;
  document.getElementById('vehWaitingInput').value = 0.75;
  document.getElementById('vehImgBase64').value = '';
  document.getElementById('vehImgPreviewBox').innerHTML = `<i class="fa-solid fa-cloud-arrow-up text-2xl text-slate-300"></i>`;
  document.getElementById('addVehicleModal').classList.remove('hidden');
}

function closeAddVehicleModal() {
  document.getElementById('addVehicleModal').classList.add('hidden');
}

// ==========================================
// 9. لوحة الأدمن، بوابات الدفع، والتنقل
// ==========================================
function switchAdminSubTab(tab) {
  document.querySelectorAll('.admin-tab-btn').forEach(b => {
    b.className = "admin-tab-btn flex-1 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition flex items-center justify-center gap-1.5";
  });
  ['vehicles', 'payments', 'patches'].forEach(t => {
    document.getElementById(`admin-subtab-${t}`)?.classList.add('hidden');
  });
  document.getElementById(`btn-admin-${tab}`).className = "admin-tab-btn flex-1 py-2.5 rounded-xl bg-emerald-600 text-white transition flex items-center justify-center gap-1.5";
  document.getElementById(`admin-subtab-${tab}`).classList.remove('hidden');

  if (tab === 'vehicles') renderAdminVehicles();
  if (tab === 'payments') renderPayments();
  if (tab === 'patches') renderPatches();
}

function renderPayments() {
  const grid = document.getElementById('adminPaymentMethodsGrid');
  if (!grid) return;
  grid.innerHTML = DB.paymentGateways.map(g => `
    <div class="p-3 border rounded-xl bg-slate-50 space-y-1">
      <div class="font-bold">${g.name}</div>
      <input type="text" value="${g.account}" class="w-full border p-1 rounded font-mono text-xs">
    </div>
  `).join('');
}

function savePaymentSettings() {
  alert("تم حفظ إعدادات بوابات الدفع بنجاح!");
}

function openWalletModal() {
  document.getElementById('customerPaymentOptions').innerHTML = DB.paymentGateways.map(g => `
    <label class="flex justify-between p-2 border rounded-xl font-bold cursor-pointer">
      <span class="flex items-center gap-2"><input type="radio" name="w" checked> ${g.name}</span>
      <span class="font-mono text-emerald-700">${g.account}</span>
    </label>
  `).join('');
  document.getElementById('walletModal').classList.remove('hidden');
}

function closeWalletModal() {
  document.getElementById('walletModal').classList.add('hidden');
}

function confirmCustomerRecharge() {
  const amount = parseFloat(document.getElementById('walletRechargeAmount').value) || 50;
  DB.customerWallet += amount;
  saveSystemDB(DB);
  document.getElementById('navCustomerWallet').innerText = DB.customerWallet.toFixed(2);
  closeWalletModal();
  alert(`✅ تم شحن رصيدك بنجاح بمبلغ ${amount} ج.م!`);
}

function openChatModal() { document.getElementById('chatModal').classList.remove('hidden'); }
function closeChatModal() { document.getElementById('chatModal').classList.add('hidden'); }
function handleSendChatMessage(e) {
  e.preventDefault();
  const inp = document.getElementById('chatInputText');
  document.getElementById('chatMessagesBox').innerHTML += `
    <div class="bg-emerald-600 text-white p-2 rounded-xl max-w-[80%] mr-auto text-xs shadow">${inp.value}</div>
  `;
  inp.value = '';
}

function startVoiceCall() { document.getElementById('voiceCallModal').classList.remove('hidden'); }
function endVoiceCall() { document.getElementById('voiceCallModal').classList.add('hidden'); }
function openRejectReasonModal() { document.getElementById('rejectReasonModal').classList.remove('hidden'); }
function closeRejectReasonModal() { document.getElementById('rejectReasonModal').classList.add('hidden'); }
function confirmRejectTrip() {
  stopIncomingTripAlert();
  closeRejectReasonModal();
  resetCaptain();
  alert("تم تسجيل رفض المشوار.");
}

function navigate(tab) {
  document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.remove('bg-white', 'text-emerald-700', 'shadow');
    b.classList.add('text-white');
  });
  document.getElementById(`view-${tab}`).classList.remove('hidden');
  document.getElementById(`nav-${tab}`).classList.add('bg-white', 'text-emerald-700', 'shadow');

  if (tab === 'customer') {
    setTimeout(() => {
      initSohagMap();
      if (map) map.invalidateSize();
    }, 200);
  }
  if (tab === 'admin') {
    renderAdminVehicles();
  }
}

// 10. تثبيت تطبيق الـ PWA
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

function installPWAApp() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt = null;
  } else {
    alert('📲 لتثبيت التطبيق على هاتفك:\n• اضغط على خيارات المتصفح (⋮) ثم اختر "إضافة إلى الشاشة الرئيسية" أو "تثبيت التطبيق".');
  }
}

// ==========================================
// 11. التشغيل المبدئي للبرنامج عند التحميل
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  initSohagMap();
  renderCustomerVehicles();
  document.getElementById('navCustomerWallet').innerText = DB.customerWallet.toFixed(2);
  
  // تشغيل وحقن الباتشات البرمجية فورياً
  applyAllPatches();
});
