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
    mean: '지방평균시 (출생지 경도만)',
    true: '진태양시 (경도 + 균시차)',
    none: '보정 안 함 (표준시 그대로)'
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
    var help = el.parentNode && el.parentNode.querySelector('.gaon-time-help');
    if (help) help.textContent = HELP;
    el.addEventListener('change', function () { set(el.value); if (onChange) onChange(el.value); });
  }

  window.GaonTime = { get: get, set: set, eotMin: eotMin, offsetMs: offsetMs, bind: bind, LABEL: LABEL, SHORT: SHORT, HELP: HELP, MODES: MODES };
})();
