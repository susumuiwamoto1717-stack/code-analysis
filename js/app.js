// Main application logic - Copy & Paste workflow

const state = {
  owner: '',
  repo: '',
  repoName: '',
  branch: '',
  repoInfo: null,
  tree: null,
  languages: null,
  keyFiles: [],
  // Analysis results (stored for export and next-step prompts)
  overview: null,
  designKeys: null,
  improvements: null,
  learnings: null,
  currentStep: 0
};

// ===== Step navigation =====
function showStep(stepNum) {
  document.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
  const target = document.getElementById(`step-${stepNum}`);
  if (target) target.classList.remove('hidden');

  state.currentStep = stepNum;

  // Render code map when entering step 5
  if (stepNum === 5) renderCodeMap();

  // Show progress bar from step 1 onwards
  const progressEl = document.getElementById('progress-section');
  if (stepNum >= 1) {
    progressEl.classList.remove('hidden');
    const progress = stepNum >= 5 ? 100 : (stepNum / 4) * 100;
    document.getElementById('progress-fill').style.width = `${progress}%`;
    document.querySelectorAll('.progress-step').forEach(el => {
      const s = parseInt(el.dataset.step);
      el.classList.remove('active', 'completed');
      if (stepNum >= 5) { el.classList.add('completed'); }
      else if (s === stepNum) el.classList.add('active');
      else if (s < stepNum) el.classList.add('completed');
    });
  } else {
    progressEl.classList.add('hidden');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Generate prompt and navigate to step
function generateAndShowStep(stepNum) {
  showStep(stepNum);
  generatePrompt(stepNum);
}

// ===== GitHub fetch =====
document.getElementById('btn-fetch').addEventListener('click', fetchRepo);
document.getElementById('github-url').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') fetchRepo();
});

async function fetchRepo() {
  const url = document.getElementById('github-url').value.trim();
  if (!url) return;

  const loadingEl = document.getElementById('fetch-loading');
  const infoEl = document.getElementById('repo-info');
  const errorEl = document.getElementById('error-section');

  try {
    loadingEl.classList.remove('hidden');
    infoEl.classList.add('hidden');
    errorEl.classList.add('hidden');

    const { owner, repo } = GitHubAPI.parseUrl(url);
    state.owner = owner;
    state.repo = repo;
    state.repoName = repo;

    // Fetch repo data
    const data = await GitHubAPI.getRepoInfo(owner, repo);
    state.repoInfo = data.repo;
    state.tree = data.tree;
    state.languages = data.languages;
    state.branch = data.repo.default_branch;

    // Display repo info
    const grid = document.getElementById('repo-info-grid');
    grid.innerHTML = `
      <div class="info-item"><div class="info-label">リポジトリ</div><div class="info-value">${esc(data.repo.full_name)}</div></div>
      <div class="info-item"><div class="info-label">言語</div><div class="info-value">${esc(Object.keys(data.languages).join(', ') || 'N/A')}</div></div>
      <div class="info-item"><div class="info-label">ファイル数</div><div class="info-value">${data.tree.tree.filter(t => t.type === 'blob').length}</div></div>
    `;

    // Display tree
    document.getElementById('repo-tree').textContent = GitHubAPI.buildTreeDisplay(data.tree);

    // Fetch key files
    const keyFilesMeta = GitHubAPI.selectKeyFiles(data.tree);
    const keyFilesEl = document.getElementById('key-files-list');
    keyFilesEl.innerHTML = '<p class="input-hint">ファイルを読み込み中...</p>';

    const keyFiles = [];
    for (const file of keyFilesMeta) {
      try {
        const content = await GitHubAPI.getFileContent(owner, repo, file.path, state.branch);
        keyFiles.push({ path: file.path, content });
      } catch (e) {
        console.warn(`Skipped: ${file.path}`, e);
      }
    }
    state.keyFiles = keyFiles;

    // Show fetched files
    keyFilesEl.innerHTML = keyFiles.map(f =>
      `<div class="file-item">
        <span class="file-path">${esc(f.path)}</span>
        <span class="file-size">${f.content.length.toLocaleString()} chars</span>
      </div>`
    ).join('');

    loadingEl.classList.add('hidden');
    infoEl.classList.remove('hidden');

  } catch (err) {
    loadingEl.classList.add('hidden');
    document.getElementById('error-message').textContent = err.message;
    errorEl.classList.remove('hidden');
  }
}

// ===== Generate prompt button (Step 0 → Step 1) =====
document.getElementById('btn-generate-prompt').addEventListener('click', () => {
  generateAndShowStep(1);
});

// ===== Prompt generation =====
function generatePrompt(stepNum) {
  const fileTree = state.tree.tree
    .filter(t => t.type === 'blob')
    .filter(f => !f.path.includes('node_modules/') && !f.path.includes('.git/'))
    .map(f => f.path)
    .join('\n');

  let prompt = '';

  switch (stepNum) {
    case 1:
      prompt = Prompts.overview(
        state.repoName,
        state.repoInfo.description,
        state.languages,
        fileTree,
        state.keyFiles
      );
      break;
    case 2:
      prompt = Prompts.designKeys(
        state.repoName,
        state.repoInfo.description,
        state.keyFiles,
        state.overview ? state.overview.basic_info.description : ''
      );
      break;
    case 3:
      prompt = Prompts.improvements(
        state.repoName,
        state.repoInfo.description,
        state.keyFiles,
        state.overview ? state.overview.basic_info.description : ''
      );
      break;
    case 4:
      prompt = Prompts.learnings(
        state.repoName,
        state.overview ? state.overview.basic_info.description : '',
        state.designKeys ? JSON.stringify(state.designKeys.keys, null, 2) : '{}',
        state.improvements ? JSON.stringify(state.improvements.bud_analysis, null, 2) : '{}'
      );
      break;
  }

  document.getElementById(`prompt-${stepNum}`).textContent = prompt;

  // Show input section, hide result
  document.getElementById(`step-${stepNum}-input`).classList.remove('hidden');
  if (document.getElementById(`step-${stepNum}-result`)) {
    // Only hide result if we don't already have data
    const dataKeys = [null, 'overview', 'designKeys', 'improvements', 'learnings'];
    if (!state[dataKeys[stepNum]]) {
      document.getElementById(`step-${stepNum}-result`).classList.add('hidden');
    }
  }
}

// ===== Parse response buttons =====
for (let i = 1; i <= 4; i++) {
  document.getElementById(`btn-parse-${i}`).addEventListener('click', () => parseResponse(i));
}

function parseResponse(stepNum) {
  const raw = document.getElementById(`response-${stepNum}`).value.trim();
  if (!raw) return;

  try {
    const data = extractJSON(raw);

    switch (stepNum) {
      case 1:
        state.overview = data;
        renderOverview(data);
        break;
      case 2:
        state.designKeys = data;
        renderDesignKeys(data);
        break;
      case 3:
        state.improvements = data;
        renderImprovements(data);
        break;
      case 4:
        state.learnings = data;
        renderLearnings(data);
        break;
    }

    // Hide input, show result
    document.getElementById(`step-${stepNum}-input`).classList.add('hidden');
    document.getElementById(`step-${stepNum}-result`).classList.remove('hidden');

  } catch (err) {
    alert('JSONの解析に失敗しました。AIの回答をそのまま貼り付けてください。\n\nエラー: ' + err.message);
  }
}

// ===== Rendering =====

function renderOverview(data) {
  document.getElementById('overview-info').innerHTML = `
    <div class="info-grid">
      <div class="info-item"><div class="info-label">言語</div><div class="info-value">${esc((data.basic_info.languages || []).join(', '))}</div></div>
      <div class="info-item"><div class="info-label">フレームワーク</div><div class="info-value">${esc(data.basic_info.framework)}</div></div>
      <div class="info-item"><div class="info-label">アーキテクチャ</div><div class="info-value">${esc(data.basic_info.architecture)}</div></div>
      <div class="info-item"><div class="info-label">規模</div><div class="info-value">${esc(data.basic_info.scale)}</div></div>
      <div class="info-item"><div class="info-label">ファイル数</div><div class="info-value">${data.basic_info.file_count || '-'}</div></div>
    </div>
    <p style="margin-top:12px;color:#555;font-size:15px;">${esc(data.basic_info.description)}</p>
  `;

  document.getElementById('tree-content').textContent = data.directory_structure || '';

  const list = document.getElementById('reading-guide-list');
  list.innerHTML = '';
  (data.reading_guide || []).forEach(g => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="guide-file">${esc(g.file)}</span><span class="guide-reason">${esc(g.reason)}</span>`;
    list.appendChild(li);
  });
}

function renderDesignKeys(data) {
  const container = document.getElementById('design-keys-container');
  container.innerHTML = '';
  (data.keys || []).forEach((key, i) => {
    const card = document.createElement('div');
    card.className = 'key-card';
    card.innerHTML = `
      <div class="key-title">鍵${i + 1}: ${esc(key.title)}</div>
      <div class="key-english">${esc(key.english_name)}</div>
      <div class="key-location">${esc(key.location)}</div>
      <div class="key-why">${esc(key.why_important)}</div>
      ${key.code_snippet ? `<div class="key-code">${esc(key.code_snippet)}</div>` : ''}
      <div class="key-knowledge">
        ${(key.required_knowledge || []).map(k => `<span class="knowledge-tag">${esc(k)}</span>`).join('')}
      </div>
      <div class="key-explanation">${esc(key.thirty_sec_explanation)}</div>
    `;
    container.appendChild(card);
  });
}

function renderImprovements(data) {
  const container = document.getElementById('bud-container');
  container.innerHTML = '';

  const sections = [
    { key: 'bottlenecks', label: 'B - ボトルネック', cls: 'bud-b' },
    { key: 'unnecessary', label: 'U - 不必要な作業', cls: 'bud-u' },
    { key: 'duplicated', label: 'D - 重複する作業', cls: 'bud-d' }
  ];

  const bud = data.bud_analysis || {};
  sections.forEach(section => {
    const items = bud[section.key] || [];
    if (items.length === 0) return;

    const div = document.createElement('div');
    div.className = `bud-section ${section.cls}`;
    div.innerHTML = `<div class="bud-label">${section.label}</div>`;
    items.forEach(item => {
      div.innerHTML += `
        <div class="bud-item">
          <div class="bud-location">${esc(item.location)}</div>
          <div class="bud-problem">${esc(item.problem)}</div>
          <div class="bud-suggestion">${esc(item.suggestion)}</div>
        </div>`;
    });
    container.appendChild(div);
  });

  const conceptsList = document.getElementById('concepts-list');
  conceptsList.innerHTML = '';
  (data.concepts_to_know || []).forEach(c => {
    conceptsList.innerHTML += `<span class="concept-tag" title="${esc(c.relevance)}">${esc(c.name)}</span>`;
  });
}

function renderLearnings(data) {
  const container = document.getElementById('learnings-container');
  container.innerHTML = '';
  (data.learnings || []).forEach(l => {
    const card = document.createElement('div');
    card.className = 'learning-card';
    card.innerHTML = `
      <div class="learning-number">${l.number}</div>
      <div class="learning-title">${esc(l.title)}</div>
      <div class="learning-english">${esc(l.english_name)}</div>
      <div class="learning-where">このアプリでの場所: ${esc(l.where_in_code)}</div>
      <div class="learning-what">${esc(l.what_you_can_do)}</div>
      ${l.thirty_sec_code ? `<div class="learning-code">${esc(l.thirty_sec_code)}</div>` : ''}
      <div class="learning-dive">
        <strong>深掘り:</strong> ${esc(l.deep_dive)}<br>
        <strong>参考:</strong> ${esc(l.related_books)}
      </div>
    `;
    container.appendChild(card);
  });

  document.getElementById('summary-card').innerHTML =
    `<h3>まとめ</h3><p>${esc(data.summary || '')}</p>`;

  // Render image generation section
  renderImageCards(data.learnings || []);
}

// ===== Image generation (1 image for all 3 learnings) =====
let learningPosterImage = null; // single data URL

function renderImageCards(learnings) {
  const container = document.getElementById('image-cards');
  container.innerHTML = '';

  // Generate a single combined prompt for all 3 learnings
  const prompt = ImagePrompts.generateCombined(learnings, state.repoName);

  const card = document.createElement('div');
  card.className = 'image-card';
  card.innerHTML = `
    <div class="image-card-header">
      <span class="image-card-title">学び3選 まとめ図解</span>
      <div class="image-card-actions">
        <button class="btn-sm btn-sm-primary" onclick="toggleImagePrompt('img-card-combined')">プロンプト表示</button>
        <button class="btn-sm btn-sm-secondary" onclick="copyImagePrompt('img-prompt-combined', this)">コピー</button>
      </div>
    </div>
    <div class="image-card-badge">推奨: Nanobanana Pro</div>
    <div class="image-prompt-area" id="img-card-combined">
      <div class="prompt-box">
        <pre id="img-prompt-combined" class="prompt-text">${esc(prompt)}</pre>
      </div>
    </div>
    <div class="image-drop-zone" id="img-drop-combined" onclick="document.getElementById('img-file-combined').click()">
      <span class="drop-label">生成した画像をペースト(Cmd+V)、ドラッグ&ドロップ、またはクリックして選択</span>
      <input type="file" id="img-file-combined" accept="image/*" />
      <button class="image-remove-btn" onclick="removePosterImage(event)">&times;</button>
    </div>
  `;
  container.appendChild(card);

  // Drag & drop
  const dropZone = document.getElementById('img-drop-combined');
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('dragover'); });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handlePosterFile(file, dropZone);
  });

  // File input
  document.getElementById('img-file-combined').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handlePosterFile(file, dropZone);
  });

  dropZone.setAttribute('tabindex', '0');
}

function handlePosterFile(file, dropZone) {
  const reader = new FileReader();
  reader.onload = (e) => {
    learningPosterImage = e.target.result;
    const label = dropZone.querySelector('.drop-label');
    let img = dropZone.querySelector('img');
    if (!img) { img = document.createElement('img'); dropZone.insertBefore(img, dropZone.querySelector('.image-remove-btn')); }
    img.src = learningPosterImage;
    if (label) label.style.display = 'none';
    dropZone.classList.add('has-image');
  };
  reader.readAsDataURL(file);
}

function removePosterImage(event) {
  event.stopPropagation();
  learningPosterImage = null;
  const dropZone = document.getElementById('img-drop-combined');
  const img = dropZone.querySelector('img');
  if (img) img.remove();
  const label = dropZone.querySelector('.drop-label');
  if (label) label.style.display = '';
  dropZone.classList.remove('has-image');
}

function toggleImagePrompt(cardId) {
  document.getElementById(cardId).classList.toggle('open');
}

function copyImagePrompt(promptId, btn) {
  const text = document.getElementById(promptId).textContent;
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'OK!';
    setTimeout(() => { btn.textContent = orig; }, 1500);
  });
}

// ===== Copy buttons =====
document.querySelectorAll('.btn-copy').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.target;
    const text = document.getElementById(targetId).textContent;
    navigator.clipboard.writeText(text).then(() => {
      const orig = btn.textContent;
      btn.textContent = 'コピーしました!';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 2000);
    });
  });
});

// ===== Progress step click =====
document.querySelectorAll('.progress-step').forEach(el => {
  el.addEventListener('click', () => {
    const step = parseInt(el.dataset.step);
    const dataKeys = [null, 'overview', 'designKeys', 'improvements', 'learnings'];
    // Allow navigating to steps that have data or are current
    if (state[dataKeys[step]] || step <= state.currentStep) {
      showStep(step);
    }
  });
});

// ===== Global paste for poster image =====
document.addEventListener('paste', (e) => {
  const dropZone = document.getElementById('img-drop-combined');
  if (!dropZone || dropZone.closest('.hidden')) return;
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault();
      handlePosterFile(item.getAsFile(), dropZone);
      break;
    }
  }
});

// ===== Export =====
document.getElementById('btn-pdf').addEventListener('click', () => {
  Exporter.downloadPDF({
    repoName: state.repoName,
    overview: state.overview,
    designKeys: state.designKeys,
    improvements: state.improvements,
    learnings: state.learnings
  });
});

document.getElementById('btn-notion').addEventListener('click', () => {
  const markdown = Exporter.generateMarkdown({
    repoName: state.repoName,
    overview: state.overview,
    designKeys: state.designKeys,
    improvements: state.improvements,
    learnings: state.learnings
  });
  navigator.clipboard.writeText(markdown).then(() => {
    const btn = document.getElementById('btn-notion');
    btn.textContent = 'Markdownをコピーしました! Notionに貼り付けてください';
    setTimeout(() => { btn.textContent = 'Notion に保存（プロンプト生成）'; }, 3000);
  });
});

// ===== Reset =====
function resetApp() {
  document.getElementById('error-section').classList.add('hidden');
  showStep(0);
}

// ===== Code Viewer Modal =====
function openCodeModal(fileIndex) {
  const file = state.keyFiles[fileIndex];
  if (!file) return;

  const lines = file.content.split('\n');
  const ext = file.path.split('.').pop().toLowerCase();

  document.getElementById('modal-filename').textContent = file.path;
  document.getElementById('modal-meta').textContent = `${lines.length} lines / ${file.content.length.toLocaleString()} chars`;

  const codeEl = document.getElementById('modal-code');
  codeEl.innerHTML = '';

  const foundKeywords = new Map(); // keyword -> explanation

  lines.forEach((line, i) => {
    const lineEl = document.createElement('div');
    lineEl.className = 'code-line';

    const numEl = document.createElement('span');
    numEl.className = 'code-line-num';
    numEl.textContent = i + 1;

    const contentEl = document.createElement('span');
    contentEl.className = 'code-line-content';
    contentEl.innerHTML = highlightSyntax(line, ext, foundKeywords);

    lineEl.appendChild(numEl);
    lineEl.appendChild(contentEl);
    codeEl.appendChild(lineEl);
  });

  // Build legend from found keywords
  const legendEl = document.getElementById('modal-legend');
  legendEl.innerHTML = '';
  if (foundKeywords.size > 0) {
    foundKeywords.forEach((tip, keyword) => {
      const item = document.createElement('span');
      item.className = 'legend-item';
      item.innerHTML = `<code style="color:#dcdcaa;font-size:12px;">${esc(keyword)}</code> <span style="color:#aaa;">— ${esc(tip)}</span>`;
      legendEl.appendChild(item);
    });
  }

  document.getElementById('code-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeCodeModal() {
  document.getElementById('code-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

// Close modal on Escape or backdrop click
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeCodeModal();
});
document.getElementById('code-modal').addEventListener('click', (e) => {
  if (e.target.id === 'code-modal') closeCodeModal();
});

// ===== Syntax Highlighting =====
const KEYWORD_TIPS = {
  // JavaScript
  'function': '関数を定義する。処理をまとめて名前を付ける',
  'const': '再代入できない変数を宣言する',
  'let': '再代入できる変数を宣言する',
  'var': '古い変数宣言（letやconstを推奨）',
  'return': '関数から値を返す',
  'if': '条件分岐。条件がtrueの時だけ実行',
  'else': 'ifの条件がfalseの時に実行',
  'for': 'ループ処理。繰り返し実行する',
  'while': '条件がtrueの間ループする',
  'switch': '値に応じて処理を分岐する',
  'case': 'switchの分岐先',
  'break': 'ループやswitchから抜ける',
  'continue': 'ループの次の繰り返しに進む',
  'class': 'クラスを定義する。オブジェクトの設計図',
  'new': 'クラスからインスタンス（実体）を作成する',
  'this': '現在のオブジェクト自身を参照する',
  'constructor': 'クラスのインスタンス作成時に自動実行される初期化処理',
  'extends': 'クラスを継承する（親クラスの機能を引き継ぐ）',
  'import': '他のファイルから機能を読み込む',
  'export': '他のファイルに機能を公開する',
  'async': '非同期関数を定義する。awaitが使える',
  'await': 'Promiseの完了を待つ',
  'try': 'エラーが起きる可能性のある処理を囲む',
  'catch': 'tryでエラーが起きた時の処理',
  'throw': 'エラーを発生させる',
  'typeof': '値のデータ型を調べる',
  'instanceof': 'オブジェクトが特定のクラスのインスタンスか調べる',
  'null': '値が存在しないことを明示する',
  'undefined': '値が未定義',
  'true': '真偽値の「真」',
  'false': '真偽値の「偽」',
  '=>': 'アロー関数。functionの短縮記法',
  'forEach': '配列の各要素に対して関数を実行する',
  'map': '配列の各要素を変換して新しい配列を返す',
  'filter': '条件に合う要素だけ抽出する',
  'reduce': '配列を1つの値にまとめる',
  'find': '条件に合う最初の要素を返す',
  'push': '配列の末尾に要素を追加する',
  'pop': '配列の末尾の要素を取り出す',
  'slice': '配列の一部を切り出して新しい配列を返す',
  'splice': '配列の要素を追加・削除する',
  'addEventListener': 'イベント（クリック等）を監視して処理を実行する',
  'querySelector': 'CSSセレクタでHTML要素を1つ取得する',
  'querySelectorAll': 'CSSセレクタでHTML要素を全て取得する',
  'getElementById': 'ID名でHTML要素を取得する',
  'createElement': '新しいHTML要素を作成する',
  'appendChild': '子要素として追加する',
  'innerHTML': 'HTML要素の中身を文字列として読み書きする',
  'textContent': 'テキストのみを読み書きする（HTMLタグは無視）',
  'classList': 'CSSクラスの追加・削除を管理する',
  'setTimeout': '指定ミリ秒後に1回だけ処理を実行する',
  'setInterval': '指定ミリ秒ごとに繰り返し処理を実行する',
  'clearInterval': 'setIntervalで設定した繰り返しを停止する',
  'console.log': '開発者ツールにメッセージを出力する（デバッグ用）',
  'JSON.parse': 'JSON文字列をJavaScriptオブジェクトに変換する',
  'JSON.stringify': 'JavaScriptオブジェクトをJSON文字列に変換する',
  'fetch': 'HTTPリクエストを送信してデータを取得する',
  'Promise': '非同期処理の結果を表すオブジェクト',
  // Ruby
  'def': 'メソッド（関数）を定義する',
  'end': 'ブロック・メソッド・クラスの終わりを示す',
  'do': 'ブロックの開始（each doなど）',
  'puts': 'コンソールに出力する（改行付き）',
  'require': '外部ファイル・ライブラリを読み込む',
  'attr_accessor': 'ゲッターとセッターを自動生成する',
  'include': 'モジュールの機能を取り込む',
  'module': 'モジュールを定義する（名前空間やMixin）',
  'yield': 'ブロックに処理を委譲する',
  'self': '現在のオブジェクト自身を参照する',
  'nil': '値が存在しないことを示す（JSのnullに相当）',
  // HTML
  'div': '汎用ブロック要素。レイアウトの箱として使う',
  'span': '汎用インライン要素。テキストの一部を装飾する',
  'script': 'JavaScriptを読み込む・埋め込むタグ',
  'link': '外部リソース（CSS等）を読み込むタグ',
  'meta': 'ページのメタ情報（文字コード・説明等）を指定する',
  'form': 'フォーム。ユーザー入力を送信する',
  'input': '入力フィールド（テキスト・チェックボックス等）',
  'button': 'クリックできるボタン',
  'header': 'ページやセクションのヘッダー領域',
  'main': 'ページのメインコンテンツ領域',
  'footer': 'ページやセクションのフッター領域',
  'section': 'コンテンツの意味的なセクション',
  'article': '独立した記事コンテンツ',
  'nav': 'ナビゲーションリンクのセクション',
  // CSS keywords
  'display': '要素の表示方法を指定する（flex, grid, block等）',
  'flex': '子要素を柔軟に配置するレイアウトモード',
  'grid': '格子状のレイアウトを作るモード',
  'position': '要素の配置方法（relative, absolute, fixed等）',
  'transition': 'プロパティ変化時のアニメーションを設定する',
  'transform': '要素の移動・回転・拡大を行う',
  '@media': '画面サイズ等の条件でCSSを切り替える（レスポンシブ）',
  '@keyframes': 'CSSアニメーションの動きを定義する',
};

function highlightSyntax(line, ext, foundKeywords) {
  // Escape HTML first
  let escaped = line
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  if (ext === 'html' || ext === 'htm') {
    return highlightHTML(escaped, foundKeywords);
  }
  if (ext === 'css' || ext === 'scss') {
    return highlightCSS(escaped, foundKeywords);
  }
  // Default: JS/TS/Ruby/Python-ish
  return highlightJS(escaped, ext, foundKeywords);
}

function highlightJS(line, ext, found) {
  // Comments
  if (line.trimStart().startsWith('//') || line.trimStart().startsWith('#')) {
    return `<span class="syn-comment">${line}</span>`;
  }

  // Keywords
  const jsKeywords = ['function','const','let','var','return','if','else','for','while','switch','case','break','continue','class','new','this','constructor','extends','import','export','async','await','try','catch','throw','typeof','instanceof','null','undefined','true','false','default','static','super','yield','from','of','in','delete','void'];
  const rbKeywords = ['def','end','do','puts','require','attr_accessor','include','module','yield','self','nil','unless','elsif','begin','rescue','ensure','raise','then','when','lambda','proc'];
  const keywords = ext === 'rb' ? rbKeywords : jsKeywords;

  let result = line;

  // Strings (simple approach)
  result = result.replace(/(["'`])(?:(?!\1|\\).|\\.)*?\1/g, '<span class="syn-string">$&</span>');

  // Numbers
  result = result.replace(/\b(\d+\.?\d*)\b/g, '<span class="syn-number">$1</span>');

  // Keywords
  keywords.forEach(kw => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g');
    if (regex.test(result)) {
      const tip = KEYWORD_TIPS[kw] || '';
      if (tip) found.set(kw, tip);
      const tipAttr = tip ? ` data-tip="${tip.replace(/"/g, '&quot;')}"` : '';
      result = result.replace(new RegExp(`\\b(${kw})\\b`, 'g'), `<span class="syn-keyword"${tipAttr}>$1</span>`);
    }
  });

  // Function calls: word(
  result = result.replace(/\b([a-zA-Z_]\w*)\s*\(/g, (match, name) => {
    const tip = KEYWORD_TIPS[name] || '';
    if (tip) found.set(name, tip);
    const tipAttr = tip ? ` data-tip="${tip.replace(/"/g, '&quot;')}"` : '';
    return `<span class="syn-function"${tipAttr}>${name}</span>(`;
  });

  // Method calls: .word(
  result = result.replace(/\.([a-zA-Z_]\w*)\s*\(/g, (match, name) => {
    const tip = KEYWORD_TIPS[name] || '';
    if (tip) found.set(name, tip);
    const tipAttr = tip ? ` data-tip="${tip.replace(/"/g, '&quot;')}"` : '';
    return `.<span class="syn-function"${tipAttr}>${name}</span>(`;
  });

  // Properties: .word (not followed by ()
  result = result.replace(/\.([a-zA-Z_]\w*)(?!\s*\()/g, (match, name) => {
    const tip = KEYWORD_TIPS[name] || '';
    if (tip) found.set(name, tip);
    const tipAttr = tip ? ` data-tip="${tip.replace(/"/g, '&quot;')}"` : '';
    return `.<span class="syn-property"${tipAttr}>${name}</span>`;
  });

  // Arrow functions
  result = result.replace(/=&gt;/g, '<span class="syn-keyword">=&gt;</span>');

  return result;
}

function highlightHTML(line, found) {
  // Comments
  if (line.includes('&lt;!--')) {
    return line.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="syn-comment">$1</span>');
  }

  // Tags
  let result = line.replace(/(&lt;\/?)([\w-]+)/g, (match, bracket, tag) => {
    const tip = KEYWORD_TIPS[tag] || '';
    if (tip) found.set(`<${tag}>`, tip);
    const tipAttr = tip ? ` data-tip="${tip.replace(/"/g, '&quot;')}"` : '';
    return `${bracket}<span class="syn-tag"${tipAttr}>${tag}</span>`;
  });

  // Attributes
  result = result.replace(/\s([\w-]+)=/g, ' <span class="syn-attr">$1</span>=');

  // Strings
  result = result.replace(/(["'])(?:(?!\1).)*?\1/g, '<span class="syn-string">$&</span>');

  return result;
}

function highlightCSS(line, found) {
  // Comments
  if (line.trimStart().startsWith('/*') || line.trimStart().startsWith('*')) {
    return `<span class="syn-comment">${line}</span>`;
  }

  let result = line;

  // @rules
  result = result.replace(/@([\w-]+)/g, (match, rule) => {
    const fullRule = '@' + rule;
    const tip = KEYWORD_TIPS[fullRule] || '';
    if (tip) found.set(fullRule, tip);
    const tipAttr = tip ? ` data-tip="${tip.replace(/"/g, '&quot;')}"` : '';
    return `<span class="syn-keyword"${tipAttr}>@${rule}</span>`;
  });

  // Properties (word before colon)
  result = result.replace(/([\w-]+)\s*:/g, (match, prop) => {
    const tip = KEYWORD_TIPS[prop] || '';
    if (tip) found.set(prop, tip);
    const tipAttr = tip ? ` data-tip="${tip.replace(/"/g, '&quot;')}"` : '';
    return `<span class="syn-property"${tipAttr}>${prop}</span>:`;
  });

  // Strings
  result = result.replace(/(["'])(?:(?!\1).)*?\1/g, '<span class="syn-string">$&</span>');

  // Numbers with units
  result = result.replace(/\b([\d.]+)(px|em|rem|%|vh|vw|s|ms|deg|fr)\b/g, '<span class="syn-number">$1$2</span>');

  // Colors
  result = result.replace(/(#[0-9a-fA-F]{3,8})\b/g, '<span class="syn-number">$1</span>');

  // Selectors (class and id)
  result = result.replace(/([.#][\w-]+)/g, '<span class="syn-class">$1</span>');

  return result;
}

// ===== Step 5: Code Map rendering =====
function renderCodeMap() {
  const grid = document.getElementById('code-files-grid');
  if (grid.children.length > 0) return; // Already rendered

  const files = state.keyFiles;
  let totalLines = 0;
  let totalChars = 0;

  files.forEach((f, idx) => {
    const lines = f.content.split('\n');
    totalLines += lines.length;
    totalChars += f.content.length;

    const ext = f.path.split('.').pop().toLowerCase();
    const langClass = getLangClass(ext);

    const card = document.createElement('div');
    card.className = 'code-file-card';

    const isTruncated = lines.length > 500;
    const displayContent = isTruncated ? lines.slice(0, 500).join('\n') : f.content;

    card.innerHTML = `
      <div class="code-file-header">
        <span class="code-file-name"><span class="lang-dot ${langClass}"></span>${esc(f.path)}</span>
        <span class="code-file-meta">
          <span class="code-line-badge">${lines.length} lines</span>
          <span style="color:#888;font-size:10px;margin-left:4px;">クリックで全コード表示</span>
        </span>
      </div>
      <div class="code-file-body ${isTruncated ? 'truncated' : ''}">
        <div class="code-minimap">${esc(displayContent)}</div>
      </div>
    `;
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => openCodeModal(idx));
    grid.appendChild(card);
  });

  document.getElementById('code-total-files').textContent = files.length;
  document.getElementById('code-total-lines').textContent = totalLines.toLocaleString();
  document.getElementById('code-total-chars').textContent = totalChars.toLocaleString();
}

function getLangClass(ext) {
  const map = {
    js: 'lang-js', jsx: 'lang-js', mjs: 'lang-js',
    ts: 'lang-ts', tsx: 'lang-ts',
    html: 'lang-html', htm: 'lang-html',
    css: 'lang-css', scss: 'lang-css',
    rb: 'lang-rb', erb: 'lang-rb',
    py: 'lang-py',
    go: 'lang-go',
    rs: 'lang-rs',
    java: 'lang-java',
    vue: 'lang-vue', svelte: 'lang-vue',
    json: 'lang-json',
  };
  return map[ext] || 'lang-other';
}

// ===== Robust JSON extraction =====
function extractJSON(raw) {
  // 1. Try: markdown code block
  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1].trim()); } catch(e) {}
    // Try fixing truncated JSON in code block
    try { return JSON.parse(fixTruncatedJSON(codeBlockMatch[1].trim())); } catch(e) {}
  }

  // 2. Try: find outermost { ... }
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]); } catch(e) {}
    // Try fixing truncated JSON
    try { return JSON.parse(fixTruncatedJSON(jsonMatch[0])); } catch(e) {}
  }

  // 3. Try: the raw text itself
  try { return JSON.parse(raw); } catch(e) {}
  try { return JSON.parse(fixTruncatedJSON(raw)); } catch(e) {}

  throw new Error('JSONを抽出できませんでした。AIの回答にJSON（{...}）が含まれていることを確認してください。');
}

// Fix common issues with AI-generated JSON
function fixTruncatedJSON(str) {
  let s = str.trim();

  // Remove trailing commas before } or ]
  s = s.replace(/,\s*([\}\]])/g, '$1');

  // Count unmatched braces/brackets and close them
  let braces = 0, brackets = 0;
  let inString = false, escape = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (escape) { escape = false; continue; }
    if (c === '\\') { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === '{') braces++;
    if (c === '}') braces--;
    if (c === '[') brackets++;
    if (c === ']') brackets--;
  }

  // Close unclosed strings (if we're inside a string at the end)
  if (inString) s += '"';

  // Remove trailing incomplete key-value pairs (e.g., "key": "value that got cut)
  // Try to find the last complete value
  while (braces > 0 || brackets > 0) {
    // Remove trailing comma
    s = s.replace(/,\s*$/, '');
    // Close open structures
    if (brackets > 0) { s += ']'; brackets--; }
    else if (braces > 0) { s += '}'; braces--; }
  }

  return s;
}

// ===== Utility =====
function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
