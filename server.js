const express = require('express');
const path = require('path');

const app = express();
const PORT = 7790;

// Notion API設定
const NOTION_TOKEN = 'ntn_zL1786226637m2ajAn8X38UWsdRj721AIaQOcf3dJQY9p0';
const DB_ID = '31c00aa590c7815aa240f1e1991b75cf';
const NOTION_API = 'https://api.notion.com/v1';
const notionHeaders = {
  'Authorization': `Bearer ${NOTION_TOKEN}`,
  'Content-Type': 'application/json',
  'Notion-Version': '2022-06-28'
};

app.use(express.static(path.join(__dirname)));
app.use(express.json({ limit: '10mb' }));

// --- Notion block helpers ---
const h2 = (t) => ({ type: 'heading_2', heading_2: { rich_text: [{ text: { content: t } }] } });
const h3 = (t) => ({ type: 'heading_3', heading_3: { rich_text: [{ text: { content: t } }] } });
const pg = (t) => ({ type: 'paragraph', paragraph: { rich_text: [{ text: { content: (t || '').slice(0, 2000) } }] } });
const bl = (t) => ({ type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: (t || '').slice(0, 2000) } }] } });
const dv = () => ({ type: 'divider', divider: {} });
const co = (t, emoji = '💡') => ({
  type: 'callout', callout: {
    icon: { type: 'emoji', emoji },
    rich_text: [{ text: { content: (t || '').slice(0, 2000) } }]
  }
});

function buildProperties(data) {
  const ov = data.overview || {};
  const bi = ov.basic_info || {};
  const dk = data.designKeys || {};
  const imp = data.improvements || {};
  const lr = data.learnings || {};
  const bud = imp.bud_analysis || {};

  const budCount = ['bottlenecks', 'unnecessary', 'duplicated']
    .reduce((sum, k) => sum + (bud[k] || []).length, 0);

  return {
    'Name': { title: [{ text: { content: data.repoName || data.repo || 'Unknown' } }] },
    'GitHub URL': { url: `https://github.com/${data.owner}/${data.repo}` },
    '言語': { multi_select: (bi.languages || []).map(l => ({ name: l.split('(')[0].trim() })) },
    'フレームワーク': { select: { name: (bi.framework || 'N/A').split(' ')[0] } },
    'アーキテクチャ': { select: { name: (bi.architecture || 'N/A').split(' ')[0] } },
    '規模': { select: { name: bi.scale || '不明' } },
    '設計パターン': { multi_select: (dk.keys || []).map(k => ({ name: (k.title || '').slice(0, 100) })) },
    '学びキーワード': { multi_select: (lr.learnings || []).map(l => ({ name: (l.title || '').slice(0, 100) })) },
    'BUD指摘数': { number: budCount },
    '概要': { rich_text: [{ text: { content: (bi.description || '').slice(0, 2000) } }] },
    '分析日': { date: { start: (data.savedAt || new Date().toISOString()).slice(0, 10) } },
  };
}

function buildBlocks(data) {
  const ov = data.overview || {};
  const bi = ov.basic_info || {};
  const dk = data.designKeys || {};
  const imp = data.improvements || {};
  const lr = data.learnings || {};
  const bud = imp.bud_analysis || {};
  const blocks = [];

  // STEP 1
  blocks.push(h2('STEP 1: 全体俯瞰'));
  blocks.push(co(`言語: ${(bi.languages || []).join(', ')}  |  フレームワーク: ${bi.framework || 'N/A'}  |  規模: ${bi.scale || '?'}  |  ファイル数: ${bi.file_count || '?'}`, '📊'));
  if (bi.description) blocks.push(pg(bi.description));
  if (ov.reading_guide && ov.reading_guide.length > 0) {
    blocks.push(h3('まずここを見るガイド'));
    for (const item of ov.reading_guide.slice(0, 10)) {
      blocks.push(bl(`${item.file || ''} - ${item.reason || item.description || ''}`));
    }
  }
  blocks.push(dv());

  // STEP 2
  blocks.push(h2('STEP 2: 設計の鍵'));
  for (const key of (dk.keys || [])) {
    const en = key.english_name ? `（${key.english_name}）` : '';
    blocks.push(h3(`🔑 ${key.title || ''}${en}`));
    if (key.location) blocks.push(pg(`📍 ${key.location}`));
    if (key.why_important) blocks.push(pg(key.why_important));
    if (key.code_snippet) blocks.push(pg(key.code_snippet));
    if (key.required_knowledge && key.required_knowledge.length > 0) {
      blocks.push(co(`関連概念: ${key.required_knowledge.join(', ')}`, '🏷️'));
    }
    if (key.thirty_sec_explanation) blocks.push(co(key.thirty_sec_explanation, '💡'));
  }
  blocks.push(dv());

  // STEP 3
  blocks.push(h2('STEP 3: 改善ポイント（BUD分析）'));
  for (const [catKey, catLabel, emoji] of [['bottlenecks','B - ボトルネック','🔴'],['unnecessary','U - 不必要な作業','🟡'],['duplicated','D - 重複する作業','🟠']]) {
    const items = bud[catKey] || [];
    if (items.length > 0) {
      blocks.push(h3(`${emoji} ${catLabel}`));
      for (const item of items) {
        blocks.push(co(`📍 ${item.location || ''}\n問題: ${item.problem || ''}\n→ ${item.suggestion || ''}`, emoji));
      }
    }
  }
  const concepts = imp.concepts_to_know || [];
  if (concepts.length > 0) {
    blocks.push(h3('💡 理解すべき概念'));
    for (const c of concepts) blocks.push(bl(`${c.name || ''}: ${c.relevance || c.why || ''}`));
  }
  blocks.push(dv());

  // STEP 4
  blocks.push(h2('STEP 4: 今回の学び'));
  for (const l of (lr.learnings || [])) {
    const en = l.english_name ? `（${l.english_name}）` : '';
    blocks.push(h3(`📚 ${l.title || ''}${en}`));
    if (l.what_you_can_do) blocks.push(pg(l.what_you_can_do));
    if (l.where_in_code) blocks.push(pg(`📍 場所: ${l.where_in_code}`));
    if (l.deep_dive) blocks.push(co(`深掘り: ${l.deep_dive}`, '🔬'));
    if (l.related_books) blocks.push(co(`参考: ${l.related_books}`, '📖'));
  }
  if (lr.summary) {
    blocks.push(dv());
    blocks.push(co(`まとめ: ${lr.summary}`, '⭐'));
  }

  // STEP 6: 逆算ライブコーディング計画
  const rp = data.reversePlan || {};
  if (rp.sessions && rp.sessions.length > 0) {
    blocks.push(dv());
    blocks.push(h2('STEP 6: 逆算ライブコーディング計画'));
    if (rp.goal) blocks.push(co(`ゴール: ${rp.goal}\n前提: ${rp.prerequisite || ''}`, '🎯'));
    for (const session of rp.sessions) {
      const num = session.number || '';
      blocks.push(h3(`${num}. ${session.title || ''} (${session.duration_min || '?'}分)`));
      if (session.objective) blocks.push(pg(`目標: ${session.objective}`));
      if (session.design_intent) blocks.push(co(session.design_intent, '💡'));
      if (session.steps && session.steps.length > 0) {
        for (const step of session.steps) blocks.push(bl(step));
      }
      if (session.key_concepts && session.key_concepts.length > 0) {
        blocks.push(pg(`体得する概念: ${session.key_concepts.join(', ')}`));
      }
      if (session.checkpoint) blocks.push(co(`✅ ${session.checkpoint}`, '✅'));
    }
    if (rp.extension_ideas && rp.extension_ideas.length > 0) {
      blocks.push(h3('発展課題'));
      for (const e of rp.extension_ideas) {
        blocks.push(bl(`${e.title || ''}: ${e.description || ''}`));
      }
    }
    if (rp.summary) blocks.push(co(`まとめ: ${rp.summary}`, '⭐'));
  }

  return blocks.slice(0, 100);
}

// --- Notion同期エンドポイント ---
app.post('/api/notion-sync', async (req, res) => {
  try {
    const data = req.body;
    const repoName = data.repoName || data.repo || 'Unknown';

    // 既存ページ検索
    const searchRes = await fetch(`${NOTION_API}/databases/${DB_ID}/query`, {
      method: 'POST',
      headers: notionHeaders,
      body: JSON.stringify({ filter: { property: 'Name', title: { equals: repoName } } })
    });
    const searchResult = await searchRes.json();
    const existingPageId = (searchResult.results || []).length > 0 ? searchResult.results[0].id : null;

    const properties = buildProperties(data);
    const blocks = buildBlocks(data);

    if (existingPageId) {
      // 更新: プロパティ更新
      await fetch(`${NOTION_API}/pages/${existingPageId}`, {
        method: 'PATCH',
        headers: notionHeaders,
        body: JSON.stringify({ properties })
      });
      // 既存ブロック削除
      const blocksRes = await fetch(`${NOTION_API}/blocks/${existingPageId}/children?page_size=100`, { headers: notionHeaders });
      const blocksResult = await blocksRes.json();
      for (const block of (blocksResult.results || [])) {
        await fetch(`${NOTION_API}/blocks/${block.id}`, { method: 'DELETE', headers: notionHeaders });
      }
      // 新ブロック追加
      await fetch(`${NOTION_API}/blocks/${existingPageId}/children`, {
        method: 'PATCH',
        headers: notionHeaders,
        body: JSON.stringify({ children: blocks })
      });
      res.json({ success: true, action: 'updated', repoName });
    } else {
      // 新規作成
      const createRes = await fetch(`${NOTION_API}/pages`, {
        method: 'POST',
        headers: notionHeaders,
        body: JSON.stringify({ parent: { database_id: DB_ID }, properties, children: blocks })
      });
      const createResult = await createRes.json();
      if (!createRes.ok) {
        return res.status(500).json({ success: false, error: createResult.message });
      }
      res.json({ success: true, action: 'created', repoName, pageId: createResult.id });
    }
  } catch (err) {
    console.error('Notion sync error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Code Analysis running at http://localhost:${PORT}`);
});
