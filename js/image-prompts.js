// Image generation prompt builder for learning topics
// Based on Nanobanana Technical Concept Architect system

const ImagePrompts = {
  // Generate a single combined prompt for all 3 learnings
  generateCombined(learnings, repoName) {
    const titles = learnings.map(l => `${l.title}（${l.english_name}）`).join(' / ');

    // Build per-learning detail blocks for each phase
    const concreteBlocks = learnings.map(l => this._buildConcreteSection(l.title, l.english_name, l.where_in_code, l.thirty_sec_code || '')).join('\n');
    const abstractBlocks = learnings.map(l => this._buildAbstractSection(l.title, l.english_name)).join('\n');
    const reAbstractBlocks = learnings.map(l => this._buildReAbstractSection(l.title, l.english_name, l.deep_dive || '')).join('\n');
    const superConcreteBlocks = learnings.map(l => this._buildSuperConcreteSection(l.title, l.english_name, l.what_you_can_do)).join('\n');

    return `あなたは Nanobanana_Technical_Concept_Architect（バージョン2026.03_TechnicalPoster_JP_Compact）です。
複雑な技術テーマを「具体化→抽象化→再抽象化→超具体化」の4段階で整理し、日本語・高密度・A0/A1大判印刷向けの技術ポスター図解として可視化する専門家として、以下のポスターを1枚で作成してください。

========================================
テーマ: 「${repoName}」のコード分析から学ぶ3つの鍵
サブタイトル: ${titles}
対象読者: プログラミング初学者〜中級者。技術の全体像・構造・本質・実務への落とし込みを1枚で深く理解したい学習者
========================================

【言語ポリシー】
- 出力は必ず日本語で作成する
- 英語の見出し、英語ラベル、英語UI、英語注釈は原則使用しない
- 専門用語で英語併記が必要な場合も、日本語を主表記とする
- 見出し、本文、図中ラベル、凡例、注釈、結論、手順まで日本語で統一する

【情報密度ポリシー】
- 情報量は多めでよい
- ただし単なる詰め込みではなく、階層、分類、因果、比較、重要度、流れが一目でわかるよう整理する
- 見た目の美しさのために重要論点、前提条件、制約、注意点、比較観点を削らない
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
視覚トーン: organic, tactile, grounded — 手描き風のメモ、付箋、ラフスケッチ、実物写真風のモチーフ
配色印象: warm earth tones, kraft paper, soft amber
指示: 混沌を演出しすぎず、観測事実と条件を明瞭に整理する

${concreteBlocks}

■ 第2段階：抽象化（中左 x: 26%〜47%）
目的: 具体現象の背後にある構造、機能分解、因果関係、相互作用を整理する
視覚トーン: structured, analytical, minimalist — ボックス、矢印、階層図、ブロック図、比較表、関係図
配色印象: slate, muted blue, ash gray
指示: ロジカルで見やすい構造化を優先し、関係性がすぐ理解できるようにする

${abstractBlocks}

■ 第3段階：再抽象化（中右 x: 49%〜70%）
目的: 本質的原理、設計思想、判断軸、再利用可能な知見を抽出する
視覚トーン: distilled, conceptual, sparse — 中心に凝縮された概念図、原理の模式図、判断フローチャート
配色印象: muted gray, desaturated blue
指示: 詩的・幻想的にしすぎず、技術者が見て意味が通る抽象化にする

${reAbstractBlocks}

■ 第4段階：超具体化（右端 x: 72%〜96%）
目的: 理解した原理や判断軸を設計、運用、実装、改善に使える形へ落とし込む
視覚トーン: precise, refined, executable — 手順表、実行フロー、チェックリスト、必要最小限のコード断片
配色印象: off-white, charcoal, muted blue-gray
指示: 理想論ではなく、実務ですぐ使える粒度まで明確化する

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
- サブハイライト: #CBD5E1（ライトブルーグレー）
- 背景: #F7F7F5（オフホワイト）
- 区切り線: #D6D9DE
- 3つの学びの行を色帯で区別:
  - 学び1: ブルー系アクセント
  - 学び2: グリーン系アクセント
  - 学び3: アンバー系アクセント

【視覚スタイル】
- 全体トーン: intellectual, dense but highly structured
- 避けるもの: ネオングロー、ファンタジー風エフェクト、過度にカラフルな構成、ゲーム風UI、SF的ノイズ、雑然としたホワイトボード風
- 落ち着きがあり知的で現代的な印象

【タイポグラフィ印象】
- 大見出し: 落ち着きがあり知的で現代的
- 小見出し: 構造が見える上品な見出し
- 本文: 読みやすく整理された日本語組版
- ラベル: 小さくても判読性が高い
- A1/A0大判印刷での視認性を意識し、見出し・本文・注釈の階層差を明確にする

【レイアウトルール】
- 各段階の区切り: 上品で薄い縦区切り線またはスペーシングリズムで連続性を保つ
- フッター余白: キャンバス下部12%〜15%を余白として確保（後から注釈・補足・メモを書き込むため）。ここには何も描画しない
- コンテンツ領域: キャンバス上部85%〜88%に高密度に配置しつつ、圧迫感なく自然な読み順をつくる

【読み順の階層ルール】
各段階内で以下の順で自然に理解が深まるようにする:
1. 大見出し（何の話か）
2. 具体的事実・データ
3. 構造と関係
4. 本質と判断軸
5. 実務活用と次のアクション

【ポスター判読性ルール（A0/A1印刷前提）】
- 遠目で全体構造がわかる
- 近くで詳細情報が読める
- 大見出しだけでも概略が伝わる
- 小項目まで読むと理解が深まる
- 図、表、短文、注釈がバランスよく配置されている
- 技術者のレビュー・議論の土台として使える完成度

========================================
品質チェックリスト
========================================
- [ ] 3つの学びの関連性・共通点・違いが視覚的に分かるか
- [ ] 技術テーマとしての因果や構造が見えるか
- [ ] 具体→抽象→再抽象→超具体の4段階フローが成立しているか
- [ ] 情報量は多いが雑然としていないか
- [ ] A0/A1印刷で読む価値があるか
- [ ] 見出しだけでも全体像が伝わるか
- [ ] 詳細を読むと理解が深まるか
- [ ] 実務や学習に使えるか
- [ ] 派手すぎず知的で上質か`;
  },

  // Generate image prompt for a single learning topic (kept for reference)
  generate(learning, repoName) {
    const title = learning.title;
    const englishName = learning.english_name;
    const whereInCode = learning.where_in_code;
    const whatYouCanDo = learning.what_you_can_do;
    const codeExample = learning.thirty_sec_code || '';
    const deepDive = learning.deep_dive || '';

    return `以下の技術概念について、日本語の大判印刷向け技術ポスター図解を1枚で作成してください。

【テーマ】${title}（${englishName}）
【文脈】GitHubリポジトリ「${repoName}」のコード分析から抽出された学習トピック
【実際の使用箇所】${whereInCode}
【この概念を理解するとできること】${whatYouCanDo}

【最優先条件】
- 必ず日本語で作成する（英語見出し・英語ラベルは原則使わない）
- 技術テーマとして扱う
- 情報量は多めにするが、階層化・整理・余白設計・視線誘導で読みやすさを維持
- 1枚で「${title}」の全体理解が深まるレベルまで網羅的に構成する
- 雰囲気重視ではなく、理解促進・説明力・実用性を優先する

【4段階構成（左→右の横フロー）】

■ 左（4%〜25%）：具体化
${this._buildConcreteSection(title, englishName, whereInCode, codeExample)}

■ 中左（26%〜47%）：抽象化
${this._buildAbstractSection(title, englishName)}

■ 中右（49%〜70%）：再抽象化
${this._buildReAbstractSection(title, englishName, deepDive)}

■ 右（72%〜96%）：超具体化
${this._buildSuperConcreteSection(title, englishName, whatYouCanDo)}

【デザイン仕様】
- キャンバス: 16:9 横向き
- 背景色: #F7F7F5（オフホワイト）
- メインカラー: #1F2A37（ダークグレー）
- セカンダリ: #4B5563（ミディアムグレー）
- アクセント: #6B7280（クールグレー）
- サブハイライト: #CBD5E1（ライトブルーグレー）
- 区切り線: #D6D9DE

【視覚スタイル】
- 落ち着きがあり知的で現代的な印象
- ネオン、ゲーム風UI、SF的ノイズは使わない
- 図・表・短文・注釈がバランスよく配置
- 見出しだけでも概略が伝わり、詳細を読むと理解が深まる構造
- 下部12〜15%は余白として確保（メモ書き込み用）

【品質チェック】
- 技術テーマとしての因果や構造が見えるか
- 具体→抽象→再抽象→超具体の流れが成立しているか
- 情報量は多いが雑然としていないか
- 見出しだけでも全体像が伝わるか
- 実務や学習に使えるか`;
  },

  _buildConcreteSection(title, englishName, whereInCode, codeExample) {
    const sections = {
      '状態管理パターン': `- 現実の問題：アプリの「今どの画面にいるか」「スコアは何点か」「何問目か」をバラバラの変数で管理すると、画面間でデータが食い違うバグが発生する
- 具体的なコード例：stateオブジェクトに全状態を集約し、currentScreen, currentMode, totalCorrect等を一元管理
- 使用環境：ブラウザ上のシングルページアプリケーション
- 入力：ユーザーのキー入力、ボタンクリック
- 出力：画面表示の切り替え、スコア更新、タイマー動作`,

      'イベント駆動プログラミング': `- 現実の問題：ユーザーがいつキーを押すか分からない。常時監視するとCPUを浪費する
- 具体的なコード例：document.addEventListener('keydown', handleKeyDown) でキー入力を待ち受け
- 使用環境：ブラウザのDOMイベントシステム
- 入力：keydownイベント（e.key で押されたキーを取得）
- 出力：正解/ミスの判定、次の文字への移動、スコア更新`,

      '関心の分離': `- 現実の問題：1つのファイルに全機能を詰め込むと、「記号の読み方を変えたい」だけなのに全コードを読む必要がある
- 具体的なコード例：symbols.js（データ）、app.js（ロジック）、keyboard.js（UI）、style.css（見た目）に分離
- 使用環境：複数ファイルで構成されたWebアプリケーション
- 入力：各ファイルが担当する情報のみ
- 出力：変更の影響範囲が予測可能な構成`,
    };
    return sections[title] || `- 具体的な使用箇所: ${whereInCode}\n- コード例:\n${codeExample}`;
  },

  _buildAbstractSection(title, englishName) {
    const sections = {
      '状態管理パターン': `- 構成要素の分解：State（データ）、View（表示）、Action（操作）の3つの役割
- 因果関係：Action → State変更 → View更新 という一方向のデータフロー
- 分類：ローカルState vs グローバルState、Mutable vs Immutable
- ボトルネック：複数コンポーネントが同じStateを参照する時の整合性
- 比較：オブジェクト1つに集約 vs 分散管理 vs 状態管理ライブラリ
- 問題発生メカニズム：Stateの二重管理 → 片方だけ更新 → 表示と内部状態の不一致`,

      'イベント駆動プログラミング': `- 構成要素の分解：イベント発生源、イベントリスナー、コールバック関数、イベントオブジェクト
- 因果関係：ユーザー操作 → イベント発火 → リスナーが検知 → コールバック実行
- 分類：UIイベント（click, keydown）、カスタムイベント、非同期イベント
- ボトルネック：イベントの伝播順序（バブリング/キャプチャリング）
- 比較：ポーリング（定期確認）vs イベント駆動（通知待ち）
- 問題発生メカニズム：リスナーの解除忘れ → メモリリーク → パフォーマンス劣化`,

      '関心の分離': `- 構成要素の分解：データ層、ロジック層、UI/表示層、スタイル層
- 因果関係：層の分離 → 変更の局所化 → バグ発生範囲の限定
- 分類：水平分離（MVC等）vs 垂直分離（機能モジュール）
- ボトルネック：層をまたぐ依存関係が増えると分離のメリットが薄れる
- 比較：1ファイルに全部 vs 役割別ファイル vs コンポーネント指向
- 問題発生メカニズム：責務の曖昧な境界 → 1つの変更が全体に波及 → 保守コスト増大`,
    };
    return sections[title] || `- ${title}の構造、因果関係、分類、ボトルネックを図解`;
  },

  _buildReAbstractSection(title, englishName, deepDive) {
    const sections = {
      '状態管理パターン': `- 本質：「アプリの真実は1箇所にだけ存在すべき」（Single Source of Truth）
- 設計思想：予測可能性 — 同じStateなら必ず同じ表示になる
- 判断軸：「この情報はどこが所有すべきか？」を常に問う
- トレードオフ：集中管理の安全性 vs 分散管理の柔軟性
- 技術選定基準：アプリの規模とState共有の複雑さで手法を選ぶ
- よくある誤解：「全てをグローバルStateにすれば良い」→ 不要なre-renderの原因`,

      'イベント駆動プログラミング': `- 本質：「制御の反転」— 自分から確認しに行くのではなく、起きたら教えてもらう
- 設計思想：疎結合 — イベント発行者と受信者が互いを知らなくてよい
- 判断軸：「この処理は誰がトリガーすべきか？」
- トレードオフ：柔軟性の高さ vs 処理フローの追いにくさ
- 技術選定基準：UI操作が多い → イベント駆動、バッチ処理 → 手続き型
- よくある誤解：「addEventListener が全て」→ Promise、Stream、WebSocketも同じ原理`,

      '関心の分離': `- 本質：「変更理由が異なるものは分離すべき」（単一責任の原則）
- 設計思想：独立した進化 — 各層が他の層を知らずに改善できる
- 判断軸：「この変更は他のどこに影響するか？」影響範囲が予測不能なら分離不足
- トレードオフ：分離の明確さ vs ファイル数・間接参照の増加
- 技術選定基準：チーム規模と変更頻度で分離粒度を決める
- よくある誤解：「ファイルを分ければ分離」→ 依存関係が密なら分離ではない`,
    };
    return sections[title] || `- ${title}の本質、設計思想、判断軸、トレードオフ\n- 深掘り: ${deepDive}`;
  },

  _buildSuperConcreteSection(title, englishName, whatYouCanDo) {
    const sections = {
      '状態管理パターン': `- 実装手順：
  1. アプリが持つべき状態を全て洗い出す
  2. 1つのオブジェクト（state）にまとめる
  3. 状態変更は専用の関数（setter/dispatch）経由にする
  4. 状態が変わったらViewを再描画する
- チェックリスト：
  □ 同じデータが2箇所以上に存在していないか
  □ 状態変更後に必ず画面が正しく更新されるか
  □ 初期状態が明確に定義されているか
- 次のステップ：React useState → useReducer → Redux/Zustand`,

      'イベント駆動プログラミング': `- 実装手順：
  1. 何のイベントを待つか決める（click, keydown, submit等）
  2. addEventListenerで登録する
  3. コールバック関数で「イベントが来たらどうするか」を書く
  4. 不要になったらremoveEventListenerで解除する
- チェックリスト：
  □ イベントリスナーの解除漏れがないか
  □ e.preventDefault()が必要な箇所で呼んでいるか
  □ イベントの伝播（bubbling）を理解しているか
- 次のステップ：CustomEvent → Observer Pattern → Pub/Sub → WebSocket`,

      '関心の分離': `- 実装手順：
  1. 「このファイルの責務は何か？」を1文で説明できるようにする
  2. 説明に「と」「および」が含まれたら分離を検討する
  3. データ定義、ロジック、UIを別ファイルにする
  4. ファイル間の依存方向を一方向にする
- チェックリスト：
  □ 1ファイル200行以内に収まっているか
  □ ファイル名から責務が推測できるか
  □ テストを書く時に他のファイルのモックが必要か（→多いなら結合度が高い）
- 次のステップ：MVC → コンポーネント設計 → クリーンアーキテクチャ`,
    };
    return sections[title] || `- できること: ${whatYouCanDo}\n- 実装手順と活用チェックリスト`;
  }
};
