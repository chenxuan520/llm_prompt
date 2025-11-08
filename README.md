# llm_prompt

一个用于管理和展示AI提示词的静态网站工具，可以将目录下的Markdown文件转换为可浏览和复制的提示词卡片。

## 功能特性

- 将当前目录下的所有Markdown文件（除README.md外）转换为提示词卡片
- 支持搜索和筛选提示词
- 一键复制提示词内容
- 黑白主题切换
- 静态网页，无需服务器即可运行

## 使用方法

### 1. 准备提示词文件

将你的AI提示词保存为Markdown文件（`.md`格式），放在项目根目录下。例如：
- `chatgpt_prompt.md`
- `image_generation.md`
- `code_review.md`

### 2. 生成数据文件

运行Python脚本生成数据文件：

```bash
python3 generate_prompt_site.py
```

该脚本会：
- 扫描当前目录下所有`.md`文件（排除README.md）
- 将文件名转换为标题（下划线和连字符会转换为空格）
- 生成`static/data.js`数据文件
- 显示处理的文件数量

### 3. 查看网站

在浏览器中打开`static/index.html`文件即可查看提示词管理器界面。

## 网站功能

- **搜索框**：输入关键词筛选提示词
- **复制按钮**：一键复制提示词内容
- **预览功能**：显示提示词前500个字符作为预览
- **主题切换**：左上角按钮可切换黑白主题
- **GitHub链接**：右上角可访问项目仓库

## 文件结构

```
llm_prompt/
├── generate_prompt_site.py  # 生成数据文件的脚本
├── static/
│   ├── index.html         # 主页面
│   ├── data.js            # 生成的数据文件
│   ├── style.css          # 样式文件
│   └── script.js          # 功能脚本
├── *.md                   # 你的提示词文件
└── README.md
```

## 自定义

- 修改`static/style.css`可以自定义页面样式
- 修改`static/script.js`可以扩展网站功能
- 在根目录添加新的`.md`文件即可添加新的提示词

## 适用场景

- 个人AI工具提示词管理
- 团队共享提示词库
- 快速复制常用提示词
- 提示词版本管理（配合Git）
