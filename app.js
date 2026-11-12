<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title id="htmlAppTitle">توصيلة سوهاج - Tawsila Super App</title>

  <!-- PWA Manifest -->
  <link rel="manifest" href='data:application/manifest+json,{"name":"توصيلة سوهاج","short_name":"توصيلة","start_url":"https://tawsilag-droid.github.io/Taksib_go/","display":"standalone","background_color":"#059669","theme_color":"#059669","icons":[{"src":"https://cdn-icons-png.flaticon.com/512/3202/3202926.png","sizes":"512x512","type":"image/png"}]}'>
  <link id="appFavicon" rel="icon" type="image/png" href="https://cdn-icons-png.flaticon.com/512/3202/3202926.png">
  <meta name="theme-color" content="#059669">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">

  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>

  <!-- خريطة Leaflet -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

  <!-- الخطوط والأيقونات -->
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Fira+Code:wght@400;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

  <!-- مكتبات Firebase -->
  <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>

  <style>
    body { font-family: 'Cairo', sans-serif; }
    .font-code { font-family: 'Fira Code', monospace; }
    #map { height: 420px; width: 100%; border-radius: 1.25rem; z-index: 10; }
    @keyframes pulse-ring {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 16px rgba(220, 38, 38, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
    }
    .incoming-alert { animation: pulse-ring 1.5s infinite; }
  </style>
</head>
<body class="bg-slate-100 text-slate-800 antialiased min-h-screen flex flex-col justify-between">

  <!-- حاوية الباتشات المحقونة ديناميكياً -->
  <div id="patchHtmlContainer"></div>

  <!-- الشريط الإعلاني العام (تنبيهات الأدمن) -->
  <div id="appBroadcastBar" class="hidden bg-amber-400 text-slate-900 px-4 py-1.5 text-xs font-black text-center shadow flex items-center justify-center gap-2">
    <i class="fa-solid fa-bullhorn animate-bounce"></i>
    <span id="appBroadcastText">مرحباً بكم في تطبيق توصيلة سوهاج!</span>
  </div>

  <!-- شريط التنقل العلوي -->
  <header class="bg-emerald-600 text-white shadow-lg sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-3">
      <div class="flex items-center gap-3 cursor-pointer" onclick="navigate('customer')">
        <div id="headerLogoContainer" class="w-10 h-10 bg-white text-emerald-600 rounded-xl flex items-center justify-center font-black text-2xl shadow overflow-hidden">
          <span id="headerLogoFallback">ت</span>
          <img id="headerLogoImg" src="" class="hidden w-full h-full object-cover">
        </div>
        <div>
          <h1 id="headerAppName" class="text-xl font-black tracking-wide">توصيلة سوهاج</h1>
          <p class="text-[11px] text-emerald-100">خدمة المشاوير والنقل الذكي الفوري</p>
        </div>
      </div>

      <!-- الإجراءات السريعة والمحفظة -->
      <div class="flex items-center gap-2">
        <button onclick="shareAppUrl()" class="bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border border-emerald-400/30" title="مشاركة رابط التطبيق">
          <i class="fa-solid fa-share-nodes"></i> مشاركة
        </button>

        <button onclick="installPWAApp()" id="btnInstallApp" class="bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow transition">
          <i class="fa-solid fa-mobile-screen-button"></i> تحميل التطبيق 📲
        </button>

        <div class="flex items-center gap-1.5 bg-emerald-800/80 px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-400/30">
          <i class="fa-solid fa-wallet text-amber-300"></i>
          <span>رصيدك: <b id="navCustomerWallet" class="text-amber-300 font-black">150.00</b> ج.م</span>
          <button onclick="openWalletModal()" class="bg-emerald-500 hover:bg-emerald-400 text-white px-2 py-0.5 rounded text-[10px] ml-1">شحن +</button>
        </div>

        <div id="userProfileBadge" class="hidden items-center gap-2 bg-emerald-900/60 border border-emerald-400/30 px-2 py-1 rounded-xl">
          <img id="userAvatarImg" src="" class="w-6 h-6 rounded-full border">
          <span id="userNameText" class="text-xs font-bold truncate max-w-[80px]"></span>
          <button onclick="logoutFirebase()" class="text-rose-300 hover:text-rose-100 text-[10px]" title="تسجيل الخروج"><i class="fa-solid fa-power-off"></i></button>
        </div>
      </div>

      <!-- أزرار التبديل -->
      <nav class="flex items-center bg-emerald-700/80 p-1 rounded-2xl gap-1 text-xs font-bold">
        <button onclick="navigate('customer')" id="nav-customer" class="nav-btn px-3 py-1.5 rounded-xl transition bg-white text-emerald-700 shadow">
          <i class="fa-solid fa-street-view ml-1"></i> العميل
        </button>
        <button onclick="navigate('driver')" id="nav-driver" class="nav-btn px-3 py-1.5 rounded-xl transition text-white hover:bg-emerald-600">
          <i class="fa-solid fa-taxi ml-1"></i> الكابتن
        </button>
        <button onclick="requestAdminAccess()" id="nav-admin" class="nav-btn px-3 py-1.5 rounded-xl transition text-amber-300 hover:bg-emerald-600">
          <i class="fa-solid fa-shield-halved ml-1"></i> لوحة الأدمن 🔒
        </button>
        <button onclick="navigate('auth')" id="nav-auth" class="nav-btn px-3 py-1.5 rounded-xl transition text-white hover:bg-emerald-600">
          <i class="fa-solid fa-user-lock ml-1"></i> الدخول / جوجل
        </button>
      </nav>
    </div>
  </header>

  <!-- المحتوى الرئيسي -->
  <main class="max-w-7xl mx-auto px-4 py-5 w-full flex-grow">

    <!-- 1. واجهة العميل -->
    <section id="view-customer" class="page-view grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="bg-white p-5 rounded-2xl shadow-xl border border-slate-200 flex flex-col justify-between space-y-4">
        <div>
          <div class="flex justify-between items-center mb-2">
            <h2 class="text-base font-black text-slate-800 flex items-center gap-2">
              <i class="fa-solid fa-location-dot text-emerald-600"></i> احجز مشوارك الآن
            </h2>
            <span class="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full" id="custStatusBadge">جاهز للطلب</span>
          </div>

          <div class="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-xs flex items-center justify-between mb-3 text-emerald-900">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-taxi text-emerald-600 text-base"></i>
              <div>
                <p class="font-bold" id="nearestCaptainText">أقرب كابتن يبعد: 1.2 كم</p>
                <p class="text-[10px] text-emerald-700">الكابتن متواجد ومتاح للخدمة</p>
              </div>
            </div>
            <span class="bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-[10px]">3 دقائق</span>
          </div>

          <div class="space-y-3 text-xs">
            <!-- مكان الركوب -->
            <div class="relative">
              <div class="flex justify-between items-center mb-1">
                <label class="font-bold text-slate-600">مكان الركوب الحالي</label>
                <button onclick="getCurrentLocationSohag()" class="text-[10px] text-emerald-700 hover:underline font-bold flex items-center gap-1">
                  <i class="fa-solid fa-crosshairs"></i> موقعي الحالي (GPS)
                </button>
              </div>
              <div class="flex items-center border rounded-xl p-2.5 bg-slate-50 focus-within:border-emerald-500 focus-within:bg-white transition">
                <i class="fa-solid fa-circle-dot text-emerald-600 ml-2"></i>
                <input type="text" id="pickupInput" placeholder="اكتب مكان الركوب..." 
                       oninput="handleSearchSuggestions(this.value, 'pickup')" class="bg-transparent w-full outline-none font-bold text-slate-800">
              </div>
              <div id="pickupSuggestions" class="hidden absolute top-full right-0 left-0 bg-white border border-slate-200 rounded-xl shadow-2xl mt-1 max-h-48 overflow-y-auto z-40 divide-y divide-slate-100"></div>
            </div>

            <!-- جهة الوصول -->
            <div class="relative">
              <label class="font-bold text-slate-600 mb-1 block">جهة الوصول</label>
              <div class="flex items-center border rounded-xl p-2.5 bg-slate-50 focus-within:border-emerald-500 focus-within:bg-white transition">
                <i class="fa-solid fa-location-pin text-rose-600 ml-2"></i>
                <input type="text" id="dropoffInput" placeholder="اكتب الوجهة..." 
                       oninput="handleSearchSuggestions(this.value, 'dropoff')" class="bg-transparent w-full outline-none font-bold text-slate-800">
              </div>
              <div id="dropoffSuggestions" class="hidden absolute top-full right-0 left-0 bg-white border border-slate-200 rounded-xl shadow-2xl mt-1 max-h-48 overflow-y-auto z-40 divide-y divide-slate-100"></div>
            </div>

            <!-- فئة وسيلة النقل -->
            <div>
              <label class="font-bold text-slate-600 mb-1.5 block">فئة وسيلة النقل</label>
              <div id="vehicleTypesGrid" class="grid grid-cols-3 gap-2"></div>
            </div>

            <!-- تسريع القبول (زيادة الأجرة) -->
            <div class="bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
              <div class="flex justify-between items-center mb-1">
                <span class="font-bold text-amber-900 text-xs">🚀 زيادة الأجرة لتسريع قبول الكابتن:</span>
                <span id="extraFareBadge" class="text-xs font-black text-amber-700">+0 ج.م</span>
              </div>
              <div class="flex gap-1.5">
                <button onclick="setExtraFare(0)" class="flex-1 py-1 bg-white border border-amber-300 rounded-lg font-bold text-slate-700 hover:bg-amber-100 text-xs">عادي</button>
                <button onclick="setExtraFare(5)" class="flex-1 py-1 bg-white border border-amber-300 rounded-lg font-bold text-slate-700 hover:bg-amber-100 text-xs">+5 ج.م</button>
                <button onclick="setExtraFare(10)" class="flex-1 py-1 bg-white border border-amber-300 rounded-lg font-bold text-slate-700 hover:bg-amber-100 text-xs">+10 ج.م</button>
                <button onclick="setExtraFare(20)" class="flex-1 py-1 bg-white border border-amber-300 rounded-lg font-bold text-slate-700 hover:bg-amber-100 text-xs">+20 ج.م</button>
              </div>
            </div>

            <!-- ملخص السعر المقدر -->
            <div class="bg-slate-900 text-white p-3.5 rounded-xl space-y-1.5">
              <div class="flex justify-between text-slate-300 text-xs">
                <span>المسافة: <b id="calcDistanceText" class="text-white">4.5 كم</b></span>
                <span>المركبة: <b id="calcVehicleTypeText" class="text-emerald-400">سيارة</b></span>
              </div>
              <div class="border-t border-slate-800 pt-1.5 flex justify-between items-center">
                <span class="font-bold text-xs">الأجرة المقدرة:</span>
                <span id="calcTotalFareText" class="text-xl font-black text-emerald-400">25.75 ج.م</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <button onclick="handleCustomerRequestRide()" id="btnRequestRide" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm">
            <i class="fa-solid fa-bolt"></i> طلب المشوار فوراً
          </button>

          <!-- بطاقة بيانات الكابتن -->
          <div id="customerDriverCard" class="hidden mt-3 bg-emerald-50 border border-emerald-300 p-3.5 rounded-xl space-y-2.5">
            <div class="flex items-center justify-between border-b border-emerald-200 pb-2">
              <div class="flex items-center gap-2">
                <div class="w-9 h-9 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  <i class="fa-solid fa-user-check"></i>
                </div>
                <div>
                  <h4 class="font-bold text-slate-800 text-xs" id="driverCardName">الكابتن: أحمد البدري</h4>
                  <p class="text-[10px] text-emerald-700 font-semibold">تقييم: 4.9 ⭐ (كابتن معتمد)</p>
                </div>
              </div>
              <span id="tripLiveStatusPill" class="text-[10px] font-black bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">في الطريق إليك</span>
            </div>

            <div class="text-xs space-y-1 text-slate-700">
              <p>🚘 <b>المركبة:</b> <span id="driverCardCar" class="text-slate-900 font-bold">شيري أريزو 5</span></p>
              <p>🔢 <b>رقم اللوحة:</b> <span id="driverCardPlate" class="bg-white px-2 py-0.5 rounded border border-slate-300 font-bold">هـ ص ج 4589</span></p>
              <p>📞 <b>الهاتف:</b> <span id="driverCardPhone" class="font-bold text-emerald-800 font-mono">متاح عبر الشات والمكالمات</span></p>
            </div>

            <div class="grid grid-cols-2 gap-2 pt-1">
              <button onclick="startVoiceCall('driver')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow">
                <i class="fa-solid fa-phone-volume"></i> اتصال صوتي
              </button>
              <button onclick="openChatModal('customer')" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow">
                <i class="fa-solid fa-comments"></i> شات ومراسلة
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- خريطة الشوارع التفاعلية -->
      <div class="lg:col-span-2 bg-white p-4 rounded-2xl shadow-xl border border-slate-200 flex flex-col justify-between">
        <div class="flex justify-between items-center mb-2 px-1 text-xs text-slate-500">
          <span><i class="fa-solid fa-map-location-dot text-emerald-600 ml-1"></i> خريطة الشوارع والميادين المباشرة</span>
          <span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Live GPS Tracker</span>
        </div>
        <div id="map"></div>
      </div>
    </section>

    <!-- 2. واجهة الكابتن -->
    <section id="view-driver" class="page-view hidden max-w-xl mx-auto space-y-4">

      <!-- إذا كان الكابتن غير مسجل أو أوراقه تحت الفحص -->
      <div id="captainRegistrationSection" class="hidden bg-white p-5 rounded-2xl shadow-xl border border-slate-200 space-y-4">
        <div class="text-center space-y-1 border-b pb-3">
          <div class="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center mx-auto text-xl shadow">
            <i class="fa-solid fa-id-card"></i>
          </div>
          <h2 class="font-black text-base text-slate-800">انضم كأسطول كباتن التوصيل</h2>
          <p class="text-xs text-slate-500">سجل بياناتك وارفع مستنداتك لبدء استقبال المشاوير وتحقيق الأرباح</p>
        </div>

        <div id="captainPendingNotice" class="hidden p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2">
          <div class="flex items-center gap-2 font-bold">
            <i class="fa-solid fa-clock-rotate-left text-amber-600 text-base"></i>
            <span>طلبك قيد المراجعة والتدقيق من إدارة التطبيق!</span>
          </div>
          <p class="text-[11px] text-amber-800">سيتم مراجعة صور بطاقتك والرخصة وتفعيل حسابك خلال ساعات وجيزة.</p>
        </div>

        <form id="captainRegForm" onsubmit="handleCaptainRegistration(event)" class="space-y-3 text-xs">
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="font-bold text-slate-700 mb-1 block">الاسم الكامل الرباعي</label>
              <input type="text" id="regCaptainName" required placeholder="أحمد البدري..." class="w-full border rounded-xl p-2.5 font-bold outline-none">
            </div>
            <div>
              <label class="font-bold text-slate-700 mb-1 block">رقم الهاتف المحمول</label>
              <input type="tel" id="regCaptainPhone" required placeholder="010..." class="w-full border rounded-xl p-2.5 font-bold outline-none font-mono">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="font-bold text-slate-700 mb-1 block">نوع وسيلة النقل</label>
              <select id="regCaptainVehicleType" class="w-full border rounded-xl p-2.5 font-bold outline-none"></select>
            </div>
            <div>
              <label class="font-bold text-slate-700 mb-1 block">رقم اللوحة المعدنية</label>
              <input type="text" id="regCaptainPlate" required placeholder="هـ ص ج 1234" class="w-full border rounded-xl p-2.5 font-bold outline-none">
            </div>
          </div>

          <!-- رفع المستندات والصور (أمامي وخلفي) -->
          <div class="grid grid-cols-2 gap-2.5 pt-1">
            <!-- البطاقة أمام -->
            <div class="border-2 border-dashed border-slate-300 rounded-xl p-2.5 text-center bg-slate-50">
              <span class="font-bold text-slate-700 block mb-1">بطاقة الرقم القومي (وجه)</span>
              <div id="preview-id-front" class="h-16 w-full bg-white rounded border flex items-center justify-center overflow-hidden mb-1.5 text-slate-300">
                <i class="fa-solid fa-id-card text-2xl"></i>
              </div>
              <label class="cursor-pointer bg-slate-800 hover:bg-slate-900 text-white px-2 py-1 rounded text-[10px] font-bold block">
                رفع الوجه الأمامي
                <input type="file" accept="image/*" class="hidden" required onchange="handleDocUpload(event, 'id-front')">
              </label>
            </div>

            <!-- البطاقة ظهر -->
            <div class="border-2 border-dashed border-slate-300 rounded-xl p-2.5 text-center bg-slate-50">
              <span class="font-bold text-slate-700 block mb-1">بطاقة الرقم القومي (ظهر)</span>
              <div id="preview-id-back" class="h-16 w-full bg-white rounded border flex items-center justify-center overflow-hidden mb-1.5 text-slate-300">
                <i class="fa-solid fa-id-card text-2xl"></i>
              </div>
              <label class="cursor-pointer bg-slate-800 hover:bg-slate-900 text-white px-2 py-1 rounded text-[10px] font-bold block">
                رفع الوجه الخلفي
                <input type="file" accept="image/*" class="hidden" required onchange="handleDocUpload(event, 'id-back')">
              </label>
            </div>

            <!-- رخصة القيادة -->
            <div class="border-2 border-dashed border-slate-300 rounded-xl p-2.5 text-center bg-slate-50">
              <span class="font-bold text-slate-700 block mb-1">رخصة القيادة السارية</span>
              <div id="preview-license-drive" class="h-16 w-full bg-white rounded border flex items-center justify-center overflow-hidden mb-1.5 text-slate-300">
                <i class="fa-solid fa-address-card text-2xl"></i>
              </div>
              <label class="cursor-pointer bg-slate-800 hover:bg-slate-900 text-white px-2 py-1 rounded text-[10px] font-bold block">
                رفع رخصة القيادة
                <input type="file" accept="image/*" class="hidden" required onchange="handleDocUpload(event, 'license-drive')">
              </label>
            </div>

            <!-- رخصة المركبة -->
            <div class="border-2 border-dashed border-slate-300 rounded-xl p-2.5 text-center bg-slate-50">
              <span class="font-bold text-slate-700 block mb-1">رخصة تسيير المركبة</span>
              <div id="preview-license-car" class="h-16 w-full bg-white rounded border flex items-center justify-center overflow-hidden mb-1.5 text-slate-300">
                <i class="fa-solid fa-car-side text-2xl"></i>
              </div>
              <label class="cursor-pointer bg-slate-800 hover:bg-slate-900 text-white px-2 py-1 rounded text-[10px] font-bold block">
                رفع رخصة السيارة
                <input type="file" accept="image/*" class="hidden" required onchange="handleDocUpload(event, 'license-car')">
              </label>
            </div>
          </div>

          <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl shadow-lg text-xs transition">
            إرسال طلب التسجيل والمستندات للمراجعة
          </button>
        </form>
      </div>

      <!-- لوحة العمل الرئيسية للكابتن المعتمد -->
      <div id="captainWorkSection" class="bg-white p-5 rounded-2xl shadow-xl border border-slate-200">
        <div class="flex justify-between items-center border-b pb-3 mb-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center text-xl font-bold shadow">
              <i class="fa-solid fa-taxi"></i>
            </div>
            <div>
              <h2 id="activeCaptainName" class="font-bold text-base text-slate-800">الكابتن: أحمد البدري</h2>
              <p class="text-xs text-slate-500">
                الرصيد: <b class="text-emerald-600 font-bold" id="driverWalletEGP">450.00 ج.م</b>
                <button onclick="openCaptainWithdrawModal()" class="text-blue-600 hover:underline mr-1 font-bold">سحب أرباح 💸</button>
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="testDriverAlertSound()" title="فحص رنين المشاوير" class="bg-amber-100 hover:bg-amber-200 text-amber-800 px-2.5 py-1 rounded-lg text-xs font-bold border border-amber-300 flex items-center gap-1 transition">
              <i class="fa-solid fa-volume-high"></i> فحص الصوت
            </button>
            <span class="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-300">متصل (Online)</span>
          </div>
        </div>

        <!-- إشعار الرحلة الواردة للكابتن -->
        <div id="driverOfferBox" class="hidden p-5 rounded-2xl border-2 border-rose-500 bg-rose-50 incoming-alert space-y-4">
          <div class="flex justify-between items-center">
            <span class="bg-rose-600 text-white text-xs px-3 py-1 rounded-full font-black animate-pulse flex items-center gap-1">
              <i class="fa-solid fa-bell"></i> مشوار جديد وارد الآن!
            </span>
            <div class="flex items-center gap-1 text-rose-700 font-black text-sm bg-white px-3 py-1 rounded-xl shadow-sm border border-rose-200">
              <i class="fa-solid fa-stopwatch text-base animate-spin"></i>
              <span id="countdownTimer">25</span> ثانية
            </div>
          </div>

          <div class="bg-rose-200/60 text-rose-900 px-3 py-1.5 rounded-lg text-[11px] font-black flex items-center justify-between">
            <span><i class="fa-solid fa-volume-high animate-bounce ml-1"></i> السارينة وقراءة المشوار تعملان بأعلى صوت...</span>
            <button onclick="stopIncomingTripAlert()" class="text-rose-700 hover:underline font-bold text-[10px]">كتم الصوت 🔇</button>
          </div>

          <div class="bg-white p-3 rounded-xl border border-rose-200 space-y-1.5 text-xs">
            <p>📍 <b>الركوب:</b> <span id="offerFromText" class="font-bold">ميدان الثقافة</span></p>
            <p>🏁 <b>الوجهة:</b> <span id="offerToText" class="font-bold">كورنيش النيل</span></p>
            <p>🛵 <b>المركبة:</b> <span id="offerVehicleText" class="font-bold text-emerald-700">سيارة ملاكي</span></p>
            <div class="border-t pt-1.5 flex justify-between items-center">
              <span class="font-bold text-slate-700">الأجرة الإجمالية:</span>
              <span id="offerFareText" class="text-lg font-black text-emerald-600">25.75 ج.م</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 pt-1">
            <button onclick="captainAcceptTrip()" class="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl text-xs shadow flex items-center justify-center gap-1.5">
              <i class="fa-solid fa-check-circle"></i> قبول المشوار
            </button>
            <button onclick="openRejectReasonModal()" class="bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-3 rounded-xl text-xs shadow flex items-center justify-center gap-1.5">
              <i class="fa-solid fa-circle-xmark"></i> رفض مع السبب
            </button>
          </div>
        </div>

        <!-- مراحل تنفيذ المشوار -->
        <div id="driverActiveTripBox" class="hidden space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div class="flex justify-between items-center text-xs font-bold text-slate-800">
            <span id="driverTripPhaseText">المرحلة: التوجه إلى موقع الركوب</span>
            <span class="text-emerald-700 font-extrabold" id="driverActiveTripFare">الأجرة: 0 ج.م</span>
          </div>

          <div class="space-y-2">
            <button onclick="captainNotifyArrived()" id="btnCaptainArrived" class="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-black py-3 rounded-xl shadow flex items-center justify-center gap-2">
              <i class="fa-solid fa-location-dot"></i> تم الوصول للعميل (إشعار العميل)
            </button>
            <button onclick="captainStartTrip()" id="btnCaptainStartTrip" class="hidden w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-3 rounded-xl shadow flex items-center justify-center gap-2">
              <i class="fa-solid fa-play"></i> بدء الرحلة الآن (إشعار منبثق)
            </button>
            <button onclick="captainCompleteTrip()" id="btnCaptainCompleteTrip" class="hidden w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-black py-3 rounded-xl shadow flex items-center justify-center gap-2">
              <i class="fa-solid fa-flag-checkered"></i> إنهاء الرحلة وتحصيل المبلغ
            </button>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-2 border-t">
            <button onclick="startVoiceCall('customer')" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1 shadow">
              <i class="fa-solid fa-phone"></i> اتصال بالعميل
            </button>
            <button onclick="openChatModal('driver')" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1 shadow">
              <i class="fa-solid fa-comments"></i> شات مع العميل
            </button>
          </div>
        </div>

        <div id="driverIdleBox" class="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
          <i class="fa-solid fa-satellite-dish text-3xl text-emerald-500 animate-pulse mb-2"></i>
          <p class="text-xs font-bold">بانتظار طلبات مشاوير جديدة...</p>
        </div>
      </div>
    </section>

    <!-- 3. لوحة تحكم الأدمن (محمية ومطورة) -->
    <section id="view-admin" class="page-view hidden space-y-6">
      
      <!-- شريط تبويبات الأدمن -->
      <div class="flex overflow-x-auto border-b border-slate-200 bg-white p-2 rounded-2xl shadow-sm gap-2 text-xs font-bold scrollbar-none">
        <button onclick="switchAdminSubTab('dashboard')" id="btn-admin-dashboard" class="admin-tab-btn flex-shrink-0 px-4 py-2.5 rounded-xl bg-emerald-600 text-white transition flex items-center gap-1.5">
          <i class="fa-solid fa-chart-pie"></i> لوحة الإحصائيات
        </button>
        <button onclick="switchAdminSubTab('identity')" id="btn-admin-identity" class="admin-tab-btn flex-shrink-0 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5">
          <i class="fa-solid fa-paintbrush"></i> هوية التطبيق والشعار
        </button>
        <button onclick="switchAdminSubTab('captains')" id="btn-admin-captains" class="admin-tab-btn flex-shrink-0 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5">
          <i class="fa-solid fa-id-card-clip"></i> طلبات وثائق الكباتن <span id="adminPendingBadge" class="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full hidden">0</span>
        </button>
        <button onclick="switchAdminSubTab('vehicles')" id="btn-admin-vehicles" class="admin-tab-btn flex-shrink-0 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5">
          <i class="fa-solid fa-motorcycle"></i> الأسطول والتسعير
        </button>
        <button onclick="switchAdminSubTab('payments')" id="btn-admin-payments" class="admin-tab-btn flex-shrink-0 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5">
          <i class="fa-solid fa-money-bill-transfer"></i> الشحن والسحب
        </button>
        <button onclick="switchAdminSubTab('patches')" id="btn-admin-patches" class="admin-tab-btn flex-shrink-0 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5">
          <i class="fa-solid fa-terminal text-amber-500"></i> حاقن الباتشات 🧩
        </button>
      </div>

      <!-- تبويب 1: الإحصائيات الحية ونسبة العمولة -->
      <div id="admin-subtab-dashboard" class="space-y-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <span class="text-xs text-slate-500 font-bold block mb-1">إجمالي الرحلات</span>
            <b id="kpiTotalTrips" class="text-2xl font-black text-slate-800">128</b>
          </div>
          <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <span class="text-xs text-slate-500 font-bold block mb-1">أرباح المنصة المقدرة</span>
            <b id="kpiTotalPlatformProfit" class="text-2xl font-black text-emerald-600">680.00 ج.م</b>
          </div>
          <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <span class="text-xs text-slate-500 font-bold block mb-1">الكباتن المعتمدين</span>
            <b id="kpiActiveCaptainsCount" class="text-2xl font-black text-blue-600">8</b>
          </div>
          <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <span class="text-xs text-slate-500 font-bold block mb-1">نسبة عمولة التطبيق</span>
            <div class="flex items-center gap-1">
              <input type="number" id="settingCommissionRate" class="w-16 border rounded p-1 font-bold text-center text-sm" value="15">
              <button onclick="saveCommissionSetting()" class="bg-emerald-600 text-white px-2 py-1 rounded text-[11px] font-bold">حفظ %</button>
            </div>
          </div>
        </div>

        <!-- شريط الإعلانات والرسائل العامة -->
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
          <h3 class="font-black text-sm text-slate-800">إرسال تنبيه أو إعلان عام في أعلى التطبيق</h3>
          <div class="flex gap-2">
            <input type="text" id="adminBroadcastInput" placeholder="اكتب رسالة الإعلان الترويجي أو التنبيه..." class="flex-grow border rounded-xl p-2.5 text-xs font-bold outline-none">
            <button onclick="updateBroadcastMessage()" class="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-xs font-black shadow">نشر الإعلان</button>
            <button onclick="clearBroadcastMessage()" class="bg-rose-100 hover:bg-rose-200 text-rose-800 px-3 py-2.5 rounded-xl text-xs font-black">إخفاء</button>
          </div>
        </div>
      </div>

      <!-- تبويب 2: هوية التطبيق، الشعار، الأيقونة، والرابط -->
      <div id="admin-subtab-identity" class="hidden space-y-4">
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h3 class="font-black text-sm text-slate-800 border-b pb-2">التحكم في اسم التطبيق ورابطه والهوية البصرية</h3>
          <form onsubmit="handleSaveAppIdentity(event)" class="space-y-4 text-xs">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="font-bold text-slate-700 mb-1 block">اسم التطبيق المعروض</label>
                <input type="text" id="identityAppName" required class="w-full border rounded-xl p-2.5 font-bold outline-none">
              </div>
              <div>
                <label class="font-bold text-slate-700 mb-1 block">رابط التطبيق والموقع الرسمي</label>
                <input type="url" id="identityAppUrl" required class="w-full border rounded-xl p-2.5 font-bold outline-none font-mono">
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="font-bold text-slate-700 mb-1 block">رمز PIN لحماية لوحة الأدمن (4 أرقام)</label>
                <input type="password" id="identityAdminPin" maxlength="6" required class="w-full border rounded-xl p-2.5 font-bold outline-none font-mono">
              </div>
            </div>

            <!-- رفع الشعار والأيقونة -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div class="border-2 border-dashed p-4 rounded-2xl text-center bg-slate-50 space-y-2">
                <span class="font-bold block">شعار التطبيق (Logo)</span>
                <div id="identityLogoPreview" class="w-14 h-14 mx-auto rounded-xl bg-white border flex items-center justify-center overflow-hidden">
                  <span class="text-slate-300 font-bold">ت</span>
                </div>
                <label class="cursor-pointer bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold inline-block">
                  تغيير صورة الشعار
                  <input type="file" accept="image/*" class="hidden" onchange="handleLogoUpload(event)">
                </label>
              </div>

              <div class="border-2 border-dashed p-4 rounded-2xl text-center bg-slate-50 space-y-2">
                <span class="font-bold block">أيقونة الفافيكون للتطبيق (Favicon)</span>
                <div id="identityFaviconPreview" class="w-14 h-14 mx-auto rounded-xl bg-white border flex items-center justify-center overflow-hidden">
                  <i class="fa-solid fa-mobile-screen-button text-2xl text-slate-400"></i>
                </div>
                <label class="cursor-pointer bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold inline-block">
                  تغيير الأيقونة
                  <input type="file" accept="image/*" class="hidden" onchange="handleFaviconUpload(event)">
                </label>
              </div>
            </div>

            <button type="submit" class="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-2.5 rounded-xl shadow">
              حفظ وتطبيق إعدادات الهوية
            </button>
          </form>
        </div>
      </div>

      <!-- تبويب 3: طلبات الكباتن والتحقق من الوثائق -->
      <div id="admin-subtab-captains" class="hidden space-y-4">
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-base font-black text-slate-800">مراجعة وتدقيق مستندات الكباتن</h3>
            <span class="text-xs text-slate-500">فحص البطاقة الشخصية، ورخص القيادة والسيارة</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-right border-collapse text-xs">
              <thead>
                <tr class="bg-slate-100 text-slate-600 border-b">
                  <th class="p-3">اسم الكابتن</th>
                  <th class="p-3">الهاتف واللوحة</th>
                  <th class="p-3">نوع المركبة</th>
                  <th class="p-3">فحص المستندات</th>
                  <th class="p-3">حالة الطلب</th>
                  <th class="p-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody id="adminCaptainsTable" class="divide-y divide-slate-100"></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- تبويب 4: أسطول المركبات والتسعير -->
      <div id="admin-subtab-vehicles" class="hidden space-y-4">
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-base font-black text-slate-800">إدارة أسطول المركبات والتسعير</h3>
            <button onclick="openAddVehicleModal()" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow">
              <i class="fa-solid fa-plus ml-1"></i> إضافة فئة مركبة جديدة
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-right border-collapse text-xs">
              <thead>
                <tr class="bg-slate-100 text-slate-600 border-b">
                  <th class="p-3">المركبة</th>
                  <th class="p-3">فتحة العداد</th>
                  <th class="p-3">سعر الكيلو</th>
                  <th class="p-3">دقيقة الانتظار</th>
                  <th class="p-3">الحالة</th>
                  <th class="p-3 text-center">التحكم</th>
                </tr>
              </thead>
              <tbody id="adminVehiclesTable" class="divide-y divide-slate-100"></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- تبويب 5: بوابات الشحن وطرق السحب -->
      <div id="admin-subtab-payments" class="hidden space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- بوابات شحن العملاء -->
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
            <div class="flex justify-between items-center">
              <h3 class="font-black text-sm text-slate-800">طرق شحن محافظ الركاب (Deposit)</h3>
              <button onclick="openAddGatewayModal('deposit')" class="text-emerald-700 font-bold text-xs hover:underline">+ إضافة وسيلة</button>
            </div>
            <div id="adminDepositGatewaysList" class="space-y-2"></div>
          </div>

          <!-- طرق سحب أرباح الكباتن -->
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
            <div class="flex justify-between items-center">
              <h3 class="font-black text-sm text-slate-800">طرق سحب أرباح الكباتن (Withdrawal)</h3>
              <button onclick="openAddGatewayModal('withdraw')" class="text-blue-700 font-bold text-xs hover:underline">+ إضافة وسيلة</button>
            </div>
            <div id="adminWithdrawGatewaysList" class="space-y-2"></div>
          </div>
        </div>
      </div>

      <!-- تبويب 6: مركز الباتشات البرمجية -->
      <div id="admin-subtab-patches" class="hidden space-y-4">
        <div class="bg-slate-900 text-white p-5 rounded-2xl shadow-xl flex justify-between items-center">
          <div>
            <h3 class="text-sm font-black text-amber-400"><i class="fa-solid fa-terminal ml-1"></i> محرك وحاقن الباتشات البرمجية (Live Injector)</h3>
            <p class="text-xs text-slate-400">حقن وتعديل أي كود JS / CSS / HTML لحظياً في المتصفح مع الحفظ التلقائي</p>
          </div>
          <button onclick="openNewPatchModal()" class="bg-amber-400 hover:bg-amber-500 text-slate-900 px-4 py-2 rounded-xl text-xs font-black shadow transition">
            + إضافة باتش جديد
          </button>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-md border border-slate-200">
          <div class="overflow-x-auto">
            <table class="w-full text-right border-collapse text-xs">
              <thead>
                <tr class="bg-slate-100 text-slate-600 border-b">
                  <th class="p-3">اسم الباتش</th>
                  <th class="p-3">النوع</th>
                  <th class="p-3">حالة الحقن</th>
                  <th class="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody id="patchesListTable" class="divide-y divide-slate-100"></tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. تسجيل الدخول بجوجل -->
    <section id="view-auth" class="page-view hidden max-w-md mx-auto bg-white p-6 rounded-3xl shadow-2xl border border-slate-200">
      <div class="text-center space-y-2 mb-6">
        <div class="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-3xl font-black mx-auto shadow-lg">ت</div>
        <h3 class="text-lg font-black text-slate-800">تسجيل الدخول - تطبيق النقل الذكي</h3>
        <p class="text-xs text-slate-500">حساب موحد للعملاء والكباتن</p>
      </div>

      <div class="space-y-4">
        <button onclick="loginWithGoogleFirebase()" class="w-full bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 font-black py-3 rounded-2xl shadow-sm transition flex items-center justify-center gap-3 text-xs">
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          تسجيل الدخول بضغطة زر بواسطة Google
        </button>

        <div class="text-center text-xs text-slate-400">أو يمكنك المتابعة التجريبية برقم الهاتف</div>
        <div class="space-y-3 text-xs">
          <input type="text" id="authPhoneInput" value="01012345678" class="w-full border rounded-xl p-2.5 font-bold outline-none font-mono">
          <input type="password" value="••••••" class="w-full border rounded-xl p-2.5 font-bold outline-none font-mono">
          <button onclick="navigate('customer')" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl shadow transition text-xs">
            دخول للمنصة
          </button>
        </div>
      </div>
    </section>

  </main>

  <!-- نافذة قفل الأدمن والأمان (Admin PIN Security Lock) -->
  <div id="adminAuthModal" class="hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-xs rounded-3xl p-5 space-y-4 shadow-2xl text-center text-xs">
      <div class="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center text-xl mx-auto shadow">
        <i class="fa-solid fa-lock"></i>
      </div>
      <div>
        <h3 class="font-black text-sm text-slate-800">الدخول للوحة الإدارة</h3>
        <p class="text-[11px] text-slate-500">أدخل رمز PIN السري (الافتراضي: 1234)</p>
      </div>
      <input type="password" id="adminPinInput" maxlength="6" placeholder="••••" class="w-full border rounded-xl p-3 text-center text-xl font-mono font-bold tracking-widest outline-none focus:border-emerald-600">
      <div class="flex gap-2">
        <button onclick="closeAdminAuthModal()" class="flex-1 py-2 rounded-xl border font-bold">إلغاء</button>
        <button onclick="verifyAdminPin()" class="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow">دخول</button>
      </div>
    </div>
  </div>

  <!-- نافذة فحص وثائق ومستندات الكابتن (Modal) -->
  <div id="captainDocsModal" class="hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-xl rounded-3xl p-5 space-y-4 shadow-2xl text-xs max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center border-b pb-2">
        <h3 class="font-black text-sm text-slate-800" id="docsModalCaptainName">فحص مستندات الكابتن</h3>
        <button onclick="closeCaptainDocsModal()"><i class="fa-solid fa-xmark text-lg"></i></button>
      </div>
      <div class="grid grid-cols-2 gap-3" id="docsModalImagesContainer"></div>
      <div class="flex justify-end gap-2 pt-2 border-t">
        <button onclick="closeCaptainDocsModal()" class="px-4 py-2 border rounded-xl font-bold">إغلاق</button>
      </div>
    </div>
  </div>

  <!-- نافذة إضافة وسيلة دفع / سحب -->
  <div id="addGatewayModal" class="hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-sm rounded-3xl p-5 space-y-3 shadow-2xl text-xs">
      <div class="flex justify-between items-center border-b pb-2">
        <h3 class="font-black text-sm text-slate-800" id="gatewayModalTitle">إضافة وسيلة دفع</h3>
        <button onclick="closeAddGatewayModal()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <form onsubmit="handleSaveGateway(event)" class="space-y-3">
        <input type="hidden" id="gatewayKindInput">
        <div>
          <label class="font-bold text-slate-700 mb-1 block">اسم الوسيلة (فودافون كاش، إنستاباي...)</label>
          <input type="text" id="gatewayNameInput" required class="w-full border rounded-xl p-2 font-bold outline-none">
        </div>
        <div>
          <label class="font-bold text-slate-700 mb-1 block">رقم الحساب / الرابط / المحفظة</label>
          <input type="text" id="gatewayAccountInput" required class="w-full border rounded-xl p-2 font-bold outline-none font-mono">
        </div>
        <div class="flex gap-2 pt-2">
          <button type="button" onclick="closeAddGatewayModal()" class="px-4 py-2 border rounded-xl font-bold">إلغاء</button>
          <button type="submit" class="flex-1 bg-emerald-600 text-white font-black py-2 rounded-xl shadow">حفظ الوسيلة</button>
        </div>
      </form>
    </div>
  </div>

  <!-- نافذة طلب سحب أرباح الكابتن -->
  <div id="captainWithdrawModal" class="hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 text-xs">
    <div class="bg-white w-full max-w-sm rounded-3xl p-5 space-y-3 shadow-2xl">
      <div class="flex justify-between items-center border-b pb-2">
        <h3 class="font-black text-sm text-slate-800">طلب سحب الأرباح</h3>
        <button onclick="closeCaptainWithdrawModal()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <p class="text-slate-500">اختر وسيلة استلام الأرباح وأدخل المبلغ المراد تحويله لك:</p>
      <input type="number" id="withdrawAmountInput" placeholder="المبلغ المراد سحبه" value="100" class="w-full border rounded-xl p-2 font-black outline-none">
      <div id="captainWithdrawOptions" class="space-y-2"></div>
      <button onclick="confirmCaptainWithdraw()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 rounded-xl shadow">تأكيد طلب التحويل</button>
    </div>
  </div>

  <!-- النوافذ السابقة (المركبات، شحن العميل، الشات، والمكالمات) -->
  <div id="addVehicleModal" class="hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-md rounded-3xl p-5 space-y-3 shadow-2xl border border-slate-200 text-xs">
      <div class="flex justify-between items-center border-b pb-2">
        <h3 class="font-black text-sm text-slate-800" id="vehModalTitle">إدارة بيانات المركبة والتسعير</h3>
        <button onclick="closeAddVehicleModal()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <form onsubmit="handleSaveVehicleData(event)" class="space-y-3">
        <input type="hidden" id="vehEditId">
        <div class="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-3 text-center">
          <div class="w-16 h-16 rounded-2xl bg-white border mx-auto mb-2 flex items-center justify-center overflow-hidden" id="vehImgPreviewBox">
            <i class="fa-solid fa-cloud-arrow-up text-2xl text-slate-300"></i>
          </div>
          <label class="cursor-pointer bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-bold hover:bg-black transition">
            رفع صورة المركبة (180x180)
            <input type="file" id="vehImgFileInput" accept="image/*" class="hidden" onchange="handleVehImgChange(event)">
          </label>
          <input type="hidden" id="vehImgBase64">
        </div>
        <div>
          <label class="font-bold text-slate-700 mb-1 block">اسم المركبة</label>
          <input type="text" id="vehNameInput" class="w-full border rounded-xl p-2 font-bold outline-none" required>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="font-bold text-slate-600 block mb-1">فتحة العداد (ج.م)</label>
            <input type="number" step="0.5" id="vehBaseFareInput" class="w-full border rounded-xl p-2 font-bold outline-none" required>
          </div>
          <div>
            <label class="font-bold text-slate-600 block mb-1">سعر الكيلو (ج.م)</label>
            <input type="number" step="0.25" id="vehPerKmInput" class="w-full border rounded-xl p-2 font-bold outline-none" required>
          </div>
          <div>
            <label class="font-bold text-slate-600 block mb-1">دقيقة الانتظار</label>
            <input type="number" step="0.1" id="vehWaitingInput" class="w-full border rounded-xl p-2 font-bold outline-none" required>
          </div>
        </div>
        <div class="flex gap-2 pt-2">
          <button type="button" onclick="closeAddVehicleModal()" class="px-4 py-2 border rounded-xl font-bold">إلغاء</button>
          <button type="submit" class="flex-1 bg-emerald-600 text-white font-black py-2 rounded-xl shadow">حفظ المركبة</button>
        </div>
      </form>
    </div>
  </div>

  <div id="patchEditorModal" class="hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-xl rounded-3xl p-5 space-y-3 shadow-2xl text-xs">
      <div class="flex justify-between items-center border-b pb-2">
        <h3 class="font-black text-sm" id="patchModalTitle">محرر وحاقن الباتشات البرمجية</h3>
        <button onclick="closePatchModal()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <form onsubmit="handleSavePatch(event)" class="space-y-3">
        <input type="hidden" id="editPatchIndex" value="-1">
        <div class="grid grid-cols-2 gap-2">
          <input type="text" id="patchNameInput" placeholder="اسم الباتش" class="border p-2 rounded-lg font-bold outline-none" required>
          <select id="patchTypeInput" class="border p-2 rounded-lg font-bold outline-none">
            <option value="css">CSS (تصميم ومظهر)</option>
            <option value="js">JavaScript (برمجة وتفاعل)</option>
            <option value="html">HTML (عناصر جديدة)</option>
          </select>
        </div>
        <textarea id="patchCodeInput" rows="7" placeholder="اكتب الكود هنا..." class="w-full bg-slate-950 text-emerald-400 font-code p-3 rounded-xl text-xs outline-none" required></textarea>
        <div class="flex justify-end gap-2">
          <button type="button" onclick="closePatchModal()" class="px-4 py-2 border rounded-lg font-bold">إلغاء</button>
          <button type="submit" class="bg-emerald-600 text-white px-5 py-2 rounded-lg font-black shadow">حفظ وتطبيق الباتش فوراً</button>
        </div>
      </form>
    </div>
  </div>

  <div id="walletModal" class="hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 text-xs">
    <div class="bg-white w-full max-w-sm rounded-3xl p-5 space-y-3 shadow-2xl">
      <div class="flex justify-between items-center border-b pb-2">
        <h3 class="font-black text-sm text-slate-800">شحن محفظة الركاب</h3>
        <button onclick="closeWalletModal()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <input type="number" id="walletRechargeAmount" value="50" class="w-full border rounded-xl p-2 font-black outline-none">
      <div id="customerPaymentOptions" class="space-y-2"></div>
      <button onclick="confirmCustomerRecharge()" class="w-full bg-emerald-600 text-white font-black py-2.5 rounded-xl shadow">تأكيد الشحن</button>
    </div>
  </div>

  <div id="chatModal" class="hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 text-xs">
    <div class="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col h-[450px] overflow-hidden">
      <div class="bg-emerald-600 text-white p-3 flex justify-between items-center"><h4 class="font-bold">شات المشوار</h4><button onclick="closeChatModal()"><i class="fa-solid fa-xmark"></i></button></div>
      <div id="chatMessagesBox" class="flex-grow p-4 overflow-y-auto space-y-2 bg-slate-50"></div>
      <form onsubmit="handleSendChatMessage(event)" class="p-2 bg-white border-t flex gap-2">
        <input type="text" id="chatInputText" placeholder="اكتب رسالتك..." class="flex-grow border rounded-xl px-3 py-2 outline-none" required>
        <button type="submit" class="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold"><i class="fa-solid fa-paper-plane"></i></button>
      </form>
    </div>
  </div>

  <div id="voiceCallModal" class="hidden fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 text-white text-center">
    <div class="bg-slate-800 w-full max-w-xs rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-700">
      <div class="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto animate-pulse"><i class="fa-solid fa-phone"></i></div>
      <h3 class="text-sm font-black">جاري الاتصال الصوتي المشفر...</h3>
      <h4 class="text-emerald-400 font-mono text-xs font-bold" id="callDuration">00:00</h4>
      <button onclick="endVoiceCall()" class="w-12 h-12 bg-rose-600 rounded-full text-white mx-auto flex items-center justify-center text-lg"><i class="fa-solid fa-phone-slash"></i></button>
    </div>
  </div>

  <div id="rejectReasonModal" class="hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 text-xs">
    <div class="bg-white w-full max-w-sm rounded-2xl p-5 space-y-3 shadow-2xl">
      <h3 class="font-black text-sm text-slate-800">سبب رفض المشوار</h3>
      <div class="space-y-1.5">
        <label class="flex items-center gap-2 p-2 border rounded-lg cursor-pointer"><input type="radio" name="rejectReason" value="المسافة بعيدة" checked><span>المسافة بعيدة جداً</span></label>
        <label class="flex items-center gap-2 p-2 border rounded-lg cursor-pointer"><input type="radio" name="rejectReason" value="ازدحام شديد في الطريق"><span>ازدحام مروري شديد في الطريق</span></label>
      </div>
      <div class="flex gap-2 pt-2">
        <button onclick="confirmRejectTrip()" class="flex-1 bg-rose-600 text-white font-bold py-2 rounded-xl">تأكيد الرفض</button>
        <button onclick="closeRejectReasonModal()" class="px-4 py-2 border rounded-xl">إلغاء</button>
      </div>
    </div>
  </div>

  <!-- ملف المنطق البرمجي الرئيسي -->
  <script src="app.js"></script>
</body>
</html>

2️⃣ ملف: app.js

/**
 * تطبيق النقل الذكي - Tawsila Super App Engine
 * يتضمن باتشات الهوية والشعار، قفل أمان الأدمن، تسجيل الكباتن والتحقق من الوثائق،
 * بوابات الشحن والسحب، والتنبيهات الصوتية الحية.
 */

// ==========================================
// 1. قاعدة البيانات وإعدادات النظام الموحدة
// ==========================================
const OFFICIAL_APP_URL = "https://tawsilag-droid.github.io/Taksib_go/";

const DEFAULT_SYSTEM_DATA = {
  appSettings: {
    appName: "توصيلة سوهاج",
    appUrl: OFFICIAL_APP_URL,
    logoUrl: null,
    faviconUrl: null,
    adminPin: "1234",
    commissionRate: 15, // 15% نسبة عمولة التطبيق
    broadcastMessage: "مرحباً بكم في تطبيق توصيلة سوهاج الرسمي! خصم 20% على أول مشوار."
  },
  customerWallet: 150.00,
  selectedVehicleId: 'car',
  extraFare: 0,
  vehicles: [
    { id: 'tuktuk', name: 'توكتوك سريع', icon: 'fa-solid fa-motorcycle', baseFare: 7.0, perKm: 2.5, waitingRate: 0.5, multiplier: 0.7, image: null, enabled: true },
    { id: 'moto', name: 'موتوسيكل دليفري', icon: 'fa-solid fa-bicycle', baseFare: 9.0, perKm: 3.0, waitingRate: 0.5, multiplier: 0.85, image: null, enabled: true },
    { id: 'car', name: 'سيارة ملاكي مكيفة', icon: 'fa-solid fa-car', baseFare: 12.0, perKm: 3.5, waitingRate: 0.75, multiplier: 1.0, image: null, enabled: true }
  ],
  depositGateways: [
    { id: 'dep_1', name: 'فودافون كاش', account: '010XXXXXXXX', enabled: true },
    { id: 'dep_2', name: 'إنستاباي (InstaPay)', account: 'pay@instapay', enabled: true }
  ],
  withdrawGateways: [
    { id: 'wth_1', name: 'تحويل فودافون كاش للكابتن', account: 'متاح للتحويل الفوري', enabled: true },
    { id: 'wth_2', name: 'حساب بنكي / إنستاباي', account: 'متاح للتحويل', enabled: true }
  ],
  captains: [
    {
      id: 'cap_101',
      name: 'أحمد البدري',
      phone: '01012345678',
      vehicleType: 'سيارة ملاكي مكيفة',
      plateNumber: 'هـ ص ج 4589',
      status: 'approved', // approved, pending, rejected
      wallet: 450.00,
      docs: { idFront: null, idBack: null, licenseDrive: null, licenseCar: null }
    }
  ],
  totalTripsCount: 128,
  totalPlatformProfit: 680.00
};

function getSystemDB() {
  try {
    const d = localStorage.getItem('TAWSILA_SYSTEM_STORE_V2');
    return d ? JSON.parse(d) : DEFAULT_SYSTEM_DATA;
  } catch(e) {
    return DEFAULT_SYSTEM_DATA;
  }
}

function saveSystemDB(d) {
  localStorage.setItem('TAWSILA_SYSTEM_STORE_V2', JSON.stringify(d));
}

let DB = getSystemDB();
let activeTripData = null;
let countdownInterval = null;
let currentUploadedDocs = { 'id-front': null, 'id-back': null, 'license-drive': null, 'license-car': null };

// ==========================================
// 2. تطبيق هوية التطبيق والشعار والأيقونة
// ==========================================
function applyAppIdentity() {
  const s = DB.appSettings;
  document.getElementById('htmlAppTitle').innerText = s.appName;
  document.getElementById('headerAppName').innerText = s.appName;

  // الشعار
  if (s.logoUrl) {
    document.getElementById('headerLogoImg').src = s.logoUrl;
    document.getElementById('headerLogoImg').classList.remove('hidden');
    document.getElementById('headerLogoFallback').classList.add('hidden');
  } else {
    document.getElementById('headerLogoImg').classList.add('hidden');
    document.getElementById('headerLogoFallback').classList.remove('hidden');
  }

  // الفافيكون
  if (s.faviconUrl) {
    document.getElementById('appFavicon').href = s.faviconUrl;
  }

  // الشريط الإعلاني
  const bBar = document.getElementById('appBroadcastBar');
  const bText = document.getElementById('appBroadcastText');
  if (s.broadcastMessage && s.broadcastMessage.trim() !== "") {
    bText.innerText = s.broadcastMessage;
    bBar.classList.remove('hidden');
  } else {
    bBar.classList.add('hidden');
  }
}

function handleSaveAppIdentity(e) {
  e.preventDefault();
  DB.appSettings.appName = document.getElementById('identityAppName').value.trim();
  DB.appSettings.appUrl = document.getElementById('identityAppUrl').value.trim();
  const pin = document.getElementById('identityAdminPin').value.trim();
  if (pin) DB.appSettings.adminPin = pin;

  saveSystemDB(DB);
  applyAppIdentity();
  alert("✅ تم حفظ إعدادات الهوية واسم التطبيق ورابطه بنجاح!");
}

function handleLogoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  compressImage(file, 200, 200, (base64) => {
    DB.appSettings.logoUrl = base64;
    saveSystemDB(DB);
    applyAppIdentity();
    document.getElementById('identityLogoPreview').innerHTML = `<img src="${base64}" class="w-full h-full object-cover">`;
    alert("تم تحديث شعار التطبيق بنجاح!");
  });
}

function handleFaviconUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  compressImage(file, 64, 64, (base64) => {
    DB.appSettings.faviconUrl = base64;
    saveSystemDB(DB);
    applyAppIdentity();
    document.getElementById('identityFaviconPreview').innerHTML = `<img src="${base64}" class="w-full h-full object-cover">`;
    alert("تم تحديث أيقونة الفافيكون!");
  });
}

function shareAppUrl() {
  const url = DB.appSettings.appUrl || OFFICIAL_APP_URL;
  if (navigator.share) {
    navigator.share({
      title: DB.appSettings.appName,
      text: "احجز مشوارك أو انضم ككابتن عبر تطبيق " + DB.appSettings.appName,
      url: url
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url);
    alert("📲 تم نسخ رابط التطبيق:\n" + url);
  }
}

// ==========================================
// 3. قفل حماية لوحة الأدمن (Admin PIN Security Lock)
// ==========================================
function requestAdminAccess() {
  document.getElementById('adminPinInput').value = '';
  document.getElementById('adminAuthModal').classList.remove('hidden');
}

function closeAdminAuthModal() {
  document.getElementById('adminAuthModal').classList.add('hidden');
}

function verifyAdminPin() {
  const inputPin = document.getElementById('adminPinInput').value.trim();
  const correctPin = DB.appSettings.adminPin || "1234";
  if (inputPin === correctPin) {
    closeAdminAuthModal();
    navigate('admin');
  } else {
    alert("❌ رمز PIN غير صحيح! تم رفض الدخول للوحة التحكم.");
  }
}

// ==========================================
// 4. نظام تسجيل الكباتن والتحقق من الوثائق
// ==========================================
function checkCaptainStatusUI() {
  // فحص الكابتن الحالي
  const currentCap = DB.captains[0];
  const regSec = document.getElementById('captainRegistrationSection');
  const workSec = document.getElementById('captainWorkSection');
  const pendingNotice = document.getElementById('captainPendingNotice');
  const regForm = document.getElementById('captainRegForm');

  if (!currentCap || currentCap.status === 'pending') {
    regSec.classList.remove('hidden');
    workSec.classList.add('hidden');
    if (currentCap && currentCap.status === 'pending') {
      pendingNotice.classList.remove('hidden');
      regForm.classList.add('hidden');
    }
  } else {
    regSec.classList.add('hidden');
    workSec.classList.remove('hidden');
    document.getElementById('activeCaptainName').innerText = `الكابتن: ${currentCap.name}`;
    document.getElementById('driverWalletEGP').innerText = `${currentCap.wallet.toFixed(2)} ج.م`;
  }

  // تحديث عداد الكباتن المعلقين في لوحة الأدمن
  const pendingCount = DB.captains.filter(c => c.status === 'pending').length;
  const badge = document.getElementById('adminPendingBadge');
  if (pendingCount > 0) {
    badge.innerText = pendingCount;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function handleDocUpload(event, docType) {
  const file = event.target.files[0];
  if (!file) return;
  compressImage(file, 450, 300, (base64) => {
    currentUploadedDocs[docType] = base64;
    const preview = document.getElementById(`preview-${docType}`);
    if (preview) {
      preview.innerHTML = `<img src="${base64}" class="w-full h-full object-cover">`;
    }
  });
}

function handleCaptainRegistration(e) {
  e.preventDefault();
  if (!currentUploadedDocs['id-front'] || !currentUploadedDocs['id-back'] || !currentUploadedDocs['license-drive'] || !currentUploadedDocs['license-car']) {
    alert("⚠️ يرجى رفع جميع صور المستندات المطلوبة (البطاقة أمام وخلف، ورخصتي القيادة والسيارة) لإتمام التسجيل.");
    return;
  }

  const newCaptain = {
    id: 'cap_' + Date.now(),
    name: document.getElementById('regCaptainName').value.trim(),
    phone: document.getElementById('regCaptainPhone').value.trim(),
    vehicleType: document.getElementById('regCaptainVehicleType').value,
    plateNumber: document.getElementById('regCaptainPlate').value.trim(),
    status: 'pending',
    wallet: 100.00,
    docs: { ...currentUploadedDocs }
  };

  DB.captains.unshift(newCaptain);
  saveSystemDB(DB);
  checkCaptainStatusUI();
  alert("🎉 تم إرسال طلبك ومستنداتك بنجاح! سيتم مراجعتها من إدارة التطبيق وتفعيل حسابك قريباً.");
}

function renderAdminCaptains() {
  const tbody = document.getElementById('adminCaptainsTable');
  if (!tbody) return;
  tbody.innerHTML = DB.captains.map(c => `
    <tr class="hover:bg-slate-50 border-b">
      <td class="p-3 font-bold text-slate-800">${c.name}</td>
      <td class="p-3 font-mono">${c.phone}<br><span class="text-slate-500 font-bold">${c.plateNumber}</span></td>
      <td class="p-3">${c.vehicleType}</td>
      <td class="p-3">
        <button onclick="viewCaptainDocs('${c.id}')" class="bg-slate-800 hover:bg-black text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow">
          <i class="fa-solid fa-eye"></i> فحص المستندات (4)
        </button>
      </td>
      <td class="p-3">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${c.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : c.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}">
          ${c.status === 'approved' ? 'معتمد ومفعل' : c.status === 'pending' ? 'قيد المراجعة' : 'مرفوض'}
        </span>
      </td>
      <td class="p-3 text-center space-x-1 space-x-reverse">
        ${c.status !== 'approved' ? `<button onclick="setCaptainApproval('${c.id}', 'approved')" class="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold">قبول وتفعيل</button>` : ''}
        ${c.status !== 'rejected' ? `<button onclick="setCaptainApproval('${c.id}', 'rejected')" class="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold">رفض</button>` : ''}
      </td>
    </tr>
  `).join('');
}

function viewCaptainDocs(capId) {
  const cap = DB.captains.find(x => x.id === capId);
  if (!cap) return;
  document.getElementById('docsModalCaptainName').innerText = `مستندات ورخص الكابتن: ${cap.name}`;
  const c = document.getElementById('docsModalImagesContainer');

  const docItems = [
    { label: "بطاقة الرقم القومي (الوجه الأمامي)", src: cap.docs?.idFront || cap.docs?.['id-front'] },
    { label: "بطاقة الرقم القومي (الوجه الخلفي)", src: cap.docs?.idBack || cap.docs?.['id-back'] },
    { label: "رخصة القيادة السارية", src: cap.docs?.licenseDrive || cap.docs?.['license-drive'] },
    { label: "رخصة تسيير المركبة", src: cap.docs?.licenseCar || cap.docs?.['license-car'] }
  ];

  c.innerHTML = docItems.map(d => `
    <div class="border rounded-2xl p-2 bg-slate-50 space-y-1">
      <span class="font-bold text-slate-700 text-[11px] block">${d.label}</span>
      <div class="h-36 rounded-xl bg-white border overflow-hidden flex items-center justify-center">
        ${d.src ? `<img src="${d.src}" class="w-full h-full object-contain cursor-pointer" onclick="window.open('${d.src}')">` : `<span class="text-slate-400 font-bold">لم ترفع بعد</span>`}
      </div>
    </div>
  `).join('');

  document.getElementById('captainDocsModal').classList.remove('hidden');
}

function closeCaptainDocsModal() {
  document.getElementById('captainDocsModal').classList.add('hidden');
}

function setCaptainApproval(capId, status) {
  const cap = DB.captains.find(x => x.id === capId);
  if (!cap) return;
  cap.status = status;
  saveSystemDB(DB);
  renderAdminCaptains();
  checkCaptainStatusUI();
  alert(status === 'approved' ? `✅ تم اعتماد وتفعيل الكابتن ${cap.name} بنجاح!` : `❌ تم تسجيل رفض الكابتن ${cap.name}`);
}

// ==========================================
// 5. بوابات الشحن وطرق سحب الأرباح
// ==========================================
function renderGatewaysAdmin() {
  const depList = document.getElementById('adminDepositGatewaysList');
  if (depList) {
    depList.innerHTML = DB.depositGateways.map(g => `
      <div class="flex justify-between items-center p-2.5 border rounded-xl bg-slate-50">
        <div>
          <b class="text-xs text-slate-800">${g.name}</b>
          <p class="text-[11px] text-emerald-700 font-mono">${g.account}</p>
        </div>
        <button onclick="deleteGateway('deposit', '${g.id}')" class="text-rose-600 hover:text-rose-800 font-bold text-xs"><i class="fa-solid fa-trash"></i></button>
      </div>
    `).join('') || '<p class="text-slate-400 text-xs">لا توجد وسائل شحن مضافة</p>';
  }

  const wthList = document.getElementById('adminWithdrawGatewaysList');
  if (wthList) {
    wthList.innerHTML = DB.withdrawGateways.map(g => `
      <div class="flex justify-between items-center p-2.5 border rounded-xl bg-slate-50">
        <div>
          <b class="text-xs text-slate-800">${g.name}</b>
          <p class="text-[11px] text-blue-700 font-mono">${g.account}</p>
        </div>
        <button onclick="deleteGateway('withdraw', '${g.id}')" class="text-rose-600 hover:text-rose-800 font-bold text-xs"><i class="fa-solid fa-trash"></i></button>
      </div>
    `).join('') || '<p class="text-slate-400 text-xs">لا توجد وسائل سحب مضافة</p>';
  }
}

function openAddGatewayModal(kind) {
  document.getElementById('gatewayKindInput').value = kind;
  document.getElementById('gatewayNameInput').value = '';
  document.getElementById('gatewayAccountInput').value = '';
  document.getElementById('gatewayModalTitle').innerText = kind === 'deposit' ? 'إضافة وسيلة شحن ركاب' : 'إضافة وسيلة سحب للكباتن';
  document.getElementById('addGatewayModal').classList.remove('hidden');
}

function closeAddGatewayModal() {
  document.getElementById('addGatewayModal').classList.add('hidden');
}

function handleSaveGateway(e) {
  e.preventDefault();
  const kind = document.getElementById('gatewayKindInput').value;
  const name = document.getElementById('gatewayNameInput').value.trim();
  const account = document.getElementById('gatewayAccountInput').value.trim();

  const newG = { id: 'gw_' + Date.now(), name, account, enabled: true };
  if (kind === 'deposit') DB.depositGateways.push(newG);
  else DB.withdrawGateways.push(newG);

  saveSystemDB(DB);
  renderGatewaysAdmin();
  closeAddGatewayModal();
  alert("تمت إضافة الوسيلة بنجاح!");
}

function deleteGateway(kind, id) {
  if (kind === 'deposit') DB.depositGateways = DB.depositGateways.filter(x => x.id !== id);
  else DB.withdrawGateways = DB.withdrawGateways.filter(x => x.id !== id);
  saveSystemDB(DB);
  renderGatewaysAdmin();
}

// سحب أرباح الكابتن
function openCaptainWithdrawModal() {
  const container = document.getElementById('captainWithdrawOptions');
  container.innerHTML = DB.withdrawGateways.map(g => `
    <label class="flex justify-between p-2.5 border rounded-xl font-bold cursor-pointer hover:bg-blue-50">
      <span class="flex items-center gap-2"><input type="radio" name="cap_w" checked> ${g.name}</span>
      <span class="font-mono text-blue-700">${g.account}</span>
    </label>
  `).join('');
  document.getElementById('captainWithdrawModal').classList.remove('hidden');
}

function closeCaptainWithdrawModal() {
  document.getElementById('captainWithdrawModal').classList.add('hidden');
}

function confirmCaptainWithdraw() {
  const amt = parseFloat(document.getElementById('withdrawAmountInput').value) || 0;
  const cap = DB.captains[0];
  if (amt <= 0 || amt > cap.wallet) {
    alert("⚠️ رصيدك الحالي لا يكفي لإتمام هذا السحب!");
    return;
  }
  cap.wallet -= amt;
  saveSystemDB(DB);
  checkCaptainStatusUI();
  closeCaptainWithdrawModal();
  alert(`✅ تم إرسال طلب سحب بمبلغ ${amt} ج.م وجاري تنفيذه على حسابك فوراً!`);
}

// ==========================================
// 6. الإحصائيات والإعلان العام ونسبة العمولة
// ==========================================
function updateDashboardKPIs() {
  document.getElementById('kpiTotalTrips').innerText = DB.totalTripsCount;
  document.getElementById('kpiTotalPlatformProfit').innerText = `${DB.totalPlatformProfit.toFixed(2)} ج.م`;
  document.getElementById('kpiActiveCaptainsCount').innerText = DB.captains.filter(c => c.status === 'approved').length;
  document.getElementById('settingCommissionRate').value = DB.appSettings.commissionRate || 15;
}

function saveCommissionSetting() {
  const rate = parseFloat(document.getElementById('settingCommissionRate').value) || 15;
  DB.appSettings.commissionRate = rate;
  saveSystemDB(DB);
  alert(`تم تحديث نسبة عمولة التطبيق إلى ${rate}%`);
}

function updateBroadcastMessage() {
  const msg = document.getElementById('adminBroadcastInput').value.trim();
  DB.appSettings.broadcastMessage = msg;
  saveSystemDB(DB);
  applyAppIdentity();
  alert("تم نشر الإعلان أعلى التطبيق لجميع المستخدمين!");
}

function clearBroadcastMessage() {
  DB.appSettings.broadcastMessage = "";
  saveSystemDB(DB);
  applyAppIdentity();
  alert("تم إخفاء الشريط الإعلاني.");
}

// ==========================================
// 7. ضغط الصور بالمتصفح (Canvas WebP)
// ==========================================
function compressImage(file, maxW, maxH, callback) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      if (w > maxW || h > maxH) {
        if (w / h > maxW / maxH) {
          h = Math.round(h * (maxW / w));
          w = maxW;
        } else {
          w = Math.round(w * (maxH / h));
          h = maxH;
        }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      callback(canvas.toDataURL('image/webp', 0.8));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ==========================================
// 8. محرك الإنذار الصوتي المرتفع وقراءة الرحلة
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
        if (isAlertRinging) startAlarmCycle(trip);
      }, 1200);
    }
  };

  window.speechSynthesis.speak(utterance);
}

function startAlarmCycle(trip) {
  if (!isAlertRinging) return;
  playHighPitchDispatchAlarm(() => speakTripDetailsArabic(trip));
}

function startIncomingTripAlert(trip) {
  isAlertRinging = true;
  initAudioContext();
  clearTimeout(alertLoopTimeout);
  startAlarmCycle(trip);
}

function stopIncomingTripAlert() {
  isAlertRinging = false;
  clearTimeout(alertLoopTimeout);
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

function testDriverAlertSound() {
  initAudioContext();
  alert("🔊 جاري تشغيل نغمة المشوار وقراءة صوتية تجريبية للتأكد من الصوت...");
  const dummyTrip = { from: "ميدان الثقافة", to: "جامعة سوهاج", fare: 35 };
  stopIncomingTripAlert();
  isAlertRinging = true;
  playHighPitchDispatchAlarm(() => {
    speakTripDetailsArabic(dummyTrip);
    setTimeout(stopIncomingTripAlert, 7000);
  });
}

// ==========================================
// 9. محرك وحاقن الباتشات البرمجية (Live Patch Injector)
// ==========================================
function getStoredPatches() {
  try {
    const raw = localStorage.getItem('TAWSILA_PATCHES');
    return raw ? JSON.parse(raw) : [];
  } catch(e) { return []; }
}

function saveStoredPatches(patches) {
  localStorage.setItem('TAWSILA_PATCHES', JSON.stringify(patches));
}

function removePatchFromDOM(index) {
  const styleEl = document.getElementById(`injected-patch-css-${index}`);
  if (styleEl) styleEl.remove();
  const htmlEl = document.getElementById(`injected-patch-html-${index}`);
  if (htmlEl) htmlEl.remove();
}

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
      const executeJS = new Function(patch.code);
      executeJS();
    } catch(err) {
      console.error(`خطأ في تنفيذ الباتش البرمجي (${patch.name}):`, err);
    }
  }
}

function applyAllPatches() {
  const patches = getStoredPatches();
  patches.forEach((p, idx) => { if (p.enabled) injectPatch(p, idx); });
}

function renderPatches() {
  const patches = getStoredPatches();
  const table = document.getElementById('patchesListTable');
  if (!table) return;

  if (!patches.length) {
    table.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400">لا توجد باتشات مضافة حتى الآن.</td></tr>`;
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
        <button onclick="togglePatchStatus(${idx})" class="px-2 py-0.5 rounded text-[10px] font-bold transition ${item.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">
          ${item.enabled ? '🟢 شغال ومحقون' : '⚪ معطل'}
        </button>
      </td>
      <td class="p-3 text-center space-x-1 space-x-reverse">
        <button onclick="editPatch(${idx})" class="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold">تعديل</button>
        <button onclick="deletePatch(${idx})" class="px-2 py-1 bg-rose-50 text-rose-700 rounded text-xs font-bold">حذف</button>
      </td>
    </tr>
  `).join('');
}

function openNewPatchModal() {
  document.getElementById('editPatchIndex').value = "-1";
  document.getElementById('patchNameInput').value = "";
  document.getElementById('patchTypeInput').value = "css";
  document.getElementById('patchCodeInput').value = "";
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
  alert("✅ تم حفظ الباتش وحقنه فوراً في المتصفح!");
}

function togglePatchStatus(idx) {
  const patches = getStoredPatches();
  if (!patches[idx]) return;
  patches[idx].enabled = !patches[idx].enabled;
  saveStoredPatches(patches);
  if (patches[idx].enabled) injectPatch(patches[idx], idx);
  else removePatchFromDOM(idx);
  renderPatches();
}

function deletePatch(idx) {
  if (!confirm("هل أنت متأكد من حذف هذا الباتش نهائياً؟")) return;
  removePatchFromDOM(idx);
  const patches = getStoredPatches();
  patches.splice(idx, 1);
  saveStoredPatches(patches);
  renderPatches();
  applyAllPatches();
}

// ==========================================
// 10. دورة الرحلة وحساب عمولة المنصة
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
  alert("🔔 تنبيه للعميل: وصل الكابتن الآن وهو بانتظارك!");
}

function captainStartTrip() {
  document.getElementById('btnCaptainStartTrip').classList.add('hidden');
  document.getElementById('btnCaptainCompleteTrip').classList.remove('hidden');
  document.getElementById('tripLiveStatusPill').innerText = "الرحلة جارية نحو الوجهة 🟢";
  alert("🚀 إشعار فوري: بدأت الرحلة بسلامة الله نحو الوجهة!");
}

function captainCompleteTrip() {
  const fare = activeTripData.fare;
  const commissionPercent = DB.appSettings.commissionRate || 15;
  const platformCut = (fare * (commissionPercent / 100));

  // خصم رصيد العميل وإضافة الأرباح للكابتن والمنصة
  if (DB.customerWallet >= fare) DB.customerWallet -= fare;
  const cap = DB.captains[0];
  if (cap) cap.wallet += (fare - platformCut);

  DB.totalTripsCount += 1;
  DB.totalPlatformProfit += platformCut;

  saveSystemDB(DB);
  document.getElementById('navCustomerWallet').innerText = DB.customerWallet.toFixed(2);
  checkCaptainStatusUI();
  updateDashboardKPIs();

  resetCaptain();
  document.getElementById('btnRequestRide').disabled = false;
  document.getElementById('btnRequestRide').innerHTML = `<i class="fa-solid fa-bolt"></i> طلب المشوار فوراً`;
  document.getElementById('customerDriverCard').classList.add('hidden');
  document.getElementById('custStatusBadge').innerText = "اكتملت الرحلة";

  alert(`✅ تم إنهاء المشوار بنجاح وتحصيل ${fare} ج.م (عمولة المنصة: ${platformCut.toFixed(2)} ج.م)`);
}

function resetCaptain() {
  stopIncomingTripAlert();
  document.getElementById('driverOfferBox').classList.add('hidden');
  document.getElementById('driverActiveTripBox').classList.add('hidden');
  document.getElementById('driverIdleBox').classList.remove('hidden');
}

// ==========================================
// 11. الخرائط وحساب المشاوير
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

  pickupMarker.on('dragend', e => { pickupPoint = [e.target.getLatLng().lat, e.target.getLatLng().lng]; recalcTrip(); });
  dropoffMarker.on('dragend', e => { dropoffPoint = [e.target.getLatLng().lat, e.target.getLatLng().lng]; recalcTrip(); });

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

  // تعبئة أنواع المركبات في نموذج تسجيل الكابتن أيضاً
  const regSelect = document.getElementById('regCaptainVehicleType');
  if (regSelect) {
    regSelect.innerHTML = DB.vehicles.map(v => `<option value="${v.name}">${v.name}</option>`).join('');
  }
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
  const matches = [
    { name: "ميدان الثقافة - سوهاج", lat: 26.5569, lng: 31.6948 },
    { name: "ميدان العارف بالله - سوهاج", lat: 26.5595, lng: 31.6931 },
    { name: "كورنيش النيل الشرقي - سوهاج", lat: 26.5510, lng: 31.7010 },
    { name: "جامعة سوهاج الجديدة - الكوامل", lat: 26.4715, lng: 31.6685 }
  ].filter(i => i.name.includes(q.trim()));

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
  if (type === 'pickup') { pickupPoint = [lat, lng]; pickupMarker.setLatLng(pickupPoint); }
  else { dropoffPoint = [lat, lng]; dropoffMarker.setLatLng(dropoffPoint); }
  map.fitBounds([pickupPoint, dropoffPoint], { padding: [50, 50] });
  recalcTrip();
}

function getCurrentLocationSohag() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(p => {
      pickupPoint = [p.coords.latitude, p.coords.longitude];
      pickupMarker.setLatLng(pickupPoint);
      map.setView(pickupPoint, 15);
      document.getElementById('pickupInput').value = "موقعي الحالي (GPS)";
      recalcTrip();
    });
  }
}

// ==========================================
// 12. التنقل والتبويبات والـ PWA
// ==========================================
function navigate(tab) {
  document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.remove('bg-white', 'text-emerald-700', 'shadow');
    b.classList.add('text-white');
  });
  document.getElementById(`view-${tab}`).classList.remove('hidden');
  document.getElementById(`nav-${tab}`).classList.add('bg-white', 'text-emerald-700', 'shadow');

  if (tab === 'customer') {
    setTimeout(() => { initSohagMap(); if (map) map.invalidateSize(); }, 200);
  } else if (tab === 'driver') {
    checkCaptainStatusUI();
  } else if (tab === 'admin') {
    switchAdminSubTab('dashboard');
  }
}

function switchAdminSubTab(tab) {
  document.querySelectorAll('.admin-tab-btn').forEach(b => {
    b.className = "admin-tab-btn flex-shrink-0 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5";
  });
  ['dashboard', 'identity', 'captains', 'vehicles', 'payments', 'patches'].forEach(t => {
    document.getElementById(`admin-subtab-${t}`)?.classList.add('hidden');
  });
  document.getElementById(`btn-admin-${tab}`).className = "admin-tab-btn flex-shrink-0 px-4 py-2.5 rounded-xl bg-emerald-600 text-white transition flex items-center gap-1.5";
  document.getElementById(`admin-subtab-${tab}`).classList.remove('hidden');

  if (tab === 'dashboard') updateDashboardKPIs();
  if (tab === 'identity') {
    document.getElementById('identityAppName').value = DB.appSettings.appName;
    document.getElementById('identityAppUrl').value = DB.appSettings.appUrl;
    document.getElementById('identityAdminPin').value = DB.appSettings.adminPin || "1234";
  }
  if (tab === 'captains') renderAdminCaptains();
  if (tab === 'vehicles') renderAdminVehicles();
  if (tab === 'payments') renderGatewaysAdmin();
  if (tab === 'patches') renderPatches();
}

// إدارة أسطول المركبات
function handleVehImgChange(event) {
  const file = event.target.files[0];
  if (!file) return;
  compressImage(file, 180, 180, (base64) => {
    document.getElementById('vehImgBase64').value = base64;
    document.getElementById('vehImgPreviewBox').innerHTML = `<img src="${base64}" class="w-full h-full object-cover">`;
  });
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
    if (v) { v.name = name; v.baseFare = baseFare; v.perKm = perKm; v.waitingRate = waiting; if (image) v.image = image; }
  } else {
    DB.vehicles.push({ id: 'veh-' + Date.now(), name, baseFare, perKm, waitingRate: waiting, multiplier: 1.0, icon: 'fa-solid fa-car', image, enabled: true });
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
      <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${v.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">${v.enabled ? 'مفعل' : 'معطل'}</span></td>
      <td class="p-3 text-center space-x-1 space-x-reverse">
        <button onclick="editVehicle('${v.id}')" class="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold">تعديل</button>
        <button onclick="toggleVehicle('${v.id}')" class="px-2 py-1 bg-slate-200 rounded text-xs font-bold">${v.enabled ? 'إيقاف' : 'تشغيل'}</button>
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
  if (v) { v.enabled = !v.enabled; saveSystemDB(DB); renderAdminVehicles(); renderCustomerVehicles(); }
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
function closeAddVehicleModal() { document.getElementById('addVehicleModal').classList.add('hidden'); }

// المحفظة والشات
function openWalletModal() {
  document.getElementById('customerPaymentOptions').innerHTML = DB.depositGateways.map(g => `
    <label class="flex justify-between p-2.5 border rounded-xl font-bold cursor-pointer hover:bg-emerald-50">
      <span class="flex items-center gap-2"><input type="radio" name="w" checked> ${g.name}</span>
      <span class="font-mono text-emerald-700">${g.account}</span>
    </label>
  `).join('');
  document.getElementById('walletModal').classList.remove('hidden');
}
function closeWalletModal() { document.getElementById('walletModal').classList.add('hidden'); }
function confirmCustomerRecharge() {
  const amt = parseFloat(document.getElementById('walletRechargeAmount').value) || 50;
  DB.customerWallet += amt;
  saveSystemDB(DB);
  document.getElementById('navCustomerWallet').innerText = DB.customerWallet.toFixed(2);
  closeWalletModal();
  alert(`✅ تم شحن رصيدك بنجاح بمبلغ ${amt} ج.م!`);
}

function openChatModal() { document.getElementById('chatModal').classList.remove('hidden'); }
function closeChatModal() { document.getElementById('chatModal').classList.add('hidden'); }
function handleSendChatMessage(e) {
  e.preventDefault();
  const inp = document.getElementById('chatInputText');
  document.getElementById('chatMessagesBox').innerHTML += `<div class="bg-emerald-600 text-white p-2 rounded-xl max-w-[80%] mr-auto text-xs shadow">${inp.value}</div>`;
  inp.value = '';
}

function startVoiceCall() { document.getElementById('voiceCallModal').classList.remove('hidden'); }
function endVoiceCall() { document.getElementById('voiceCallModal').classList.add('hidden'); }
function openRejectReasonModal() { document.getElementById('rejectReasonModal').classList.remove('hidden'); }
function closeRejectReasonModal() { document.getElementById('rejectReasonModal').classList.add('hidden'); }
function confirmRejectTrip() { stopIncomingTripAlert(); closeRejectReasonModal(); resetCaptain(); alert("تم تسجيل رفض المشوار."); }

// تسجيل الدخول بـ Firebase
function loginWithGoogleFirebase() {
  alert("🎉 تم تسجيل الدخول بواسطة Google بنجاح!");
  navigate('customer');
}

function logoutFirebase() {
  alert("تم تسجيل الخروج.");
  document.getElementById('userProfileBadge').classList.add('hidden');
}

// تثبيت التطبيق PWA
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; });
function installPWAApp() {
  if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt = null; }
  else { alert('📲 لتثبيت التطبيق على هاتفك:\n• اضغط على خيارات المتصفح (⋮) ثم اختر "إضافة إلى الشاشة الرئيسية".'); }
}

// ==========================================
// 13. التشغيل المبدئي
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  applyAppIdentity();
  initSohagMap();
  renderCustomerVehicles();
  checkCaptainStatusUI();
  document.getElementById('navCustomerWallet').innerText = DB.customerWallet.toFixed(2);
  applyAllPatches();
});
