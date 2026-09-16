// 스캐너 대여현황 3개 화면(대여화면/현황판/달력)이 같이 쓰는 공용 UI 도구.
// 못생긴 브라우저 기본 alert()/confirm() 대신 앱과 어울리는 예쁜 모달을 보여주고,
// 여닫힐 때 부드럽게 움직이도록 만든다(2026-09-09 사장님 요청 - "너무 성의없어
// 보인다", "창이 뚝뚝 켜지는건 딱딱해보여").
(function () {
  // 휴대폰 카메라로 찍은 사진은 보통 수 MB(가끔 10MB 이상)라서, 그대로 base64로
  // 서버에 올리면 구글 드라이브 업로드 시간이 길어져서 대여/반납 처리 자체가
  // 느려지거나 응답이 너무 늦어 화면에서 실패로 보이는 문제가 있었다(2026-09-11
  // 실제 확인 - "사진 찍고 대여하기 눌렀는데 처리 못했다고 떴는데 메일은 왔어").
  // 올리기 전에 브라우저에서 적당한 크기로 줄여서 이 문제를 크게 줄인다 - 시리얼
  // 번호처럼 글자를 읽어야 하는 사진도 이 정도 해상도면 충분히 알아볼 수 있다.
  window.resizeImageForUpload_ = function (file, callback) {
    var maxDim = 1600, quality = 0.82;
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var w = img.width, h = img.height;
        var scale = Math.min(1, maxDim / Math.max(w, h));
        var canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(w * scale));
        canvas.height = Math.max(1, Math.round(h * scale));
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        try {
          callback(canvas.toDataURL('image/jpeg', quality));
        } catch (err) {
          callback(e.target.result); // 캔버스 처리가 실패하면 원본이라도 그대로 올린다.
        }
      };
      img.onerror = function () { callback(e.target.result); }; // 이미지로 못 열리면 원본 그대로.
      img.src = e.target.result;
    };
    reader.onerror = function () { callback(null); };
    reader.readAsDataURL(file);
  };

  function ensureStyles() {
    if (document.getElementById('scanner-ui-style')) return;
    var style = document.createElement('style');
    style.id = 'scanner-ui-style';
    style.textContent =
      '.su-backdrop { position: fixed; inset: 0; background: rgba(22,35,42,0); z-index: 300;' +
      '  display: flex; align-items: flex-end; justify-content: center;' +
      '  transition: background .25s ease; }' +
      '.su-backdrop.su-in { background: rgba(22,35,42,0.45); }' +
      '.su-sheet { background: #fff; border-radius: 16px 16px 0 0; padding: 22px 20px 24px;' +
      '  width: 100%; max-width: 420px; box-shadow: 0 -6px 28px rgba(0,0,0,0.18);' +
      '  transform: translateY(28px); opacity: 0;' +
      '  transition: transform .28s cubic-bezier(.2,.8,.2,1), opacity .22s ease;' +
      '  font-family: -apple-system, "Malgun Gothic", sans-serif; }' +
      '.su-backdrop.su-in .su-sheet { transform: translateY(0); opacity: 1; }' +
      '.su-icon { width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center;' +
      '  justify-content: center; font-size: 19px; margin-bottom: 12px; }' +
      '.su-icon.info { background: #E3F0F3; }' +
      '.su-icon.warn { background: #FBE1E1; }' +
      '.su-msg { font-size: 14.5px; line-height: 1.6; color: #16232A; white-space: pre-line; margin: 0 0 20px; }' +
      '.su-btn-row { display: flex; gap: 10px; }' +
      '.su-btn { flex: 1; padding: 14px; border-radius: 10px; font-size: 15px; font-weight: bold;' +
      '  border: none; font-family: inherit; cursor: pointer; }' +
      '.su-btn.su-cancel { background: #EEF1F1; color: #16232A; }' +
      '.su-btn.su-ok { background: #00778B; color: #fff; }' +
      '.su-toast { position: fixed; top: 50%; left: 50%; z-index: 400;' +
      '  transform: translate(-50%, -50%) scale(0.92); opacity: 0; pointer-events: none;' +
      '  background: rgba(22,35,42,0.94); color: #fff; padding: 22px 30px; border-radius: 16px;' +
      '  text-align: center; max-width: 82vw; box-shadow: 0 8px 28px rgba(0,0,0,0.25);' +
      '  transition: opacity .2s ease, transform .2s ease;' +
      '  font-family: -apple-system, "Malgun Gothic", sans-serif; }' +
      '.su-toast.su-toast-in { opacity: 1; transform: translate(-50%, -50%) scale(1); }' +
      '.su-toast-icon { font-size: 30px; margin-bottom: 8px; }' +
      '.su-toast-msg { font-size: 15px; font-weight: bold; white-space: pre-line; }' +
      '.su-lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0); z-index: 500;' +
      '  display: flex; align-items: center; justify-content: center; padding: 24px;' +
      '  box-sizing: border-box; transition: background .2s ease; cursor: zoom-out; }' +
      '.su-lightbox.su-lightbox-in { background: rgba(0,0,0,0.88); }' +
      '.su-lightbox img { max-width: 100%; max-height: 100%; border-radius: 10px;' +
      '  box-shadow: 0 8px 30px rgba(0,0,0,0.5); transform: scale(0.94); opacity: 0;' +
      '  transition: transform .22s cubic-bezier(.2,.8,.2,1), opacity .2s ease; }' +
      '.su-lightbox.su-lightbox-in img { transform: scale(1); opacity: 1; }' +
      '.su-lightbox-close { position: absolute; top: 16px; right: 16px; width: 38px; height: 38px;' +
      '  border-radius: 50%; background: rgba(255,255,255,0.15); color: #fff; border: none;' +
      '  font-size: 20px; line-height: 1; cursor: pointer; }' +
      '.su-history-nav { position: fixed; left: 12px; bottom: 14px; z-index: 40;' +
      '  display: flex; gap: 8px; }' +
      '.su-history-btn { width: 34px; height: 34px; border-radius: 50%; border: none;' +
      '  background: rgba(10,37,64,0.82); color: #fff; font-size: 16px; font-weight: bold;' +
      '  display: flex; align-items: center; justify-content: center; cursor: pointer;' +
      '  box-shadow: 0 2px 8px rgba(10,37,64,0.3); font-family: inherit; line-height: 1;' +
      '  touch-action: manipulation; }' +
      '.su-history-btn:active { background: rgba(10,37,64,0.98); }' +
      '@keyframes suSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }' +
      '.su-history-btn.su-refreshing { animation: suSpin .8s linear infinite; }' +
      // 2026-09-16 추가 - 깃허브 정적 사이트 이전 후 점검모드 배너(옛
      // scanner_maintenance.html 스타일을 옮겨옴).
      '#ds-maintenance-banner { position: fixed; inset: 0; z-index: 500; background: #F3F6F7;' +
      '  display: flex; align-items: center; justify-content: center; padding: 20px; }' +
      '.ds-maint-card { background: #fff; border-radius: 18px; padding: 32px 26px; max-width: 360px;' +
      '  text-align: center; box-shadow: 0 8px 30px rgba(10,37,64,0.12); }' +
      '.ds-maint-icon { font-size: 40px; margin-bottom: 10px; }' +
      '.ds-maint-card h1 { font-size: 18px; margin: 0 0 10px; color: #0A2540; }' +
      '.ds-maint-card p { font-size: 13.5px; color: #5B6B80; line-height: 1.6; margin: 0 0 18px; }' +
      '.ds-maint-card button { border: none; border-radius: 10px; background: #0A2540; color: #fff;' +
      '  font-size: 14px; font-weight: bold; padding: 11px 20px; cursor: pointer; font-family: inherit; }';
    document.head.appendChild(style);
  }

  // 바텀시트/모달/라이트박스가 열려있는 동안 안드로이드 기기 자체의 뒤로가기
  // 버튼(또는 제스처)을 누르면, 페이지째로 뒤로 가버리는 대신 지금 열려있는
  // 오버레이만 닫히게 한다(2026-09-11 사장님 요청 - "안드로이드는 자체적으로
  // 뒤로가기 버튼이 있어서 그걸 눌렀을때도 진행되게"). 아이폰 PWA는 뒤로/앞으로
  // 버튼을 화면에 직접 그려서 해결했지만(injectHistoryNav_), 안드로이드는 기기
  // 자체 버튼이 항상 있어서 그 입력(popstate)에도 반응해야 함.
  //
  // 오버레이를 열 때 dsOpenOverlay_(닫는함수)를 한 번 불러두면, 이후 그 오버레이를
  // X/취소/바깥 클릭 등으로 닫는 모든 경로에서 직접 닫지 말고 dsCloseOverlay_()를
  // 대신 부르면 된다 - 실제 화면 제거는 등록해둔 닫는함수가 그대로 수행하고,
  // 여기서는 열 때 쌓아둔 가짜 히스토리 항목을 소비(history.back())하는 것까지
  // 책임진다. 반대로 사용자가 진짜 뒤로가기를 눌러서 오는 경우(popstate)는 이미
  // 브라우저가 알아서 해당 히스토리 항목을 소비했으므로, history.back()을 또
  // 부르지 않고 화면만 지운다 - 이 둘을 구분하기 위해 dsSuppressPopstate 플래그를 쓴다.
  var dsOverlayStack = [];
  var dsSuppressPopstate = false;
  window.dsOpenOverlay_ = function (closeFn) {
    dsOverlayStack.push(closeFn);
    try { history.pushState({ dsOverlay: true }, ''); } catch (e) { /* 무시 */ }
  };
  window.dsCloseOverlay_ = function () {
    if (!dsOverlayStack.length) return;
    var closeFn = dsOverlayStack.pop();
    closeFn();
    dsSuppressPopstate = true;
    history.back();
  };
  window.addEventListener('popstate', function () {
    if (dsSuppressPopstate) { dsSuppressPopstate = false; return; }
    if (dsOverlayStack.length) {
      var closeFn = dsOverlayStack.pop();
      closeFn();
    }
  });

  function openSheet(innerHtml) {
    ensureStyles();
    var backdrop = document.createElement('div');
    backdrop.className = 'su-backdrop';
    backdrop.innerHTML = '<div class="su-sheet">' + innerHtml + '</div>';
    document.body.appendChild(backdrop);
    // 만들자마자 바로 켜면 transition이 안 먹어서(브라우저가 스타일을 합쳐버림)
    // 한 프레임 늦춰서 클래스를 붙인다 - 그래야 슬며시 떠오르는 느낌이 난다.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { backdrop.classList.add('su-in'); });
    });
    return backdrop;
  }

  function closeSheet(backdrop) {
    backdrop.classList.remove('su-in');
    setTimeout(function () {
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    }, 240);
  }

  // 정보만 보여주고 "확인"만 누르면 되는 경우(예전의 alert() 대체).
  window.showAlert = function (message, opts) {
    opts = opts || {};
    var iconClass = opts.tone === 'warn' ? 'warn' : 'info';
    var icon = opts.tone === 'warn' ? '⚠️' : 'ℹ️';
    var backdrop = openSheet(
      '<div class="su-icon ' + iconClass + '">' + icon + '</div>' +
      '<div class="su-msg"></div>' +
      '<div class="su-btn-row"><button class="su-btn su-ok" type="button">확인</button></div>'
    );
    backdrop.querySelector('.su-msg').textContent = message;
    function close() { closeSheet(backdrop); }
    dsOpenOverlay_(close);
    backdrop.querySelector('.su-ok').onclick = dsCloseOverlay_;
    backdrop.addEventListener('click', function (e) { if (e.target === backdrop) dsCloseOverlay_(); });
  };

  // 예/아니오 선택이 필요한 경우(예전의 confirm() 대체) - onConfirm/onCancel 콜백 방식.
  window.showConfirm = function (message, onConfirm, opts) {
    opts = opts || {};
    var backdrop = openSheet(
      '<div class="su-icon info">❓</div>' +
      '<div class="su-msg"></div>' +
      '<div class="su-btn-row">' +
        '<button class="su-btn su-cancel" type="button">' + (opts.cancelText || '취소') + '</button>' +
        '<button class="su-btn su-ok" type="button">' + (opts.okText || '확인') + '</button>' +
      '</div>'
    );
    backdrop.querySelector('.su-msg').textContent = message;
    // 뒤로가기(popstate)나 바깥 클릭으로 닫히는 건 "취소" 버튼을 일부러 누른 게
    // 아니라 그냥 닫아버린 것에 가깝다 - 예약 이어하기 확인창처럼 onCancel에
    // "임시 저장 지우기" 같은 되돌리기 어려운 동작을 넣어둔 경우, 실수로 뒤로가기
    // 눌렀다가 그게 그대로 지워지면 곤란하다(2026-09-14 확인됨). 그래서 이 경우엔
    // onDismiss(있으면)만 쓰고, 없으면 아무 것도 안 한다 - "취소" 버튼을 직접
    // 눌렀을 때만 onCancel이 확실히 불린다. 실제로 화면을 지우고 콜백을 부르는
    // 건 등록해둔 이 함수 하나뿐이라(dsOpenOverlay_로 한 번만 등록), 어느
    // 경로로 닫히든 정확히 한 번만 실행된다.
    var resultCallback = opts.onDismiss || null;
    function closeFn() {
      closeSheet(backdrop);
      if (resultCallback) resultCallback();
    }
    dsOpenOverlay_(closeFn);
    backdrop.querySelector('.su-cancel').onclick = function () {
      resultCallback = opts.onCancel || null;
      dsCloseOverlay_();
    };
    backdrop.querySelector('.su-ok').onclick = function () {
      resultCallback = onConfirm || null;
      dsCloseOverlay_();
    };
    backdrop.addEventListener('click', function (e) {
      if (e.target !== backdrop) return;
      resultCallback = opts.onDismiss || null;
      dsCloseOverlay_();
    });
  };

  // "반납이 완료되었습니다" 같은 짧은 완료 알림을 화면 가운데에 잠깐 띄웠다가
  // 스스로 사라지게 한다(2026-09-09 사장님 요청 - "화면 가운데에 팝업 알림").
  // 확인 버튼이 필요 없는, 그냥 "됐다"고 알려주기만 하는 용도.
  window.showSuccessToast = function (message, opts) {
    opts = opts || {};
    ensureStyles();
    var toast = document.createElement('div');
    toast.className = 'su-toast';
    toast.innerHTML = '<div class="su-toast-icon">' + (opts.icon || '✅') + '</div>' +
        '<div class="su-toast-msg"></div>';
    toast.querySelector('.su-toast-msg').textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { toast.classList.add('su-toast-in'); });
    });
    var duration = opts.duration || 1800;
    setTimeout(function () {
      toast.classList.remove('su-toast-in');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 250);
    }, duration);
  };

  // "지난번 보관 위치" 같은 작은 사진 썸네일을 눌렀을 때, 화면 가득 크게 보여준다
  // (2026-09-09 사장님 요청 - "사진을 클릭하면 사진이 확대 되게"). 다시 누르면 닫힘.
  window.showImageLightbox = function (photoUrl) {
    ensureStyles();
    var box = document.createElement('div');
    box.className = 'su-lightbox';
    box.innerHTML = '<button class="su-lightbox-close" type="button">×</button>' +
        '<img src="' + photoUrl + '" alt="확대된 사진">';
    document.body.appendChild(box);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { box.classList.add('su-lightbox-in'); });
    });
    function close() {
      box.classList.remove('su-lightbox-in');
      setTimeout(function () {
        if (box.parentNode) box.parentNode.removeChild(box);
      }, 220);
    }
    dsOpenOverlay_(close);
    box.addEventListener('click', dsCloseOverlay_);
  };

  // 링크가 아니라 코드에서 직접 다음 화면으로 넘길 때(확인창 → 대여화면 등)도
  // 같은 방식으로 부드럽게 넘어가도록 쓰는 공용 함수.
  window.navigateWithFade = function (href) {
    document.body.style.transition = 'opacity .16s ease';
    document.body.style.opacity = '0';
    setTimeout(function () { window.location.href = href; }, 150);
  };

  // 현황판/달력/대여화면 사이를 링크로 이동할 때, 화면이 뚝 끊기지 않고 살짝
  // 사라졌다가 다음 화면이 살짝 나타나도록 한다(2026-09-09 사장님 요청 - "다음
  // 창으로 넘어갈때 부드럽게"). 새 탭으로 열기(Ctrl/Cmd/가운데 클릭)나 외부
  // 링크, target이 지정된 링크는 평소대로 그대로 둔다.
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || href.indexOf('javascript:') === 0) return;
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download')) return;
    e.preventDefault();
    document.body.style.transition = 'opacity .16s ease';
    document.body.style.opacity = '0';
    setTimeout(function () { window.location.href = href; }, 150);
  });

  // 2026-09-16 추가 - 깃허브 정적 사이트 이전. 사진(보관 위치 등)을 화면을 열
  // 때마다 전부 미리 불러오지 않고, 실제로 그 사진을 보려고 할 때만 구글 Apps
  // Script의 action=photo로 가져온다(사장님 확인 - "필요할 때만 불러오기"). 같은
  // 파일을 이 세션(탭) 안에서 또 보려고 하면 다시 안 물어보고 바로 재사용한다.
  var _dsPhotoCache_ = {};
  window.dsFetchScannerPhoto_ = function (appsScriptUrl, token, fileId) {
    if (_dsPhotoCache_[fileId]) return Promise.resolve(_dsPhotoCache_[fileId]);
    var url = appsScriptUrl + '?action=photo&token=' + encodeURIComponent(token) +
        '&file_id=' + encodeURIComponent(fileId);
    return fetch(url).then(function (r) { return r.json(); }).then(function (data) {
      if (data.status !== 'ok') throw new Error(data.error || 'photo_fetch_failed');
      _dsPhotoCache_[fileId] = data.data_url;
      return data.data_url;
    });
  };

  // 배포 중 잠깐 화면을 막던 옛 .scanner_maintenance 파일 방식을 대신한다 - 정적
  // 사이트는 서버가 없어 요청을 가로챌 수 없으므로, 화면이 매번 config를 부를
  // 때마다 받아오는 maintenance_mode 값을 보고 스스로 점검 안내를 띄운다. cfg는
  // action=config(또는 list_reservations의 오류 응답)에서 받은 객체 그대로 넘기면
  // 된다. 점검 중이면 true(호출한 쪽은 화면을 더 그리지 말고 멈춰야 함), 아니면
  // false를 돌려주고 기존 배너가 있으면 지운다.
  window.dsCheckMaintenance_ = function (cfg) {
    var existing = document.getElementById('ds-maintenance-banner');
    if (!cfg || !cfg.maintenance_mode) {
      if (existing) existing.remove();
      return false;
    }
    if (existing) return true;
    ensureStyles();
    var box = document.createElement('div');
    box.id = 'ds-maintenance-banner';
    box.innerHTML = '<div class="ds-maint-card"><div class="ds-maint-icon">🔧</div>' +
        '<h1>잠시 점검 중입니다</h1><p>' +
        (cfg.maintenance_message || '스캐너 예약 시스템을 더 좋게 고치고 있어요.<br>몇 분 안에 다시 이용하실 수 있습니다.') +
        '</p><button type="button">다시 확인하기</button></div>';
    document.body.appendChild(box);
    box.querySelector('button').onclick = function () { location.reload(); };
    return true;
  };

  // 홈 화면에 아이콘으로 추가해서 쓰면(PWA "독립 실행형" 모드) 브라우저 주소창과
  // 뒤로/앞으로 버튼이 아예 안 보인다 - 그래서 화면 안에 작게 대신 넣어준다
  // (2026-09-10 사장님 요청 - "뒤로가기, 앞으로 버튼이 있자나 그런것도 만들어줘").
  // 실제 이동은 이 사이트 안 페이지들이 전부 진짜 페이지 이동(location.href)으로
  // 되어 있어서, 브라우저가 원래 갖고 있는 히스토리 기록을 그대로 쓰면 된다 -
  // 새로 기록을 관리할 필요 없이 history.back()/forward() 호출만으로 충분하다.
  function injectHistoryNav_() {
    if (document.getElementById('suHistoryNav')) return;
    ensureStyles();
    var nav = document.createElement('div');
    nav.className = 'su-history-nav';
    nav.id = 'suHistoryNav';
    nav.innerHTML =
      '<button type="button" class="su-history-btn" aria-label="뒤로가기">‹</button>' +
      '<button type="button" class="su-history-btn" aria-label="앞으로가기">›</button>';
    document.body.appendChild(nav);
    var btns = nav.querySelectorAll('.su-history-btn');
    btns[0].onclick = function () { history.back(); };
    btns[1].onclick = function () { history.forward(); };

    // 새로고침 버튼(2026-09-11 사장님 요청 - "새로고침을 할 수 있는 버튼을
    // 만들어줘"). 이 스크립트는 각 페이지 자신의 <script> 블록보다 먼저
    // 실행되므로, 페이지가 window.dsRefresh_를 설정하기 전이다 - DOMContentLoaded
    // (문서 전체 파싱 + 동기 스크립트 실행이 다 끝난 뒤에만 뜨는 이벤트)까지
    // 기다렸다가 확인한다(처음엔 setTimeout(0)으로 했다가, 큰 페이지는 파싱 중간에
    // 타이머가 먼저 실행돼버려서 늦게 실행되도록 이걸로 바꿈 - 2026-09-11).
    // dsRefresh_를 정의해둔 화면(대여화면/예약달력)에서만 이 버튼을 보여주고,
    // 이미 자체 새로고침 버튼이 있는 현황판(scanner_status.html)에는 중복으로
    // 안 생기게 한다.
    function addRefreshButtonIfSupported_() {
      if (typeof window.dsRefresh_ !== 'function') return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'su-history-btn';
      btn.setAttribute('aria-label', '새로고침');
      btn.textContent = '⟳';
      nav.appendChild(btn);
      btn.onclick = function () {
        if (btn.classList.contains('su-refreshing')) return; // 처리 중 연타 방지
        btn.classList.add('su-refreshing');
        function stop() { btn.classList.remove('su-refreshing'); }
        var result;
        try { result = window.dsRefresh_(); } catch (e) { result = null; }
        if (result && typeof result.then === 'function') {
          result.then(stop, stop);
        } else {
          setTimeout(stop, 1500); // 함수가 프라미스를 안 주면 최소한의 시간만.
        }
      };
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', addRefreshButtonIfSupported_);
    } else {
      addRefreshButtonIfSupported_();
    }
  }
  injectHistoryNav_();
})();
