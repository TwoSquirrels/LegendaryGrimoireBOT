// SPDX-License-Identifier: MIT

Array.prototype[Symbol.for("twosquirrels.util.array.random")] =
  function random() {
    return this[Math.floor(Math.random() * this.length)];
  };

function createResponse(body) {
  const response = ContentService.createTextOutput();
  response.setMimeType(ContentService.MimeType.JSON);
  response.setContent(JSON.stringify(body));
  return response;
}

const success = (data) => createResponse({ status: "success", data });
const failure = (error) => createResponse({ status: "failure", error });

const LANG_ALL = {
  af: "アフリカーンス語",
  sq: "アルバニア語",
  am: "アムハラ語",
  ar: "アラビア文字",
  hy: "アルメニア語",
  az: "アゼルバイジャン語",
  eu: "バスク語",
  be: "ベラルーシ語",
  bn: "ベン ガル文字",
  bs: "ボスニア語",
  bg: "ブルガリア語",
  ca: "カタロニア語",
  ceb: "セブ語",
  zh: "中国語（簡体）",
  "zh-TW": "中国語（繁体）",
  co: "コルシカ語",
  hr: "クロアチア語",
  cs: "チェコ語",
  da: "デンマーク語",
  nl: "オランダ語",
  en: "英語",
  eo: "エスペラント語",
  et: "エストニア語",
  fi: "フィンランド語",
  fr: "フランス語",
  fy: "フリジア語",
  gl: "ガリシア語",
  ka: "グルジア語",
  de: "ドイツ語",
  el: "ギリシャ語",
  gu: "グジャラト語",
  ht: "クレオール語（ハイチ）",
  ha: "ハウサ語",
  haw: "ハワイ語",
  he: "ヘブライ語",
  hi: "ヒンディー語",
  hmn: "モン語",
  hu: "ハンガリー語",
  is: "アイスランド語",
  ig: "イボ語",
  id: "インドネシア語",
  ga: "アイルランド語",
  it: "イタリア語",
  ja: "日本語",
  jv: "ジャワ語",
  kn: "カンナダ語",
  kk: "カザフ語",
  km: "クメール語",
  rw: "キニヤルワンダ語",
  ko: "韓国語",
  ku: "クルド語",
  ky: "キルギス語",
  lo: "ラオ語",
  la: "ラテン語",
  lv: "ラトビア語",
  lt: "リトアニア語",
  lb: "ルクセンブルク語",
  mk: "マケドニア語",
  mg: "マラガシ語",
  ms: "マレー語",
  ml: "マラヤーラム文字",
  mt: "マルタ語",
  mi: "マオリ語",
  mr: "マラーティー語",
  mn: "モンゴル語",
  my: "ミャンマー語（ビルマ語）",
  ne: "ネパール語",
  no: "ノルウェー語",
  ny: "ニャンジャ語（チェワ語）",
  or: "オリヤ語",
  ps: "パシュト語",
  fa: "ペルシャ語",
  pl: "ポーランド語",
  pt: "ポルトガル語（ポルトガル、ブラジル）",
  pa: "パンジャブ語",
  ro: "ルーマニア語",
  ru: "ロシア語",
  sm: "サモア語",
  gd: "スコットランド ゲール語",
  sr: "セルビア語",
  st: "セソト語",
  sn: "ショナ語",
  sd: "シンド語",
  si: "シンハラ語",
  sk: "スロバキア語",
  sl: "スロベニア語",
  so: "ソマリ語",
  es: "スペイン語",
  su: "スンダ語",
  sw: "スワヒリ語",
  sv: "スウェーデン語",
  tl: "タガログ語（フィリピン語）",
  tg: "タジク語",
  ta: "タミル語",
  tt: "タタール語",
  te: "テルグ語",
  th: "タイ語",
  tr: "トルコ語",
  tk: "トルクメン語",
  uk: "ウクライナ語",
  ur: "ウルドゥー語",
  ug: "ウイグル語",
  uz: "ウズベク語",
  vi: "ベトナム語",
  cy: "ウェールズ語",
  xh: "コーサ語",
  yi: "イディッシュ語",
  yo: "ヨルバ語",
  zu: "ズールー語",
};

function doGet(request) {
  try {
    let { text, languages } = request.parameter;
    languages = parseInt(languages ?? "10");
    if (Number.isNaN(languages) || languages < 1 || languages > 64)
      throw new Error("言語数は 1~64 で指定してください。");
    let history = [];
    let currentLang;
    const updateLang = (newLang) => {
      currentLang = newLang;
      history.push({ lang: newLang, name: LANG_ALL[newLang] });
    };
    updateLang("ja");
    for (let i = 0; i < languages; i++) {
      const nextLang = Object.keys(LANG_ALL)
        .filter((lang) => lang !== "ja" && lang !== currentLang)
        [Symbol.for("twosquirrels.util.array.random")]();
      text = LanguageApp.translate(text, currentLang, nextLang);
      updateLang(nextLang);
    }
    text = LanguageApp.translate(text, currentLang, "ja");
    updateLang("ja");
    return success({ text, history });
  } catch (error) {
    return failure({ message: error.toString() });
  }
}
