// Tarayıcı tarafı: bölümü canvas'a çizer, render betiğine kare verir.
import { W, H, Section } from "./core";
import { s01 } from "../sections/s01";
import { s02 } from "../sections/s02";
import { s03 } from "../sections/s03";
import { s04 } from "../sections/s04";
import { s06 } from "../sections/s06";
import { s07 } from "../sections/s07";
import { s08 } from "../sections/s08";
import { s09 } from "../sections/s09";
import { s10 } from "../sections/s10";

const SECTIONS: Record<string, Section> = { s01, s02, s03, s04, s06, s07, s08, s09, s10 };

declare global { interface Window { __init: (id: string) => Promise<any>; __frames: (ts: number[], q: number) => string[] } }

let sec: Section;
const canvas = document.createElement("canvas");
canvas.width = W; canvas.height = H;
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d")!;

window.__init = async (id: string) => {
  sec = SECTIONS[id];
  // fontlar yüklenmeden çizim yok
  const probe = "気づかれても数えられない面談頑張ってるね頼りにしているよ人事評価前年度今年度特に大きな成果はないけどわかってるからあいまい低い私も同じことを言われた知ってる下がったよくあるうちも去年珍しくない嘘ではなかった流れ直属部長本部長会議最後に決める説明しなければ印象言葉にできる売上納期短縮やったこと障害予兆件つぶした引き継ぎ資料整備新人質問毎日夜間先回り伝えてほしい交渉材料見ている人≠見ること別の二つ形✕○＋？…／思い出せるもの助かった起きなかった日実験男性女性有名人無名多かった一人少ない利用可能性ヒューリスティック鮮明評価シート例なし防がれた問題半年前先週派手静か事故火事月佐藤鈴木高橋田中渡辺伊藤山本中村小林加藤吉田山田佐々木山口松本井上木村林清水斎藤山崎森池田橋本阿部石川前田藤田小川岡田後藤長谷川村上近藤坂本遠藤青木藤井西村健一誠翔浩亮大輔剛悠学隆拓修淳豊聡実徹和也稔恵彩由美舞奈々真理香愛友美優子沙織紀子薫綾千尋結衣早苗瞳智子文記憶探報告会議対応保守週報朝会発言提案障害締切前夜欠員納品鮮明点防がれた火事英雄手柄消火予防後回し方針上層部頼もしい跡現場整拾潰思い出されるのは誰か思考実験顕著性効果上司席報告評価記憶冒頭非注意性盲目評価記憶あいう0123456789%↑→◎✓、。「」ぐすずそだひふべみろんチムメモ不仕何値側入内分力努合向器困外客当必残求浮済漏確社答自褒要課論足込追違隣領顧！—ごぱびへァイェエカコゼドハフプベラルレロン三任企体傾全勤化十協寛左差幕幹座徴心忘怠持断時書末来横正比然献画研立終者誤調貢責逆選重顔（）🛡ぞむょアゴバピミ僚初割労受呂呼変姿家嵐己役担掃支暮止洗濯皿相管続緒署聞職苦落話認語買超身降除離風";
  await Promise.all([
    document.fonts.load(`400 40px "Noto Sans CJK JP"`, probe),
    document.fonts.load(`500 40px "Noto Sans CJK JP"`, probe),
    document.fonts.load(`700 40px "Noto Sans CJK JP"`, probe),
    document.fonts.load(`600 40px "Noto Serif CJK JP"`, probe),
    document.fonts.load(`700 40px "Noto Serif CJK JP"`, probe),
    document.fonts.load(`500 40px "Noto Sans JP"`, probe),
    document.fonts.load(`700 40px "Noto Serif JP"`, probe),
  ]);
  return { duration: sec.duration, cues: sec.cues, parts: sec.parts.map((p) => ({ audio: p.timing.audio, at: p.at })) };
};

window.__frames = (ts: number[], q: number) =>
  ts.map((t) => { sec.draw(ctx, t); return canvas.toDataURL("image/jpeg", q); });
