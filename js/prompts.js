// Prompt generators for each analysis step

const Prompts = {
  // Step 1: Overview
  overview(repoName, description, languages, fileTree, keyFiles) {
    return `あなたはプログラミング学習者のためのコード分析の専門家です。
以下のGitHubリポジトリを分析して、初心者が「まず何を見ればいいか」を教えてください。

## リポジトリ情報
- 名前: ${repoName}
- 説明: ${description || "なし"}
- 言語: ${JSON.stringify(languages)}

## ファイル構成
${fileTree}

## 主要ファイルの内容
${keyFiles.map((f) => `### ${f.path}\n\`\`\`\n${f.content.slice(0, 3000)}\n\`\`\``).join("\n\n")}

以下のJSON形式「だけ」で回答してください（説明文は不要、JSONのみ出力）:
{
  "basic_info": {
    "languages": ["使用言語リスト"],
    "framework": "フレームワーク名（なければ\\"なし\\"）",
    "architecture": "アーキテクチャパターン名",
    "scale": "小規模/中規模/大規模",
    "file_count": 数値,
    "description": "このアプリが何をするものか、2-3文で"
  },
  "directory_structure": "ディレクトリ構成のツリー表示（重要なファイルに★マーク付き）",
  "reading_guide": [
    {
      "order": 1,
      "file": "ファイルパス",
      "reason": "なぜこのファイルを最初に見るべきか"
    }
  ]
}`;
  },

  // Step 2: Design Keys
  designKeys(repoName, description, keyFiles, overviewDescription) {
    return `あなたはプログラミング学習者のためのコード分析の専門家です。
以下のリポジトリのコードを読んで「このアプリを動かしている設計の鍵」を分析してください。

## リポジトリ: ${repoName}
## 概要: ${overviewDescription}

## 主要ファイルの内容
${keyFiles.map((f) => `### ${f.path}\n\`\`\`\n${f.content.slice(0, 4000)}\n\`\`\``).join("\n\n")}

以下のJSON形式「だけ」で回答してください（説明文は不要、JSONのみ出力）:
{
  "keys": [
    {
      "title": "鍵の名前（例：状態管理パターン）",
      "english_name": "英語名（例：State Management）",
      "location": "ファイル名:行番号付近",
      "code_snippet": "該当するコード（10行以内）",
      "why_important": "なぜこれが重要か（3文以内）",
      "required_knowledge": ["理解に必要な知識1", "知識2"],
      "thirty_sec_explanation": "30秒で理解できる説明"
    }
  ]
}

鍵は3〜5個、最も重要なものから順に。マクロ（全体設計）→ミクロ（個別テクニック）の順序で。`;
  },

  // Step 3: BUD Analysis
  improvements(repoName, description, keyFiles, overviewDescription) {
    return `あなたはプログラミング学習者のためのコード分析の専門家です。
以下のリポジトリのコードについてBUD分析（Bottlenecks, Unnecessary work, Duplicated work）と改善アイデアを提示してください。

## リポジトリ: ${repoName}
## 概要: ${overviewDescription}

## 主要ファイルの内容
${keyFiles.map((f) => `### ${f.path}\n\`\`\`\n${f.content.slice(0, 4000)}\n\`\`\``).join("\n\n")}

以下のJSON形式「だけ」で回答してください（説明文は不要、JSONのみ出力）:
{
  "bud_analysis": {
    "bottlenecks": [
      {
        "location": "ファイル名:行番号付近",
        "problem": "何が問題か",
        "impact": "どんな影響があるか",
        "suggestion": "どう改善できるか"
      }
    ],
    "unnecessary": [
      {
        "location": "ファイル名:行番号付近",
        "problem": "何が不必要か",
        "suggestion": "どうすれば簡潔になるか"
      }
    ],
    "duplicated": [
      {
        "location": "ファイル名:行番号付近",
        "problem": "何が重複しているか",
        "suggestion": "どうまとめられるか"
      }
    ]
  },
  "concepts_to_know": [
    {
      "name": "関連する設計概念やパターン名",
      "relevance": "このコードのどこに関係するか"
    }
  ]
}`;
  },

  // Step 4: Today's 3 Learnings
  learnings(repoName, overviewDescription, designKeysJson, budJson) {
    return `あなたはプログラミング学習者のためのメンターです。
以下の分析結果をもとに「今回の学び3選」をピックアップしてください。

## リポジトリ: ${repoName}
## 概要: ${overviewDescription}

## 設計の鍵（前ステップの分析結果）
${designKeysJson}

## BUD分析結果（前ステップの分析結果）
${budJson}

選定基準：
- そのアプリの核心を動かしている概念（最優先）
- 複数のファイルにまたがる設計判断（次点）
- 個別の文法や小技は除外
- 「この3つを理解すれば、このアプリの8割が読める」ものを選ぶ

以下のJSON形式「だけ」で回答してください（説明文は不要、JSONのみ出力）:
{
  "learnings": [
    {
      "number": 1,
      "title": "トピック名",
      "english_name": "English Name",
      "where_in_code": "このアプリのどこで使われているか",
      "what_you_can_do": "これを理解すると何ができるようになるか",
      "thirty_sec_code": "30秒で理解できるコード例（Before/After形式推奨）",
      "deep_dive": "さらに深掘りするなら何を調べるか",
      "related_books": "関連する書籍や概念"
    }
  ],
  "summary": "この3つを学ぶことで得られる全体的な力（2文で）"
}`;
  },

  // Step 6: Reverse Engineering - Live Coding Plan
  reversePlan(repoName, overviewDescription, designKeysJson, learningsJson) {
    return `あなたはプログラミング教育の専門家であり、ライブコーディング講師です。
以下のアプリの分析結果をもとに、「このアプリをゼロから自分で作れるようになるためのライブコーディング計画」を逆算して作成してください。

## 対象アプリ: ${repoName}
## 概要: ${overviewDescription}

## このアプリの設計の鍵
${designKeysJson}

## このアプリから得られる学び
${learningsJson}

## 方針
- 完成品から逆算して、「何を・どの順番で・どう作れば」このアプリの設計を体得できるかを考える
- 各ステップは1回のライブコーディングセッション（30〜60分）で完結する粒度にする
- 最初のステップは最もシンプルな骨格から始め、段階的に機能と設計を積み上げる
- 各ステップで「なぜそう作るのか（設計意図）」を明確にする
- 最終ステップ完了時に、元のアプリの核心部分が再現できている状態を目指す

以下のJSON形式「だけ」で回答してください（説明文は不要、JSONのみ出力）:
{
  "total_sessions": 数値,
  "goal": "この計画を完了すると何ができるようになるか（1文）",
  "prerequisite": "前提として必要な知識・環境",
  "sessions": [
    {
      "number": 1,
      "title": "セッションタイトル（例：状態オブジェクトで画面遷移を作る）",
      "duration_min": 30,
      "objective": "このセッションのゴール（何が動く状態になるか）",
      "design_intent": "なぜこの順番で作るのか（設計上の狙い）",
      "steps": [
        "具体的な作業ステップ1",
        "具体的な作業ステップ2"
      ],
      "key_concepts": ["このセッションで体得する概念1", "概念2"],
      "checkpoint": "完了時の確認方法（例：ブラウザで○○が表示される）"
    }
  ],
  "extension_ideas": [
    {
      "title": "発展課題のタイトル",
      "description": "余力がある場合に挑戦できる追加機能や改善"
    }
  ],
  "summary": "この計画全体を通じて身につく設計力（2文で）"
}`;
  },

  // Step 7: Vibe Coding Playbook
  vibeCoding(
    repoName,
    overviewDescription,
    designKeysJson,
    learningsJson,
    reversePlanJson,
  ) {
    return `あなたはバイブコーディング（AIと対話しながらアプリを作る手法）の専門家です。
以下のアプリの分析結果をもとに、「このアプリをClaudeなどのAIに指示して作ってもらうための具体的なプロンプト集」をステップバイステップで作成してください。

## 対象アプリ: ${repoName}
## 概要: ${overviewDescription}

## このアプリの設計の鍵
${designKeysJson}

## このアプリから得られる学び
${learningsJson}

## 逆算ライブコーディング計画（参考）
${reversePlanJson}

## 方針
- 各ステップは「AIに投げる1回のプロンプト」= 1つの依頼単位
- 各ステップに以下を必ず含める：
  a) AIに投げる具体的なプロンプト文（そのままコピペで使えるレベル）
  b) AIの回答が返ってきた後の検証方法（何を確認すればOKか）
  c) コードを読むべきか判定（"must_read" / "skim" / "skip"）と、その理由
- "must_read": そのステップの出力コードを理解しないと次に進めない箇所
- "skim": ざっと目を通せばOK（動作確認できれば深く理解しなくてよい）
- "skip": AIに任せて結果だけ確認すればよい
- 最初は最小構成から始め、段階的に機能を積み上げる
- 各ステップ間の依存関係を明確にする
- 失敗しやすいポイントには「つまずきポイント」として注意書きを付ける

以下のJSON形式「だけ」で回答してください（説明文は不要、JSONのみ出力）:
{
  "total_steps": 数値,
  "app_summary": "このアプリを一言で（AIへの最初の説明用）",
  "tech_stack": "使用技術スタック",
  "steps": [
    {
      "number": 1,
      "title": "ステップタイトル（例：プロジェクト骨格の生成）",
      "prompt": "AIに投げる具体的なプロンプト文（そのままコピペで使えるレベルで書く）",
      "expected_output": "このプロンプトでAIが生成するもの（ファイル名・機能の説明）",
      "verification": {
        "method": "検証方法（例：ブラウザで localhost:3000 を開いて○○が表示されることを確認）",
        "success_criteria": "OKの基準（何が見えたら/動いたら成功か）"
      },
      "code_reading": {
        "level": "must_read / skim / skip",
        "reason": "なぜそのレベルか",
        "focus_points": ["読む場合、特に注目すべき箇所"]
      },
      "pitfall": "つまずきやすいポイント（あれば。なければ null）",
      "depends_on": [依存する前ステップの番号リスト]
    }
  ],
  "tips": [
    {
      "title": "バイブコーディングのコツ",
      "description": "このアプリを作る上での全般的なアドバイス"
    }
  ],
  "summary": "このPlaybookを通じて得られるバイブコーディングスキル（2文で）"
}`;
  },
};
