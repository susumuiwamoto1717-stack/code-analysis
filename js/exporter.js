// Export functionality - PDF and Markdown (for Notion paste)

const Exporter = {
  generatePrintHTML(data) {
    const { repoName, overview, designKeys, improvements, learnings } = data;

    let html = `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">
<title>Code Analysis: ${repoName}</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; color: #333; line-height: 1.7; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
h1 { font-size: 28px; color: #1a1a2e; border-bottom: 3px solid #4a6cf7; padding-bottom: 8px; margin-bottom: 24px; }
h2 { font-size: 22px; color: #1a1a2e; margin-top: 36px; margin-bottom: 16px; }
h3 { font-size: 16px; color: #555; margin-top: 20px; margin-bottom: 8px; }
pre { background: #f5f5f5; padding: 12px; border-radius: 6px; font-size: 12px; overflow-x: auto; white-space: pre-wrap; }
code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-size: 13px; }
.tag { display: inline-block; background: #e8edff; color: #4a6cf7; font-size: 12px; padding: 2px 8px; border-radius: 12px; margin: 2px; }
.info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 12px 0; }
.info-item { background: #f8f9fa; padding: 8px; border-radius: 6px; text-align: center; }
.info-label { font-size: 10px; color: #888; }
.info-value { font-size: 14px; font-weight: 700; }
.key-card { border-left: 3px solid #4a6cf7; padding-left: 16px; margin: 16px 0; }
.bud-item { margin: 8px 0; padding: 8px; background: #f8f9fa; border-radius: 6px; }
.learning { border-top: 2px solid #4a6cf7; padding-top: 16px; margin-top: 24px; }
.learning:nth-child(2) { border-color: #27ae60; }
.learning:nth-child(3) { border-color: #f5a623; }
.callout { background: #fffbf0; border: 1px solid #f5e6c8; padding: 10px 14px; border-radius: 6px; margin: 8px 0; font-size: 13px; }
.summary { background: #1a1a2e; color: #fff; padding: 20px; border-radius: 8px; text-align: center; margin-top: 24px; }
@media print { body { padding: 0; } .page-break { page-break-before: always; } }
</style></head><body>`;

    html += `<h1>Code Analysis: ${e(repoName)}</h1>`;

    if (overview) {
      html += `<h2>STEP 1: 全体俯瞰</h2>`;
      html += `<div class="info-grid">
        <div class="info-item"><div class="info-label">言語</div><div class="info-value">${e((overview.basic_info.languages || []).join(', '))}</div></div>
        <div class="info-item"><div class="info-label">フレームワーク</div><div class="info-value">${e(overview.basic_info.framework)}</div></div>
        <div class="info-item"><div class="info-label">規模</div><div class="info-value">${e(overview.basic_info.scale)}</div></div>
      </div>`;
      html += `<p>${e(overview.basic_info.description)}</p>`;
      html += `<h3>ディレクトリ構成</h3><pre>${e(overview.directory_structure)}</pre>`;
      html += `<h3>まずここを見ろガイド</h3><ol>`;
      (overview.reading_guide || []).forEach(g => {
        html += `<li><code>${e(g.file)}</code> - ${e(g.reason)}</li>`;
      });
      html += `</ol>`;
    }

    if (designKeys) {
      html += `<div class="page-break"></div><h2>STEP 2: 設計の鍵</h2>`;
      (designKeys.keys || []).forEach((key, i) => {
        html += `<div class="key-card"><h3>鍵${i + 1}: ${e(key.title)}（${e(key.english_name)}）</h3>
          <p style="font-size:12px;color:#4a6cf7;">${e(key.location)}</p>
          <p>${e(key.why_important)}</p>`;
        if (key.code_snippet) html += `<pre>${e(key.code_snippet)}</pre>`;
        html += `<div>${(key.required_knowledge || []).map(k => `<span class="tag">${e(k)}</span>`).join('')}</div>`;
        html += `<div class="callout">${e(key.thirty_sec_explanation)}</div></div>`;
      });
    }

    if (improvements) {
      html += `<div class="page-break"></div><h2>STEP 3: 改善ポイント（BUD分析）</h2>`;
      const budLabels = { bottlenecks: 'B - ボトルネック', unnecessary: 'U - 不必要な作業', duplicated: 'D - 重複する作業' };
      const bud = improvements.bud_analysis || {};
      for (const [type, label] of Object.entries(budLabels)) {
        const items = bud[type] || [];
        if (items.length === 0) continue;
        html += `<h3>${label}</h3>`;
        items.forEach(item => {
          html += `<div class="bud-item"><code>${e(item.location)}</code><br>${e(item.problem)}<br><strong style="color:#27ae60">→ ${e(item.suggestion)}</strong></div>`;
        });
      }
    }

    if (learnings) {
      html += `<div class="page-break"></div><h2>STEP 4: 今回の学び 3選</h2>`;
      (learnings.learnings || []).forEach((l, i) => {
        html += `<div class="learning"><h3>${l.number}. ${e(l.title)}（${e(l.english_name)}）</h3>
          <p>${e(l.what_you_can_do)}</p>
          <p style="font-size:13px;color:#4a6cf7;">場所: ${e(l.where_in_code)}</p>`;
        if (l.thirty_sec_code) html += `<pre>${e(l.thirty_sec_code)}</pre>`;
        html += `<div class="callout"><strong>深掘り:</strong> ${e(l.deep_dive)}<br><strong>参考:</strong> ${e(l.related_books)}</div>`;
        html += `</div>`;
      });
      // Include poster image if exists
      const poster = (typeof learningPosterImage !== 'undefined') ? learningPosterImage : null;
      if (poster) {
        html += `<div style="margin:24px 0;text-align:center;"><img src="${poster}" style="max-width:100%;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,0.1);" /></div>`;
      }
      html += `<div class="summary"><p>${e(learnings.summary)}</p></div>`;
    }

    html += `</body></html>`;
    return html;
  },

  downloadPDF(data) {
    const html = this.generatePrintHTML(data);
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  },

  // Generate Markdown for Notion paste
  generateMarkdown(data) {
    const { repoName, overview, designKeys, improvements, learnings } = data;
    let md = `# Code Analysis: ${repoName}\n\n`;

    if (overview) {
      md += `## STEP 1: 全体俯瞰\n\n`;
      md += `| 項目 | 値 |\n|------|-----|\n`;
      md += `| 言語 | ${(overview.basic_info.languages || []).join(', ')} |\n`;
      md += `| フレームワーク | ${overview.basic_info.framework} |\n`;
      md += `| アーキテクチャ | ${overview.basic_info.architecture} |\n`;
      md += `| 規模 | ${overview.basic_info.scale} |\n\n`;
      md += `${overview.basic_info.description}\n\n`;
      md += `### ディレクトリ構成\n\`\`\`\n${overview.directory_structure}\n\`\`\`\n\n`;
      md += `### まずここを見ろガイド\n`;
      (overview.reading_guide || []).forEach(g => {
        md += `${g.order}. \`${g.file}\` - ${g.reason}\n`;
      });
      md += `\n`;
    }

    if (designKeys) {
      md += `## STEP 2: 設計の鍵\n\n`;
      (designKeys.keys || []).forEach((key, i) => {
        md += `### 鍵${i + 1}: ${key.title}（${key.english_name}）\n`;
        md += `📍 ${key.location}\n\n`;
        md += `${key.why_important}\n\n`;
        if (key.code_snippet) md += `\`\`\`\n${key.code_snippet}\n\`\`\`\n\n`;
        md += `必要な知識: ${(key.required_knowledge || []).join(', ')}\n\n`;
        md += `> 💡 ${key.thirty_sec_explanation}\n\n`;
      });
    }

    if (improvements) {
      md += `## STEP 3: 改善ポイント（BUD分析）\n\n`;
      const bud = improvements.bud_analysis || {};
      const labels = { bottlenecks: 'B - ボトルネック', unnecessary: 'U - 不必要な作業', duplicated: 'D - 重複する作業' };
      for (const [type, label] of Object.entries(labels)) {
        const items = bud[type] || [];
        if (items.length === 0) continue;
        md += `### ${label}\n`;
        items.forEach(item => {
          md += `- **${item.location}**: ${item.problem} → ${item.suggestion}\n`;
        });
        md += `\n`;
      }
      if (improvements.concepts_to_know) {
        md += `### 関連する設計概念\n`;
        improvements.concepts_to_know.forEach(c => {
          md += `- **${c.name}**: ${c.relevance}\n`;
        });
        md += `\n`;
      }
    }

    if (learnings) {
      md += `## STEP 4: 今回の学び 3選\n\n`;
      (learnings.learnings || []).forEach((l, i) => {
        md += `### ${l.number}. ${l.title}（${l.english_name}）\n`;
        md += `${l.what_you_can_do}\n\n`;
        md += `📍 場所: ${l.where_in_code}\n\n`;
        if (l.thirty_sec_code) md += `\`\`\`\n${l.thirty_sec_code}\n\`\`\`\n\n`;
        md += `> 📚 **深掘り:** ${l.deep_dive}\n> **参考:** ${l.related_books}\n\n`;
      });
      // Poster image note
      const poster = (typeof learningPosterImage !== 'undefined') ? learningPosterImage : null;
      if (poster) {
        md += `### 学び3選 まとめ図解\n*(図解画像あり — Notionには画像を別途ドラッグ&ドロップで貼り付けてください)*\n\n`;
      }
      md += `---\n\n🎯 **まとめ:** ${learnings.summary}\n`;
    }

    return md;
  }
};

function e(str) {
  return str || '';
}
