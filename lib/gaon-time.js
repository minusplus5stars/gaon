/* 가온 공통: 사주 시각 보정 방식
 * mean = 지방평균시 (출생지 경도만 보정, 기본값)
 * true = 진태양시 (경도 + 균시차)
 * none = 보정 안 함 (그 당시 표준시 그대로)
 * 한 도구에서 고른 방식은 가온의 다른 사주 도구에도 그대로 적용된다.
 */
(function () {
  var KEY = 'gaon-time-mode';
  var MODES = ['mean', 'true', 'none'];
  var LABEL = {
    mean: '지방평균시 (경도 보정)',
    true: '진태양시 (경도+균시차)',
    none: '표준시 (보정 없음)'
  };
  var SHORT = { mean: '지방평균시', true: '진태양시', none: '표준시' };
  var HELP = '지방평균시는 한국에서 많이 쓰는 방식이에요. 진태양시는 계절에 따라 해가 평균보다 앞서거나 늦는 차이(균시차, 최대 약 ±16분)까지 반영해요. 고른 방식은 가온의 다른 사주 도구에도 똑같이 적용돼요.';

  function get() {
    try { var v = localStorage.getItem(KEY); if (MODES.indexOf(v) >= 0) return v; } catch (e) {}
    return 'mean';
  }
  function set(v) { if (MODES.indexOf(v) < 0) return; try { localStorage.setItem(KEY, v); } catch (e) {} }

  // 균시차(분): 진태양시 − 평균태양시. NOAA/Meeus 식, 오차 수 초 이내.
  function eotMin(utcMs) {
    var jd = utcMs / 86400000 + 2440587.5, T = (jd - 2451545) / 36525, R = Math.PI / 180;
    var L0 = (280.46646 + 36000.76983 * T + 0.0003032 * T * T) * R;
    var M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * R;
    var e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
    var om = (125.04 - 1934.136 * T) * R;
    var eps = (23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60 + 0.00256 * Math.cos(om)) * R;
    var y = Math.pow(Math.tan(eps / 2), 2);
    var E = y * Math.sin(2 * L0) - 2 * e * Math.sin(M) + 4 * e * y * Math.sin(M) * Math.cos(2 * L0)
      - 0.5 * y * y * Math.sin(4 * L0) - 1.25 * e * e * Math.sin(2 * M);
    return E * 4 / R;
  }

  // 보정한 "사주용 현지 시각"까지 더할 분: 표준 자오선(UTC) 기준
  // 반환값을 UTC epoch ms 에 더하면 현지 벽시계(UTC 표기) 시각이 된다.
  function offsetMs(mode, utcMs, lon, stdOffsetMin) {
    if (mode === 'none') return stdOffsetMin * 60000;
    var ms = lon * 4 * 60000;
    if (mode === 'true') ms += eotMin(utcMs) * 60000;
    return ms;
  }

  function optionsHTML(sel) {
    return MODES.map(function (m) { return '<option value="' + m + '"' + (m === sel ? ' selected' : '') + '>' + LABEL[m] + '</option>'; }).join('');
  }

  // select 하나를 공통 설정에 연결
  function bind(el, onChange) {
    if (!el) return;
    el.innerHTML = optionsHTML(get());
    el.value = get();
    el.title = HELP;
    // 설명: 제목 옆 ⓘ 버튼 → 말풍선 (칸 높이를 바꾸지 않음)
    var box = el.parentNode;
    var old = box && box.querySelector('.gaon-time-help');
    if (old) old.parentNode.removeChild(old);
    var label = el.closest('label') || (box && box.querySelector('label'));
    if (label && box) {
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'gaon-ti'; btn.textContent = 'ⓘ';
      btn.setAttribute('aria-label', '보정 방식의 차이 보기'); btn.setAttribute('aria-expanded', 'false');
      var tip = document.createElement('span');
      tip.className = 'gaon-tip'; tip.setAttribute('role', 'note'); tip.hidden = true; tip.textContent = HELP;
      // 제목 글자와 ⓘ를 한 줄로 묶기 (세로 정렬 레이아웃에서도 줄이 늘지 않게)
      var head = document.createElement('span');
      head.className = 'gaon-lt';
      var nodes = [];
      for (var n = label.firstChild; n && n !== el; n = n.nextSibling) nodes.push(n);
      nodes.forEach(function (x) { if (x.nodeType === 3) x.textContent = x.textContent.replace(/\s+$/, ''); head.appendChild(x); });
      head.appendChild(btn);
      label.insertBefore(head, label.contains(el) ? el : null);
      box.style.position = 'relative';
      box.appendChild(tip);
      var close = function () { tip.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
      btn.addEventListener('click', function (ev) {
        ev.preventDefault(); ev.stopPropagation();
        tip.hidden = !tip.hidden; btn.setAttribute('aria-expanded', String(!tip.hidden));
      });
      document.addEventListener('click', function (ev) { if (!tip.hidden && ev.target !== btn && !tip.contains(ev.target)) close(); });
      document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') close(); });
    }
    el.addEventListener('change', function () { set(el.value); if (onChange) onChange(el.value); });
  }

  // 접히는 설명 스타일 (모든 도구 공통)
  var css = document.createElement('style');
  css.textContent = '.gaon-time-help{display:none!important}.gaon-lt{display:block;white-space:nowrap}' +
    '.gaon-ti{all:unset;cursor:pointer;display:inline-block;margin-left:4px;font-size:13px;line-height:1;opacity:.55;vertical-align:baseline}' +
    '.gaon-ti:hover,.gaon-ti[aria-expanded=true]{opacity:1}' +
    '.gaon-ti:focus-visible{outline:2px solid currentColor;outline-offset:2px;border-radius:50%}' +
    '.gaon-tip{position:absolute;left:0;right:0;top:100%;margin-top:6px;z-index:50;min-width:240px;max-width:340px;padding:10px 12px;border-radius:8px;' +
    'font:400 12.5px/1.55 "IBM Plex Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif;background:#1C2742;color:#F2F4F8;box-shadow:0 6px 20px rgba(0,0,0,.18)}' +
    '.gaon-tip[hidden]{display:none!important}';
  (document.head || document.documentElement).appendChild(css);

  window.GaonTime = { get: get, set: set, eotMin: eotMin, offsetMs: offsetMs, bind: bind, LABEL: LABEL, SHORT: SHORT, HELP: HELP, MODES: MODES };
})();
