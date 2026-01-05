#!/usr/bin/env python3
"""
生成数据JS文件，用于静态网站展示当前目录下的所有Markdown提示词文件
网站结构包括：static/index.html, static/data.js, static/style.css, static/script.js
现在使用文件名作为标题，排除README.md，并修复复制和预览问题
"""

import re
from pathlib import Path
import json


def filename_to_title(filename):
    """将文件名转换为标题（移除.md后缀并美化）"""
    # 移除.md后缀
    title = filename.replace('.md', '')
    # 将下划线和连字符替换为空格
    title = re.sub(r'[_-]', ' ', title)
    # 首字母大写
    title = title.strip().capitalize()
    return title


def escape_js_string(text):
    """为JavaScript字符串转义特殊字符，但保留换行符"""
    # 首先保存换行符，然后转义其他字符，最后恢复换行符
    text = text.replace('\n', '<!NEWLINE!>')
    text = text.replace('\r', '<!CARRIAGERETURN!>')
    text = text.replace('\\', '\\\\').replace('"', '\\"').replace("'", "\\'").replace('\t', '\\t')
    text = text.replace('<!NEWLINE!>', '\\n')
    text = text.replace('<!CARRIAGERETURN!>', '\\r')
    return text


def parse_front_matter(content):
    """解析Markdown文件头部的Front Matter"""
    try:
        if content.startswith('---'):
            parts = content.split('---', 2)
            if len(parts) > 2:
                front_matter_text = parts[1]
                main_content = parts[2].lstrip()

                tags = []
                priority = 0

                for line in front_matter_text.strip().split('\n'):
                    if ':' in line:
                        key, value = line.split(':', 1)
                        key = key.strip()
                        value = value.strip()
                        if key == 'tag':
                            tags = [tag.strip() for tag in value.split(',') if tag.strip()]
                        elif key == 'priority':
                            try:
                                priority = int(value)
                            except ValueError:
                                priority = 0

                return {'tags': tags, 'priority': priority}, main_content
    except Exception:
        # 解析失败则返回默认值
        pass

    # 如果没有Front Matter或解析失败，返回默认值和原始内容
    return {'tags': [], 'priority': 0}, content


def generate_data_js():
    # 获取当前目录下的所有.md文件，排除README.md
    current_dir = Path('.')
    markdown_files = [f for f in current_dir.glob('*.md') if f.name.lower() != 'readme.md']

    if not markdown_files:
        print("当前目录下没有找到Markdown文件（已排除README.md）")
        # 生成空数据
        js_content = "const promptData = [];"
        with open('static/data.js', 'w', encoding='utf-8') as f:
            f.write(js_content)
        print("已生成空数据文件: static/data.js")
        return

    # 读取所有Markdown文件内容
    cards_data = []
    for md_file in markdown_files:
        try:
            with open(md_file, 'r', encoding='utf-8') as f:
                raw_content = f.read()
        except UnicodeDecodeError:
            # 如果UTF-8解码失败，尝试其他编码
            with open(md_file, 'r', encoding='gbk', errors='ignore') as f:
                raw_content = f.read()

        metadata, content = parse_front_matter(raw_content)

        # 使用文件名作为标题
        title = filename_to_title(md_file.name)

        cards_data.append({
            'title': title,
            'content': content,
            'tags': metadata.get('tags', []),
            'priority': metadata.get('priority', 0),
            'filename': md_file.name,
        })

    # 根据priority降序排序
    cards_data.sort(key=lambda x: x['priority'], reverse=True)

    # 生成JavaScript数据文件
    js_content = f"var promptData = {json.dumps(cards_data, ensure_ascii=False, indent=2)};"

    # 写入数据JS文件
    with open('static/data.js', 'w', encoding='utf-8') as f:
        f.write(js_content)

    print(f"成功生成数据文件！共处理了 {len(cards_data)} 个Markdown文件。")
    print("数据已保存为: static/data.js")
    print("完整的网站结构包括：")
    print("- static/index.html (主页面)")
    print("- static/data.js (数据文件)")
    print("- static/style.css (样式文件)")
    print("- static/script.js (功能脚本)")
    print("\n请在浏览器中打开 static/index.html 查看结果。")

if __name__ == "__main__":
    generate_data_js()
