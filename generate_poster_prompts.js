// Generate Nanobanana poster prompts for all 21 repos
const fs = require('fs');

const batch1 = JSON.parse(fs.readFileSync('analysis_batch1.json', 'utf8'));
const batch2 = JSON.parse(fs.readFileSync('analysis_batch2.json', 'utf8'));
const batch3 = JSON.parse(fs.readFileSync('analysis_batch3.json', 'utf8'));

const allRepos = [...batch1, ...batch2, ...batch3];

function buildLearningObject(titleStr, repo) {
  return {
    title: titleStr,
    english_name: '',
    where_in_code: `${repo.repo} (${repo.framework})`,
    what_you_can_do: `「${titleStr}」の概念を理解し、自分のプロジェクトに適用できる`,
    thirty_sec_code: '',
    deep_dive: `${repo.framework}における${titleStr}の実践的な実装パターンと設計判断`,
  };
}

function generatePrompt(repo) {
  const learnings = repo.learnings.slice(0, 3).map(l => buildLearningObject(l, repo));
  const titles = learnings.map(l => l.title).join(' / ');

  const concreteBlocks = learnings.map(l =>
    `【${l.title}】\n- 具体的な使用箇所: ${l.where_in_code}\n- 対象アプリ: ${repo.title}（${repo.description}）\n- フレームワーク: ${repo.framework}\n- 規模: ${repo.scale}（ファイル数: ${repo.file_count}）`
  ).join('\n\n');

  const abstractBlocks = learnings.map(l =>
    `【${l.title}】\n- ${l.title}の構造、因果関係、構成要素の分解\n- 関連する設計パターンとの比較\n- ボトルネックと問題発生メカニズム`
  ).join('\n\n');

  const reAbstractBlocks = learnings.map(l =>
    `【${l.title}】\n- 本質的な設計思想と判断軸\n- トレードオフと技術選定基準\n- ${l.deep_dive}`
  ).join('\n\n');

  const superConcreteBlocks = learnings.map(l =>
    `【${l.title}】\n- ${l.what_you_can_do}\n- 実装手順と活用チェックリスト\n- 次のステップへの発展`
  ).join('\n\n');

  return `あなたは Nanobanana_Technical_Concept_Architect（バージョン2026.03_TechnicalPoster_JP_Compact）です。
複雑な技術テーマを「具体化→抽象化→再抽象化→超具体化」の4段階で整理し、日本語・高密度・A0/A1大判印刷向けの技術ポスター図解として可視化する専門家として、以下のポスターを1枚で作成してください。

========================================
テーマ: 「${repo.title}」のコード分析から学ぶ3つの鍵
サブタイトル: ${titles}
対象読者: プログラミング初学者〜中級者。技術の全体像・構造・本質・実務への落とし込みを1枚で深く理解したい学習者
アプリ概要: ${repo.description}
技術スタック: ${repo.framework} | ${repo.architecture}
========================================

【言語ポリシー】
- 出力は必ず日本語で作成する
- 英語の見出し、英語ラベル、英語UI、英語注釈は原則使用しない
- 専門用語で英語併記が必要な場合も、日本語を主表記とする

【情報密度ポリシー】
- 情報量は多めでよい
- ただし単なる詰め込みではなく、階層、分類、因果、比較、重要度、流れが一目でわかるよう整理する
- 「情報が豊富なのに理解しやすい」状態を目指す

【技術コンテンツの網羅性】
各学びについて、必要に応じて以下を含めること：
定義、背景、目的、前提条件、使用環境、入力と出力、システム構成、主要要素、動作原理、因果関係、情報・信号の流れ、制約条件、主要課題、失敗パターン、ボトルネック、トレードオフ、評価基準、設計判断、実装イメージ、活用方法

========================================
4段階レイアウト構成（横フロー：左→右）
3つの学びは縦方向に行として並べ、各学びが4段階を横断するマトリクス構造にする
========================================

■ 第1段階：具体化（左端 x: 4%〜25%）
目的: 現実の事象、観測される問題、対象システム、前提条件、使用環境、入力情報、具体事例を配置
視覚トーン: organic, tactile, grounded — 手描き風のメモ、付箋、ラフスケッチ

${concreteBlocks}

■ 第2段階：抽象化（中左 x: 26%〜47%）
目的: 具体現象の背後にある構造、機能分解、因果関係、相互作用を整理する
視覚トーン: structured, analytical, minimalist — ボックス、矢印、階層図

${abstractBlocks}

■ 第3段階：再抽象化（中右 x: 49%〜70%）
目的: 本質的原理、設計思想、判断軸、再利用可能な知見を抽出する
視覚トーン: distilled, conceptual, sparse — 概念図、原理の模式図

${reAbstractBlocks}

■ 第4段階：超具体化（右端 x: 72%〜96%）
目的: 理解した原理や判断軸を設計、運用、実装、改善に使える形へ落とし込む
視覚トーン: precise, refined, executable — 手順表、チェックリスト

${superConcreteBlocks}

========================================
デザイン制約
========================================

【キャンバス】
- アスペクト比: 16:9（横長 landscape）
- 背景色: #F7F7F5（オフホワイト）
- A0/A1大判印刷を前提とした解像度・視認性

【カラーパレット】
- メイン: #1F2A37（ダークスレートグレー）
- セカンダリ: #4B5563（ミディアムグレー）
- アクセント: #6B7280（クールグレー）
- 3つの学びの行を色帯で区別:
  - 学び1: ブルー系アクセント
  - 学び2: グリーン系アクセント
  - 学び3: アンバー系アクセント

【視覚スタイル】
- 全体トーン: intellectual, dense but highly structured
- 避けるもの: ネオングロー、ファンタジー風、ゲーム風UI、SF的ノイズ
- 落ち着きがあり知的で現代的な印象

【レイアウトルール】
- フッター余白: キャンバス下部12%〜15%を余白として確保
- コンテンツ領域: キャンバス上部85%〜88%に高密度に配置`;
}

// Generate all prompts
const prompts = allRepos.map((repo, i) => ({
  index: i + 1,
  title: repo.title,
  repo: repo.repo,
  prompt: generatePrompt(repo)
}));

// Save as JSON
fs.writeFileSync('poster_prompts.json', JSON.stringify(prompts, null, 2), 'utf8');

// Also save individual prompt files for easy access
const outputDir = 'poster_prompts';
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

prompts.forEach(p => {
  const filename = `${String(p.index).padStart(2, '0')}_${p.title.replace(/[\/\\?%*:|"<>]/g, '_')}.txt`;
  fs.writeFileSync(`${outputDir}/${filename}`, p.prompt, 'utf8');
});

console.log(`Generated ${prompts.length} poster prompts`);
console.log('Saved to: poster_prompts.json and poster_prompts/ directory');
