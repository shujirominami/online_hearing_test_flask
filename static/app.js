// ===== 1) 単語と音源の一覧 =====
const ITEMS = [
  { word: "アカガネ", audio: "audio/mya_10101db-0.wav" },
  { word: "ワラバイ", audio: "audio/mya_10102db-0.wav" },
  { word: "ラシャメン", audio: "audio/mya_10103db-0.wav" },
  { word: "ザイカタ", audio: "audio/mya_10104db-0.wav" },
  { word: "カワヨド", audio: "audio/mya_10105db-0.wav" },
  { word: "タカドノ", audio: "audio/mya_10106db-0.wav" },
  { word: "ドカヒン", audio: "audio/mya_10107db-0.wav" },
  { word: "ソマヤマ", audio: "audio/mya_10108db-0.wav" },
  { word: "サトバラ", audio: "audio/mya_10109db-0.wav" },
  { word: "モロハク", audio: "audio/mya_10110db-0.wav" }
];

// ===== 2) ごく簡単な正規化 =====
function normalize(t) {
  let out = (t || "").trim();

  // カタカナ→ひらがな
  out = out.replace(/[ァ-ン]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );

  // 英字は小文字
  out = out.toLowerCase();

  // ひらがな→ローマ字（簡易）
  const hira =
    "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだぢづでどぱぴぷぺぽばびぶべぼゃゅょっー".split(
      ""
    );
  const roma = [
    "a",
    "i",
    "u",
    "e",
    "o",
    "ka",
    "ki",
    "ku",
    "ke",
    "ko",
    "sa",
    "shi",
    "su",
    "se",
    "so",
    "ta",
    "chi",
    "tsu",
    "te",
    "to",
    "na",
    "ni",
    "nu",
    "ne",
    "no",
    "ha",
    "hi",
    "fu",
    "he",
    "ho",
    "ma",
    "mi",
    "mu",
    "me",
    "mo",
    "ya",
    "yu",
    "yo",
    "ra",
    "ri",
    "ru",
    "re",
    "ro",
    "wa",
    "wo",
    "n",
    "ga",
    "gi",
    "gu",
    "ge",
    "go",
    "za",
    "ji",
    "zu",
    "ze",
    "zo",
    "da",
    "ji",
    "zu",
    "de",
    "do",
    "pa",
    "pi",
    "pu",
    "pe",
    "po",
    "ba",
    "bi",
    "bu",
    "be",
    "bo",
    "ya",
    "yu",
    "yo",
    "tsu",
    "",
    ""
  ];
  for (let i = 0; i < hira.length; i++) {
    out = out.replaceAll(hira[i], roma[i] || "");
  }

  // 伸ばし棒削除
  out = out.replaceAll("ー", "");

  return out;
}

// ===== 3) 状態とUI =====
const a = document.getElementById("audio");
const sid = document.getElementById("sid");
const idxSpan = document.getElementById("idx");
const totalSpan = document.getElementById("total");
const ans = document.getElementById("ans");
const logT = document.getElementById("log");

let i = 0,
  replay = 0,
  rec = [];

totalSpan.textContent = ITEMS.length;
updateUI();

document.getElementById("play").onclick = () => play(false);
document.getElementById("repeat").onclick = () => play(true);
document.getElementById("submit").onclick = submit;
document.getElementById("skip").onclick = () => {
  ans.value = "";
  submit(true);
};
document.getElementById("download").onclick = downloadCSV;
document.getElementById("reset").onclick = resetAll;
document.getElementById("tone").onclick = playTone;
ans.addEventListener("keydown", e => {
  if (e.key === "Enter") submit();
});

function updateUI() {
  idxSpan.textContent = Math.min(i + 1, ITEMS.length);
  ans.focus();
}

function play(isRepeat) {
  const item = ITEMS[i];
  if (!item) return;
  a.src = item.audio;
  a.play()
    .then(() => {
      if (isRepeat) replay++;
      else replay = 0;
    })
    .catch(() => alert("音源が見つかりません: " + item.audio));
}

function playTone() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 1000;
  g.gain.value = 0.1;
  osc.connect(g).connect(ctx.destination);
  osc.start();
  setTimeout(() => osc.stop(), 500);
}

function submit(skipped) {
  const item = ITEMS[i];
  if (!item) return;
  const goldN = normalize(item.word);
  const ansN = normalize(skipped ? "" : ans.value);
  const ok = !skipped && ansN && ansN === goldN;
  rec.push({
    subject: sid.value || "",
    index: i + 1,
    word: item.word,
    gold: goldN,
    resp: ansN,
    correct: ok ? 1 : 0,
    replay
  });

  const tr = document.createElement("tr");
  tr.innerHTML = `<td>${i + 1}</td><td>${item.word}</td><td>${goldN}</td><td>${ansN}</td><td>${ok ? "◯" : "×"}</td><td>${replay}</td>`;
  logT.appendChild(tr);

  i++;
  replay = 0;
  ans.value = "";

  if (i >= ITEMS.length) {
    // 全問題終了 → サーバ送信
    sendResultToServer();
    alert("終了しました。CSVを保存できます。");
  }

  updateUI();
}

function sendResultToServer() {
  let correctCount = 0;
  rec.forEach(r => {
    if (r.correct === 1) correctCount++;
  });
  const scorePercent = ((correctCount / rec.length) * 100).toFixed(1) + "%";

  const payload = {
    subjectId: sid.value || "",
    timestamp: new Date().toISOString(),
    score: scorePercent,
    records: rec
  };

  fetch("/api/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  })
    .then(res => {
      if (!res.ok) throw new Error("HTTP エラー " + res.status);
      return res.json();
    })
    .then(data => {
      console.log("送信成功:", data);
    })
    .catch(err => {
      console.error("送信失敗:", err);
      alert("サーバへの送信に失敗しました。ネットワークを確認してください。");
    });
}

function downloadCSV() {
  if (rec.length === 0) {
    alert("結果がありません");
    return;
  }
  const header = ["subject", "index", "word", "gold", "resp", "correct", "replay"];
  const rows = rec.map(r => [r.subject, r.index, r.word, r.gold, r.resp, r.correct, r.replay]);
  const csv = [header, ...rows]
    .map(r => r.map(x => `"${String(x).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const atag = document.createElement("a");
  atag.href = url;
  atag.download = "result.csv";
  atag.click();
  URL.revokeObjectURL(url);
}

function resetAll() {
  location.reload();
}
