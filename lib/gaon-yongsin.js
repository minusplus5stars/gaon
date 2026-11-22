/* 가온 공통: 강약·용신 간이 판정 (억부 + 합 반영)
 *
 * 가중치: 월지 ×3, 일지 ×1.5, 연간·연지·월간·시간·시지 ×1 (일간 제외)
 * 지지 오행: 본기 기준. 단 합이 있으면 아래 순서로 바꿔 계산
 *   1) 방합 완성 (寅卯辰 木, 巳午未 火, 申酉戌 金, 亥子丑 水) → 세 지지 모두 국의 오행
 *   2) 삼합 완성 (申子辰 水, 亥卯未 木, 寅午戌 火, 巳酉丑 金) → 세 지지 모두 국의 오행
 *   3) 반합 (왕지 子午卯酉를 낀 삼합 두 글자, 서로 붙어 있을 때) → 두 지지 각각 절반만 국의 오행
 *   4) 천간합 (붙어 있는 두 천간) → 월지 오행이 합화 오행과 같거나 그것을 생할 때만 화(化)
 *      일간이 낀 합, 한 글자가 둘과 합하는 쟁합은 표시만 하고 바꾸지 않음
 * 강약: (비겁+인성) / 전체 < 42% 신약, > 55% 신강, 그 사이 중화
 * 용신: 신약 → 인성(인성이 이미 넉넉하면 비겁), 희신은 나머지 하나
 *       신강 → 식상·재성·관성 중 가장 약한 것, 희신은 그것을 생하는 오행
 *       중화 → 가장 모자란 오행, 희신은 그것을 생하는 오행
 *       기신 = 용신을 극하는 오행, 구신 = 기신을 생하는 오행
 * 조후: 亥子丑월에 火 1개 이하 / 巳午未월에 水 1개 이하 → 따로 안내 (용신은 그대로)
 */
(function () {
  var S = '甲乙丙丁戊己庚辛壬癸', B = '子丑寅卯辰巳午未申酉戌亥', EH = '木火土金水', EK = ['목', '화', '토', '금', '수'];
  var BR_EL = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
  var sEl = function (s) { return Math.floor(s / 2); };
  var BANGHAP = [[[2, 3, 4], 0], [[5, 6, 7], 1], [[8, 9, 10], 3], [[11, 0, 1], 4]];
  var SAMHAP = [[[8, 0, 4], 4], [[11, 3, 7], 0], [[2, 6, 10], 1], [[5, 9, 1], 3]]; // [생지, 왕지, 묘지]
  var STEMHAP = [[0, 5, 2], [1, 6, 3], [2, 7, 4], [3, 8, 0], [4, 9, 1]]; // 甲己土 乙庚金 丙辛水 丁壬木 戊癸火
  var WT = { y: 1, m: 3, d: 1.5, h: 1 }, SWT = { y: 1, m: 1, h: 1 };

  // p: {yS,yB,mS,mB,dS,dB,hS,hB} (천간 0~9, 지지 0~11, 시를 모르면 hS/hB = null)
  function analyze(p) {
    var de = sEl(p.dS), res = (de + 4) % 5;
    var order = ['y', 'm', 'd', 'h'];
    var br = order.map(function (k) { return p[k + 'B']; });
    var dist = br.map(function (b) { return b == null ? null : [[BR_EL[b], 1]]; });
    var locked = br.map(function () { return false; });
    var combos = [];
    var has = function (b) { return br.indexOf(b) >= 0; };
    var setGuk = function (members, el, label) {
      br.forEach(function (b, i) { if (b != null && members.indexOf(b) >= 0 && !locked[i]) { dist[i] = [[el, 1]]; locked[i] = true; } });
      combos.push({ type: label, text: members.map(function (b) { return B[b]; }).join('') + ' ' + label + ' → ' + EH[el] + '국', el: el });
    };
    // 1) 방합 2) 삼합 (완성)
    BANGHAP.forEach(function (x) { if (x[0].every(has)) setGuk(x[0], x[1], '방합'); });
    SAMHAP.forEach(function (x) { if (x[0].every(has) && x[0].some(function (b) { return !locked[br.indexOf(b)]; })) setGuk(x[0], x[1], '삼합'); });
    // 3) 반합 (왕지 포함, 인접)
    var half = br.map(function () { return false; });
    SAMHAP.forEach(function (x) {
      var m = x[0], el = x[1], pairs = [[m[0], m[1]], [m[1], m[2]]];
      for (var i = 0; i < 3; i++) {
        var a = br[i], c = br[i + 1];
        if (a == null || c == null || locked[i] || locked[i + 1] || half[i] || half[i + 1]) continue;
        var ok = pairs.some(function (q) { return (q[0] === a && q[1] === c) || (q[0] === c && q[1] === a); });
        if (!ok) continue;
        [i, i + 1].forEach(function (j) { var base = BR_EL[br[j]]; dist[j] = base === el ? [[el, 1]] : [[base, 0.5], [el, 0.5]]; half[j] = true; });
        combos.push({ type: '반합', text: B[a] + B[c] + ' 반합 → ' + EH[el] + ' 기운 절반', el: el });
      }
    });
    // 월지 오행 (합 반영 후, 절반이면 국의 오행)
    var mDist = dist[1] || [[BR_EL[p.mB], 1]];
    var mEl = mDist[mDist.length - 1][0];
    // 4) 천간합
    var stems = [p.yS, p.mS, p.dS, p.hS];
    var sDist = stems.map(function (s) { return s == null ? null : sEl(s); });
    var partners = stems.map(function () { return 0; });
    var found = [];
    for (var i = 0; i < 3; i++) {
      var a = stems[i], c = stems[i + 1];
      if (a == null || c == null) continue;
      STEMHAP.forEach(function (h) {
        if ((a === h[0] && c === h[1]) || (a === h[1] && c === h[0])) { found.push([i, i + 1, h[2], S[h[0]] + S[h[1]]]); partners[i]++; partners[i + 1]++; }
      });
    }
    found.forEach(function (f) {
      var name = f[3] + '합 ' + EH[f[2]];
      var hua = mEl === f[2] || (mEl + 1) % 5 === f[2];
      if (partners[f[0]] > 1 || partners[f[1]] > 1) { if (!combos.some(function (c) { return c.text === name + ' (쟁합 · 화하지 않음)'; })) combos.push({ type: '천간합', text: name + ' (쟁합 · 화하지 않음)', el: f[2] }); return; }
      if (f[0] === 2 || f[1] === 2) { combos.push({ type: '천간합', text: name + (hua ? ' (일간 합 · 화 여부는 상담에서 판단)' : ' (일간 합 · 월령이 돕지 않아 화하지 않음)'), el: f[2] }); return; }
      if (!hua) { combos.push({ type: '천간합', text: name + ' (월령이 돕지 않아 화하지 않음)', el: f[2] }); return; }
      sDist[f[0]] = f[2]; sDist[f[1]] = f[2];
      combos.push({ type: '천간합', text: name + ' → 화(化)', el: f[2] });
    });
    // 가중치 합산 (일간 제외)
    var w = [0, 0, 0, 0, 0], tot = 0;
    order.forEach(function (k, i) {
      if (k !== 'd' && sDist[i] != null) { w[sDist[i]] += SWT[k]; tot += SWT[k]; }
      if (dist[i]) dist[i].forEach(function (x) { w[x[0]] += WT[k] * x[1]; tot += WT[k] * x[1]; });
    });
    var ratio = tot ? (w[de] + w[res]) / tot : 0.5;
    var wc = w.slice(); wc[de] += 1; // 비교용: 일간 자신 포함
    var state, yong, hee;
    if (ratio < 0.42) { state = '신약'; yong = wc[res] >= 4 ? de : res; hee = yong === res ? de : res; }
    else if (ratio > 0.55) {
      state = '신강';
      var c3 = [(de + 1) % 5, (de + 2) % 5, (de + 3) % 5].sort(function (a, b) { return wc[a] - wc[b]; });
      yong = c3[0]; hee = (yong + 4) % 5; if (hee === de || hee === res) hee = (yong + 1) % 5;
    } else { state = '중화'; yong = [0, 1, 2, 3, 4].sort(function (a, b) { return wc[a] - wc[b]; })[0]; hee = (yong + 4) % 5; }
    var gi = (yong + 3) % 5, gu = (gi + 4) % 5;
    var fav = [0, 0, 0, 0, 0]; fav[gu] = -0.5; fav[gi] = -1; fav[hee] = 0.6; fav[yong] = 1;
    // 조후 (원래 글자 개수 기준, 일간 포함)
    var raw = [0, 0, 0, 0, 0];
    stems.forEach(function (s) { if (s != null) raw[sEl(s)]++; });
    br.forEach(function (b) { if (b != null) raw[BR_EL[b]]++; });
    var johu = null;
    if ([11, 0, 1].indexOf(p.mB) >= 0 && raw[1] <= 1) johu = { e: 1, t: '겨울(亥子丑월) 생이라 원국이 찹니다. 용신과 별개로 볕과 온기를 꼭 더하세요.' };
    if ([5, 6, 7].indexOf(p.mB) >= 0 && raw[4] <= 1) johu = { e: 4, t: '여름(巳午未월) 생이라 원국이 뜨겁고 마릅니다. 용신과 별개로 습도와 서늘함을 더하세요.' };
    return { de: de, res: res, w: w, tot: tot, ratio: ratio, state: state, yong: yong, hee: hee, gi: gi, gu: gu, fav: fav, johu: johu, combos: combos, raw: raw };
  }

  var RULE = '월지 ×3·일지 ×1.5 가중치로 비겁·인성 비율을 봅니다(42% 미만 신약, 55% 초과 신강). 방합·삼합이 완성되면 그 지지를 국의 오행으로, 왕지를 낀 붙은 반합은 절반만, 천간합은 월령이 도울 때만 화한 것으로 계산합니다. 격국·충·지장간 중기까지 본 판단이 다르면 상담에서 보정하세요.';

  function combosText(a) { return a.combos.length ? a.combos.map(function (c) { return c.text; }).join(' · ') : ''; }

  window.GaonYongsin = { analyze: analyze, RULE: RULE, combosText: combosText, EH: EH, EK: EK };
})();
