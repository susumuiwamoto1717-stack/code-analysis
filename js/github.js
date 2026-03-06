// GitHub API integration (public repos only, no auth needed)

const GitHubAPI = {
  parseUrl(url) {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
    if (!match) throw new Error('GitHub URLの形式が正しくありません');
    return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
  },

  async getRepoInfo(owner, repo) {
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!repoRes.ok) throw new Error(`リポジトリが見つかりません (${repoRes.status})`);
    const repoData = await repoRes.json();

    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${repoData.default_branch}?recursive=1`);
    const treeData = await treeRes.json();

    const langRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`);
    const langData = await langRes.json();

    return { repo: repoData, tree: treeData, languages: langData };
  },

  async getFileContent(owner, repo, filePath, branch) {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`, {
      headers: { 'Accept': 'application/vnd.github.v3.raw' }
    });
    if (!res.ok) throw new Error(`ファイル取得失敗: ${filePath}`);
    return res.text();
  },

  // Select important files for analysis
  selectKeyFiles(tree) {
    const files = tree.tree.filter(t => t.type === 'blob');

    const priorityPatterns = [
      /^package\.json$/, /^Gemfile$/, /^requirements\.txt$/, /^Cargo\.toml$/,
      /^index\.html$/, /^app\.js$/, /^main\.js$/, /^server\.js$/,
      /^app\.py$/, /^main\.py$/,
      /^config\/routes\.rb$/, /^db\/schema\.rb$/,
      /^app\/controllers\/application_controller\.rb$/,
      /^src\/App\.(jsx?|tsx?)$/, /^src\/index\.(jsx?|tsx?)$/, /^src\/main\.(jsx?|tsx?)$/,
    ];

    const codeExtensions = new Set(['.js', '.ts', '.jsx', '.tsx', '.rb', '.py', '.go', '.rs', '.java', '.html', '.css', '.vue', '.svelte']);

    const scored = files
      .filter(f => {
        const ext = '.' + f.path.split('.').pop();
        return codeExtensions.has(ext) && f.size < 50000;
      })
      .filter(f => !f.path.includes('node_modules/') && !f.path.includes('vendor/') && !f.path.includes('.min.') && !f.path.includes('dist/'))
      .map(f => {
        let score = 0;
        if (priorityPatterns.some(p => p.test(f.path))) score += 100;
        score += Math.max(0, 10 - f.path.split('/').length * 2);
        score += Math.max(0, 10 - Math.floor(f.size / 5000));
        if (f.path.match(/config|route|schema|model|controller/i)) score += 20;
        if (f.path.match(/app\.|main\.|index\.|server\./i)) score += 30;
        return { ...f, score };
      })
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, 8);
  },

  // Build tree display string
  buildTreeDisplay(tree) {
    const files = tree.tree
      .filter(t => t.type === 'blob')
      .filter(f => !f.path.includes('node_modules/') && !f.path.includes('.git/') && !f.path.includes('vendor/'))
      .map(f => f.path)
      .sort();

    // Simple tree builder
    const lines = [];
    const dirs = new Set();
    files.forEach(f => {
      const parts = f.split('/');
      let current = '';
      parts.forEach((part, i) => {
        current += (i > 0 ? '/' : '') + part;
        if (i < parts.length - 1 && !dirs.has(current)) {
          dirs.add(current);
        }
      });
    });

    // Flatten to indented list
    files.forEach(f => {
      const depth = f.split('/').length - 1;
      const indent = '  '.repeat(depth);
      const name = f.split('/').pop();
      lines.push(`${indent}${name}`);
    });

    return lines.join('\n');
  }
};
