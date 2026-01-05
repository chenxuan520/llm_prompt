// 全局状态
let currentTag = 'all';
let allPrompts = []; // 保存从 data.js 加载的原始数据

// 主渲染函数，在页面加载时调用
function renderPage() {
    // 检查 promptData 是否已加载
    if (typeof promptData === 'undefined' || !Array.isArray(promptData)) {
        console.error('Prompt data is not loaded or invalid.');
        // 可以在页面上显示错误信息
        const container = document.getElementById('cardsContainer');
        if (container) {
            container.innerHTML = '<div class="no-results">数据加载失败，请确保 data.js 文件存在且格式正确。</div>';
        }
        return;
    }

    // 保存原始数据
    allPrompts = promptData;

    // 初始化所有功能
    renderTags();
    applyFilters();
    initSearch();
    initThemeToggle();
    initRefreshCache();
    initGlobalKeyListener();

    // 页面加载时聚焦到搜索框
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.focus();
    }
}

// 渲染标签按钮
function renderTags() {
    const tagsContainer = document.getElementById('tags-container');
    if (!tagsContainer) return;

    // 计算每个标签的优先级总和
    const tagPrioritySum = {};
    allPrompts.forEach(p => {
        if (p.tags && Array.isArray(p.tags)) {
            p.tags.forEach(tag => {
                if (!tagPrioritySum[tag]) {
                    tagPrioritySum[tag] = 0;
                }
                tagPrioritySum[tag] += p.priority || 0;
            });
        }
    });

    // 根据优先级总和对标签进行排序
    const sortedTags = Object.keys(tagPrioritySum).sort((a, b) => {
        return tagPrioritySum[b] - tagPrioritySum[a];
    });

    // 创建按钮
    tagsContainer.innerHTML = ''; // 清空
    const allButton = createTagButton('全部', 'all');
    allButton.classList.add('active'); // 默认激活
    tagsContainer.appendChild(allButton);

    sortedTags.forEach(tag => {
        tagsContainer.appendChild(createTagButton(tag, tag));
    });
}

// 创建单个标签按钮
function createTagButton(text, tagValue) {
    const button = document.createElement('button');
    button.className = 'tag-btn';
    button.textContent = text;
    button.dataset.tag = tagValue;
    button.addEventListener('click', () => {
        currentTag = tagValue;
        // 更新激活状态
        document.querySelectorAll('.tag-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        // 应用过滤和搜索
        applyFilters();
    });
    return button;
}

// 应用过滤和搜索
function applyFilters() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = (searchInput.value || '').toLowerCase();

    // 1. 按标签过滤
    let filteredPrompts = [];
    if (currentTag === 'all') {
        filteredPrompts = allPrompts;
    } else {
        filteredPrompts = allPrompts.filter(p => p.tags && p.tags.includes(currentTag));
    }

    // 2. 按搜索词过滤
    if (searchTerm) {
        filteredPrompts = filteredPrompts.filter(p =>
            (p.title && p.title.toLowerCase().includes(searchTerm)) ||
            (p.content && p.content.toLowerCase().includes(searchTerm)) ||
            (p.filename && p.filename.toLowerCase().includes(searchTerm))
        );
    }

    // 渲染最终的卡片
    renderCards(filteredPrompts);

    // 处理无结果的情况
    const noResults = document.querySelector('.no-results');
    if (noResults) noResults.remove();
    if (filteredPrompts.length === 0) {
        const cardsContainer = document.getElementById('cardsContainer');
        const noResultsDiv = document.createElement('div');
        noResultsDiv.className = 'no-results';
        noResultsDiv.textContent = '没有找到匹配的提示词';
        cardsContainer.appendChild(noResultsDiv);
    }
}

// 渲染卡片
function renderCards(promptsToRender) {
    const container = document.getElementById('cardsContainer');
    if (!container) return;
    container.innerHTML = ''; // 清空现有卡片

    promptsToRender.forEach(item => {
        // 创建预览文本 (不含 front matter)
        const preview = item.content.substring(0, 500).trim() + (item.content.length > 500 ? '\n\n...' : '');

        const card = document.createElement('div');
        card.className = 'card';
        // data-* 属性用于搜索和复制，确保它们不包含转义字符
        card.setAttribute('data-title', item.title);
        card.setAttribute('data-filename', item.filename);
        card.setAttribute('data-content', item.content); // 存的是不含元数据的纯内容

        card.innerHTML = `
            <div class="card-header">
                <div class="card-title">${escapeHtml(item.title)}</div>
                <button class="copy-btn" onclick="copyToClipboard(this)">复制</button>
            </div>
            <div class="card-body">
                <div class="markdown-content">${simpleMarkdownToHtml(preview)}</div>
            </div>
        `;
        container.appendChild(card);
    });
}


// 搜索功能 (现在只触发过滤)
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    // 使用 debounce 优化性能
    searchInput.addEventListener('input', debounce(applyFilters, 250));
}

// 复制功能
function copyToClipboard(button) {
    const card = button.closest('.card');
    const content = card.getAttribute('data-content'); // 直接获取纯文本

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(content).then(() => {
            button.textContent = '✓ 已复制!';
            button.classList.add('copied');
            setTimeout(() => {
                button.textContent = '复制';
                button.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('复制失败:', err);
            fallbackCopyTextToClipboard(content, button);
        });
    } else {
        fallbackCopyTextToClipboard(content, button);
    }
}

// 旧版复制功能
function fallbackCopyTextToClipboard(text, button) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            button.textContent = '✓ 已复制!';
            button.classList.add('copied');
            setTimeout(() => {
                button.textContent = '复制';
                button.classList.remove('copied');
            }, 2000);
        } else {
            alert('复制失败，请手动复制');
        }
    } catch (err) {
        console.error('复制失败:', err);
        alert('复制失败，请手动复制');
    }
    document.body.removeChild(textArea);
}

// 强制刷新缓存
function initRefreshCache() {
    const refreshBtn = document.getElementById('refreshCacheBtn');
    if (!refreshBtn) return;

    refreshBtn.addEventListener('click', () => {
        // 通过重新加载页面并附加一个无意义的时间戳参数来强制浏览器重新请求JS文件
        window.location.href = window.location.pathname + '?t=' + new Date().getTime();
    });
}

// 全局按键监听
function initGlobalKeyListener() {
    document.addEventListener('keydown', (event) => {
        const activeElement = document.activeElement;
        const isInputElement = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable;

        if (!isInputElement && !event.ctrlKey && !event.metaKey && !event.altKey && event.key.length === 1) {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
                // 不再手动插入字符，因为聚焦后用户的输入会自然进入
            }
        }
    });
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// --- 以下是未改变的辅助函数 ---

// HTML转义
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Markdown转HTML
function simpleMarkdownToHtml(md) {
    if (!md) return '';
    let html = escapeHtml(md); // 先转义，防止XSS
    
    // 恢复代码块和行内代码的特殊字符
    html = html.replace(/```([\s\S]*?)```/g, (match, code) => '<pre><code>' + code + '</code></pre>');
    html = html.replace(/`([^`]+)`/g, (match, code) => '<code>' + code + '</code>');

    // 标题
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    // 列表
    html = html.replace(/^\- (.*$)/gm, '<ul><li>$1</li></ul>');
    html = html.replace(/<\/ul>\n<ul>/g, ''); // 合并连续的列表
    // 引用
    html = html.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');
    // 加粗、斜体、删除线
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');
    // 链接
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    // 换行符处理
    html = html.replace(/\n/g, '<br>');
    // 用p标签包裹
    html = '<p>' + html.replace(/<br><br>/g, '</p><p>') + '</p>';
    // 清理空段落
    html = html.replace(/<p><\/p>/g, '');

    return html;
}

// 主题切换
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if(!themeToggle) return;

    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    setTheme(initialTheme);

    themeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        const currentTheme = document.body.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
}

function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    const themeIcon = document.querySelector('.theme-toggle text');
    if (themeIcon) {
        themeIcon.textContent = theme === 'dark' ? '🌙' : '☀';
    }
    // 更新角落颜色
    document.querySelectorAll('.github-link path, .theme-toggle path').forEach(el => {
        if(el.getAttribute('d').startsWith('M0,0')) { // 只选择背景三角
             el.style.fill = theme === 'dark' ? '#000' : '#3498db';
        }
    });
}
