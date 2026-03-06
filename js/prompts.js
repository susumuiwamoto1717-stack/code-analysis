// Prompt generators for each analysis step

const Prompts = {
  // Step 1: Overview
  overview(repoName, description, languages, fileTree, keyFiles) {
    return `あなたはプログラミング学習者のためのコード分析の専門家です。
以下のGitHubリポジトリを分析して、初心者が「まず何を見ればいいか」を教えてください。

## リポジトリ情報
- 名前: ${repoName}
- 説明: ${description || 'なし'}
- 言語: ${JSON.stringify(languages)}

## ファイル構成
${fileTree}

## 主要ファイルの内容
${keyFiles.map(f => `### ${f.path}\n\`\`\`\n${f.content.slice(0, 3000)}\n\`\`\``).join('\n\n')}

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
${keyFiles.map(f => `### ${f.path}\n\`\`\`\n${f.content.slice(0, 4000)}\n\`\`\``).join('\n\n')}

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
${keyFiles.map(f => `### ${f.path}\n\`\`\`\n${f.content.slice(0, 4000)}\n\`\`\``).join('\n\n')}

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
  }
};
