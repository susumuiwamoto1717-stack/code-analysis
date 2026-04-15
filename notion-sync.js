/**
 * Code Analysis → Notion 自動同期スクリプト
 *
 * 使い方:
 *   node notion-sync.js <JSONファイルパス>
 *   例: node notion-sync.js ~/Downloads/code-analysis_mabatalk_2026-03-06.json
 *
 * アプリのエクスポート機能から保存したJSONを読み込み、
 * Notionの「アプリ分析」データベースに自動登録します。
 * 同名のアプリが既にある場合はページを更新します。
 */

const fs = require('fs');
const path = require('path');

const NOTION_TOKEN = 'ntn_zL1786226637m2ajAn8X38UWsdRj721AIaQOcf3dJQY9p0';
const DB_ID = '31c00aa590c7815aa240f1e1991b75cf';
const NOTION_API = 'https://api.notion.com/v1';

const headers = {
  'Authorization': `Bearer ${NOTION_TOKEN}`,
  'Content-Type': 'application/json',
  'Notion-Version': '2022-06-28'
};

// --- Notion block helpers ---
const h2 = (text) => ({ type: 'heading_2', heading_2: { rich_text: [{ text: { content: text } }] } });
const h3 = (text) => ({ type: 'heading_3', heading_3: { rich_text: [{ text: { content: text } }] } });
const p = (text) => ({ type: 'paragraph', paragraph: { rich_text: [{ text: { content: text.slice(0, 2000) } }] } });
const bullet = (text) => ({ type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: text.slice(0, 2000) } }] } });
const divider = () => ({ type: 'divider', divider: {} });
const callout = (text, emoji = '💡') => ({
  type: 'callout', callout: {
    icon: { type: 'emoji', emoji },
    rich_text: [{ text: { content: text.slice(0, 2000) } }]
  }
});

// --- Build properties from analysis JSON ---
function buildProperties(data) {
  const ov = data.overview || {};
  const bi = ov.basic_info || {};
  const dk = data.designKeys || {};
  const imp = data.improvements || {};
  const lr = data.learnings || {};
  const bud = imp.bud_analysis || {};

  const budCount = ['bottlenecks', 'unnecessary', 'duplicated']
    .reduce((sum, k) => sum + (bud[k] || []).length, 0);

  const designPatterns = (dk.keys || []).map(k => ({ name: (k.title || '').slice(0, 100) }));
  const learningTitles = (lr.learnings || []).map(l => ({ name: (l.title || '').slice(0, 100) }));
  const languages = (bi.languages || []).map(l => ({ name: l.split('(')[0].trim() }));

  const framework = bi.framework
    ? bi.framework.split(' ')[0]
    : 'N/A';

  return {
    'Name': { title: [{ text: { content: data.repoName || data.repo || 'Unknown' } }] },
    'GitHub URL': { url: `https://github.com/${data.owner}/${data.repo}` },
    '言語': { multi_select: languages },
    'フレームワーク': { select: { name: framework } },
    'アーキテクチャ': { select: { name: (bi.architecture || 'N/A').split(' ')[0] } },
    '規模': { select: { name: bi.scale || '不明' } },
    '設計パターン': { multi_select: designPatterns },
    '学びキーワード': { multi_select: learningTitles },
    'BUD指摘数': { number: budCount },
    '概要': { rich_text: [{ text: { content: (bi.description || '').slice(0, 2000) } }] },
    '分析日': { date: { start: (data.savedAt || new Date().toISOString()).slice(0, 10) } },
  };
}

// --- Build page body blocks ---
function buildBlocks(data) {
  const ov = data.overview || {};
  const bi = ov.basic_info || {};
  const dk = data.designKeys || {};
  const imp = data.improvements || {};
  const lr = data.learnings || {};
  const bud = imp.bud_analysis || {};
  const blocks = [];

  // STEP 1: 全体俯瞰
  blocks.push(h2('STEP 1: 全体俯瞰'));
  blocks.push(callout(
    `言語: ${(bi.languages || []).join(', ')}  |  フレームワーク: ${bi.framework || 'N/A'}  |  規模: ${bi.scale || '?'}  |  ファイル数: ${bi.file_count || '?'}`,
    '📊'
  ));
  if (bi.description) blocks.push(p(bi.description));

  if (ov.reading_guide && ov.reading_guide.length > 0) {
    blocks.push(h3('まずここを見るガイド'));
    for (const item of ov.reading_guide.slice(0, 10)) {
      blocks.push(bullet(`${item.file || ''} - ${item.description || ''}`));
    }
  }
  blocks.push(divider());

  // STEP 2: 設計の鍵
  blocks.push(h2('STEP 2: 設計の鍵'));
  for (const key of (dk.keys || [])) {
    const title = key.title || '';
    const en = key.english_name ? `（${key.english_name}）` : '';
    blocks.push(h3(`🔑 ${title}${en}`));
    if (key.location) blocks.push(p(`📍 ${key.location}`));
    if (key.why_important) blocks.push(p(key.why_important));
    if (key.code_snippet) blocks.push(p(`\`\`\`\n${key.code_snippet}\n\`\`\``));
    if (key.required_knowledge && key.required_knowledge.length > 0) {
      blocks.push(callout(`関連概念: ${key.required_knowledge.join(', ')}`, '🏷️'));
    }
    if (key.thirty_sec_explanation) blocks.push(callout(key.thirty_sec_explanation, '💡'));
  }
  blocks.push(divider());

  // STEP 3: 改善ポイント (BUD分析)
  blocks.push(h2('STEP 3: 改善ポイント（BUD分析）'));
  const budCategories = [
    ['bottlenecks', 'B - ボトルネック', '🔴'],
    ['unnecessary', 'U - 不必要な作業', '🟡'],
    ['duplicated', 'D - 重複する作業', '🟠'],
  ];
  for (const [catKey, catLabel, emoji] of budCategories) {
    const items = bud[catKey] || [];
    if (items.length > 0) {
      blocks.push(h3(`${emoji} ${catLabel}`));
      for (const item of items) {
        blocks.push(callout(
          `📍 ${item.location || ''}\n問題: ${item.problem || ''}\n→ ${item.suggestion || ''}`,
          emoji
        ));
      }
    }
  }

  const concepts = imp.concepts_to_know || [];
  if (concepts.length > 0) {
    blocks.push(h3('💡 理解すべき概念'));
    for (const c of concepts) {
      blocks.push(bullet(`${c.name || ''}: ${c.relevance || c.why || ''}`));
    }
  }
  blocks.push(divider());

  // STEP 4: 学び
  blocks.push(h2('STEP 4: 今回の学び'));
  for (const l of (lr.learnings || [])) {
    const en = l.english_name ? `（${l.english_name}）` : '';
    blocks.push(h3(`📚 ${l.title || ''}${en}`));
    if (l.what_you_can_do) blocks.push(p(l.what_you_can_do));
    if (l.where_in_code) blocks.push(p(`📍 場所: ${l.where_in_code}`));
    if (l.thirty_sec_code) blocks.push(p(`\`\`\`\n${l.thirty_sec_code}\n\`\`\``));
    if (l.deep_dive) blocks.push(callout(`深掘り: ${l.deep_dive}`, '🔬'));
    if (l.related_books) blocks.push(callout(`参考: ${l.related_books}`, '📖'));
  }

  const summary = (lr.summary || '');
  if (summary) {
    blocks.push(divider());
    blocks.push(callout(`まとめ: ${summary}`, '⭐'));
  }

  // STEP 6: 逆算ライブコーディング計画
  const rp = data.reversePlan || {};
  if (rp.sessions && rp.sessions.length > 0) {
    blocks.push(divider());
    blocks.push(h2('STEP 6: 逆算ライブコーディング計画'));
    if (rp.goal) blocks.push(callout(`ゴール: ${rp.goal}\n前提: ${rp.prerequisite || ''}`, '🎯'));
    for (const session of rp.sessions) {
      const num = session.number || '';
      blocks.push(h3(`${num}. ${session.title || ''} (${session.duration_min || '?'}分)`));
      if (session.objective) blocks.push(p(`目標: ${session.objective}`));
      if (session.design_intent) blocks.push(callout(session.design_intent, '💡'));
      if (session.steps && session.steps.length > 0) {
        for (const step of session.steps) blocks.push(bullet(step));
      }
      if (session.key_concepts && session.key_concepts.length > 0) {
        blocks.push(p(`体得する概念: ${session.key_concepts.join(', ')}`));
      }
      if (session.checkpoint) blocks.push(callout(`✅ ${session.checkpoint}`, '✅'));
    }
    if (rp.extension_ideas && rp.extension_ideas.length > 0) {
      blocks.push(h3('発展課題'));
      for (const ext of rp.extension_ideas) {
        blocks.push(bullet(`${ext.title || ''}: ${ext.description || ''}`));
      }
    }
    if (rp.summary) blocks.push(callout(`まとめ: ${rp.summary}`, '⭐'));
  }

  return blocks.slice(0, 100); // Notion API limit
}

// --- Check if page already exists ---
async function findExistingPage(repoName) {
  const res = await fetch(`${NOTION_API}/databases/${DB_ID}/query`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      filter: {
        property: 'Name',
        title: { equals: repoName }
      }
    })
  });
  const result = await res.json();
  const pages = result.results || [];
  return pages.length > 0 ? pages[0].id : null;
}

// --- Delete all blocks from existing page ---
async function clearPageBlocks(pageId) {
  const res = await fetch(`${NOTION_API}/blocks/${pageId}/children?page_size=100`, {
    headers
  });
  const result = await res.json();
  for (const block of (result.results || [])) {
    await fetch(`${NOTION_API}/blocks/${block.id}`, {
      method: 'DELETE',
      headers
    });
  }
}

// --- Main ---
async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('使い方: node notion-sync.js <JSONファイルパス>');
    console.error('例: node notion-sync.js ~/Downloads/code-analysis_mabatalk_2026-03-06.json');
    process.exit(1);
  }

  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`ファイルが見つかりません: ${resolved}`);
    process.exit(1);
  }

  console.log(`📂 読み込み中: ${resolved}`);
  const data = JSON.parse(fs.readFileSync(resolved, 'utf-8'));
  const repoName = data.repoName || data.repo || 'Unknown';

  console.log(`🔍 "${repoName}" を検索中...`);
  const existingPageId = await findExistingPage(repoName);

  const properties = buildProperties(data);
  const blocks = buildBlocks(data);

  if (existingPageId) {
    console.log(`♻️  既存ページを更新: ${existingPageId}`);
    // Update properties
    await fetch(`${NOTION_API}/pages/${existingPageId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ properties })
    });
    // Clear and re-add blocks
    await clearPageBlocks(existingPageId);
    await fetch(`${NOTION_API}/blocks/${existingPageId}/children`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ children: blocks })
    });
    console.log(`✅ 更新完了: ${repoName}`);
  } else {
    console.log(`🆕 新規ページを作成中...`);
    const res = await fetch(`${NOTION_API}/pages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        parent: { database_id: DB_ID },
        properties,
        children: blocks
      })
    });
    const result = await res.json();
    if (res.ok) {
      console.log(`✅ 作成完了: ${repoName} (ID: ${result.id})`);
    } else {
      console.error(`❌ エラー:`, result.message || JSON.stringify(result));
      process.exit(1);
    }
  }
}

main().catch(err => {
  console.error('❌ エラー:', err.message);
  process.exit(1);
});
