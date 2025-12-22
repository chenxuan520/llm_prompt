// 改进的Markdown解析器，正确处理换行
function simpleMarkdownToHtml(md) {
    if (!md) return '';

    // 首先将转义的换行符转换为实际换行符
    let html = md.replace(/\\n/g, '\n').replace(/\\r/g, '\r');

    // 处理代码块（```包围的）
    html = html.replace(/```([\s\S]*?)```/g, function(match, code) {
        // 在代码块内部不处理换行，保持原样
        return '<pre><code>' + escapeHtml(code) + '</code></pre>';
    });

    // 处理行内代码（在处理其他格式前先处理代码，避免误处理）
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');

    // 处理标题
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

    // 处理粗体和斜体
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // 处理删除线
    html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');

    // 处理链接
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    // 处理图片
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

    // 处理列表
    html = html.replace(/^\- (.*$)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gs, function(match) {
        // 确保列表项正确包裹
        const listItems = match.match(/<li>.*?<\/li>/gs);
        if (listItems) {
            return '<ul>' + listItems.join('') + '</ul>';
        }
        return match;
    });

    // 处理引用
    html = html.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');

    // 处理换行 - 将单个换行转为<br>，将多个连续换行转为段落分隔
    html = html.replace(/\r\n/g, '\n'); // 统一换行符
    html = html.replace(/\n\n/g, '<!DOUBLE_BR!>'); // 先临时标记双换行
    html = html.replace(/\n/g, '<br>'); // 单换行转为<br>
    html = html.replace(/<!DOUBLE_BR!>/g, '</p><p>'); // 双换行转为段落分隔

    // 用<p>标签包围内容
    if (!html.startsWith('<h') && !html.startsWith('<')) {
        html = '<p>' + html;
    }
    html += '</p>';

    // 清理多余的标签
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p><br>/g, '<p>');
    html = html.replace(/<br><\/p>/g, '</p>');

    // 确保列表格式正确
    html = html.replace(/<p><ul>/g, '<ul>');
    html = html.replace(/<\/ul><\/p>/g, '</ul>');
    html = html.replace(/<p><li>/g, '<li>');
    html = html.replace(/<\/li><\/p>/g, '</li>');

    // 处理引用的段落
    html = html.replace(/<blockquote>(.*?)<\/blockquote>/g, function(match, content) {
        return '<blockquote>' + content.replace(/<p>(.*?)<\/p>/g, '$1').replace(/<br>/g, '<br>') + '</blockquote>';
    });

    return html;
}

// HTML转义函数，防止XSS
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// 复制功能 - 解析转义字符
function copyToClipboard(button) {
    const card = button.closest('.card');
    let content = card.getAttribute('data-content');

    // 将转义的换行符转换为实际换行符
    content = content.replace(/\\n/g, '\n').replace(/\\r/g, '\r');

    // 检查 navigator.clipboard 是否可用
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(content).then(() => {
            const originalText = button.textContent;
            button.textContent = '✓ 已复制!';
            button.classList.add('copied');

            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('复制失败:', err);
            // 如果 navigator.clipboard 不支持，则使用旧方法
            fallbackCopyTextToClipboard(content, button);
        });
    } else {
        // 如果 navigator.clipboard 不可用，直接使用旧方法
        fallbackCopyTextToClipboard(content, button);
    }
}

// 旧版复制功能（兼容性备用）
function fallbackCopyTextToClipboard(text, button) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            const originalText = button.textContent;
            button.textContent = '✓ 已复制!';
            button.classList.add('copied');

            setTimeout(() => {
                button.textContent = originalText;
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

// 搜索功能
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const cardsContainer = document.getElementById('cardsContainer');

    if (!searchInput || !cardsContainer) {
        console.error('搜索元素未找到');
        return;
    }

    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const cards = document.querySelectorAll('.card');
        let visibleCount = 0;

        cards.forEach(card => {
            const title = card.getAttribute('data-title').toLowerCase();
            const filename = card.getAttribute('data-filename').toLowerCase();
            const content = card.getAttribute('data-content').toLowerCase();

            if (title.includes(searchTerm) || filename.includes(searchTerm) || content.includes(searchTerm)) {
                card.style.display = 'flex';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        // 如果没有匹配项，显示"没有结果"
        const noResults = document.querySelector('.no-results');
        if (noResults) {
            noResults.remove();
        }

        if (visibleCount === 0 && searchTerm !== '') {
            const noResultsDiv = document.createElement('div');
            noResultsDiv.className = 'no-results';
            noResultsDiv.textContent = '没有找到匹配的提示词';
            cardsContainer.appendChild(noResultsDiv);
        }
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化搜索功能
    initSearch();

    // 页面加载时聚焦到搜索框
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.focus();
    }
});

// 防抖函数，优化搜索性能
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

// 强制刷新缓存功能
function initRefreshCache() {
    const refreshBtn = document.getElementById('refreshCacheBtn');

    if (refreshBtn) {
        refreshBtn.addEventListener('click', async function(e) {
            e.preventDefault();

            // 显示加载状态
            const originalContent = refreshBtn.innerHTML;
            refreshBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" fill="currentColor"/>
                </svg>
            `;
            refreshBtn.disabled = true;

            try {
                // 移除现有的data.js脚本
                const existingScript = document.querySelector('script[src*="data.js"]');
                if (existingScript) {
                    existingScript.remove();
                }

                // 清除现有的promptData变量（对于var声明的变量，直接设为undefined即可）
                if (window.promptData) {
                    window.promptData = undefined;
                }

                // 创建新的script标签，添加时间戳避免缓存
                const script = document.createElement('script');
                const timestamp = new Date().getTime();
                script.src = `data.js?t=${timestamp}`;

                // 等待脚本加载完成
                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });

                // 重新生成卡片
                if (typeof promptData !== 'undefined' && promptData.length > 0) {
                    const container = document.getElementById('cardsContainer');
                    container.innerHTML = ''; // 清空现有卡片

                    promptData.forEach(item => {
                        const card = document.createElement('div');
                        card.className = 'card';
                        card.setAttribute('data-title', item.title);
                        card.setAttribute('data-filename', item.filename);
                        card.setAttribute('data-content', item.content);

                        card.innerHTML = `
                            <div class="card-header">
                                <div class="card-title">${item.title}</div>
                                <button class="copy-btn" onclick="copyToClipboard(this)">复制</button>
                            </div>
                            <div class="card-body">
                                <div class="markdown-content">${simpleMarkdownToHtml(item.preview)}</div>
                            </div>
                        `;

                        container.appendChild(card);
                    });

                    // 重新初始化搜索功能
                    setTimeout(initSearch, 100);

                    // 显示成功状态
                    const successContent = `
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                        </svg>
                    `;
                    refreshBtn.innerHTML = successContent;

                    setTimeout(() => {
                        refreshBtn.innerHTML = originalContent;
                        refreshBtn.disabled = false;
                    }, 1000);
                } else {
                    throw new Error('数据加载失败或为空');
                }
            } catch (error) {
                console.error('刷新缓存失败:', error);

                // 显示错误状态
                const errorContent = `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
                    </svg>
                `;
                refreshBtn.innerHTML = errorContent;

                setTimeout(() => {
                    refreshBtn.innerHTML = originalContent;
                    refreshBtn.disabled = false;
                }, 2000);

                alert('刷新缓存失败，请确保已运行 python3 generate_prompt_site.py 生成最新的data.js文件');
            }
        });
    }
}

// 主题切换功能
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');

    // 检查用户之前的主题选择，否则跟随系统
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

    setTheme(initialTheme);

    themeToggle.addEventListener('click', (e) => {
        e.preventDefault(); // 阻止链接默认行为
        const currentTheme = document.body.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        setTheme(newTheme);
        localStorage.setItem('theme', newTheme); // 保存用户选择
    });

    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            // 只有当用户没有手动选择主题时，才跟随系统
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
}

// 设置主题
function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);

    // 更新左上角主题切换按钮
    const themeSVG = document.querySelector('.theme-toggle svg');
    if (themeSVG) {
        const textElement = themeSVG.querySelector('text');
        if (textElement) {
            textElement.textContent = theme === 'dark' ? '🌙' : '☀';
        }

        // 根据主题更新三角形背景色
        const pathElement = themeSVG.querySelector('path');
        if (pathElement) {
            if (theme === 'dark') {
                pathElement.setAttribute('style', 'fill: #000000;');
            } else {
                pathElement.setAttribute('style', 'fill: #3498db;');
            }
        }
    }

    // 更新右上角GitHub链接的颜色
    const githubSVG = document.querySelector('.github-link svg');
    if (githubSVG) {
        const githubPath = githubSVG.querySelector('path');
        if (githubPath && githubPath.getAttribute('d').includes('L250,0 Z')) { // GitHub主三角形
            if (theme === 'dark') {
                githubPath.setAttribute('style', 'fill: #000000;');
            } else {
                githubPath.setAttribute('style', 'fill: #3498db;');
            }
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化搜索功能
    initSearch();

    // 初始化主题切换功能
    initThemeToggle();

    // 初始化刷新缓存功能
    initRefreshCache();

    // 页面加载时聚焦到搜索框
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.focus();
    }

    // 添加全局键盘事件监听器，当用户按任意键时聚焦到搜索框
    // 但要避免在用户已经在输入框中输入时干扰
    document.addEventListener('keydown', function(event) {
        // 检查是否在输入框、文本域或可编辑元素中
        const activeElement = document.activeElement;
        const isInputElement = activeElement.tagName === 'INPUT' ||
                              activeElement.tagName === 'TEXTAREA' ||
                              activeElement.contentEditable === 'true';

        // 如果当前不在输入元素中，且按下的不是修饰键（如Ctrl, Alt, Shift等）
        if (!isInputElement &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey &&
            event.key.length === 1) { // 只有当按键是单个字符时才触发
            const searchInput = document.getElementById('searchInput');
            if (searchInput && searchInput !== activeElement) {
                searchInput.focus();
                // 在搜索框中插入按下的字符
                const start = searchInput.selectionStart;
                const end = searchInput.selectionEnd;
                const oldValue = searchInput.value;
                searchInput.value = oldValue.substring(0, start) + event.key + oldValue.substring(end);
                // 设置光标位置到插入字符后
                const newCursorPos = start + 1;
                searchInput.setSelectionRange(newCursorPos, newCursorPos);

                // 触发input事件，让搜索立即生效
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));

                // 阻止默认行为以防止在页面上输入
                event.preventDefault();
            }
        }
    });
});
