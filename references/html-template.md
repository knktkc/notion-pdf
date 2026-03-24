# HTMLテンプレートと変換ルール

## テンプレート

```html
<!DOCTYPE html>
<html lang="ja" data-color-mode="light" data-light-theme="light">
<head>
<meta charset="UTF-8">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@primer/css@21/dist/primer.css">
<style>
  @page {
    size: A4;
    margin: 20mm;
  }
  body {
    padding: 0;
    margin: 0;
  }
  .markdown-body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                 "Noto Sans CJK JP", "Noto Sans JP", "Hiragino Sans",
                 Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
    padding: 32px;
    max-width: none;
  }
  .markdown-body img {
    max-width: 100%;
  }
  /* --- Primer CSS 変数のフォールバック ---
     Primer CSS はテーマ変数に依存しており、環境によっては
     変数が未定義になる。以下で明示的な値をフォールバックとして定義する。 */
  .markdown-body table {
    border-collapse: collapse;
    width: 100%;
  }
  .markdown-body table th,
  .markdown-body table td {
    border: 1px solid #d0d7de;
    padding: 6px 13px;
  }
  .markdown-body table th {
    background-color: #f6f8fa;
    font-weight: 600;
  }
  .markdown-body table tr {
    background-color: #ffffff;
    border-top: 1px solid #d8dee4;
  }
  .markdown-body table tr:nth-child(2n) {
    background-color: #f6f8fa;
  }
  .markdown-body blockquote {
    border-left: .25em solid #d0d7de;
    color: #656d76;
  }
  .markdown-body h1,
  .markdown-body h2 {
    border-bottom: 1px solid #d8dee4;
  }
  .markdown-body h6 {
    color: #656d76;
  }
  .markdown-body hr {
    border-bottom: 1px solid #d0d7de;
  }
  .markdown-body code,
  .markdown-body tt {
    background-color: rgba(175,184,193,0.2);
  }
  .markdown-body pre {
    background-color: #f6f8fa;
  }
  .markdown-body details[open] {
    background-color: var(--bgColor-muted, #f6f8fa);
    border-radius: 6px;
    padding: 0 16px 16px;
    margin: 8px 0 16px 0;
  }
  .markdown-body details[open] > summary {
    margin: 0 -16px;
    padding: 8px 16px;
  }
  @media print {
    .markdown-body {
      padding: 0;
    }
    .markdown-body h1,
    .markdown-body h2,
    .markdown-body h3 {
      page-break-after: avoid;
    }
    .markdown-body pre,
    .markdown-body table,
    .markdown-body img {
      page-break-inside: avoid;
    }
  }
</style>
</head>
<body>
<article class="markdown-body">
<!-- 変換したHTML本文 -->
</article>
<!-- mermaid コードブロックがある場合のみ以下を挿入 -->
<script type="module">
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
mermaid.initialize({ startOnLoad: true, theme: 'neutral' });
</script>
</body>
</html>
```

### テンプレートの重要なポイント

- **`data-color-mode="light" data-light-theme="light"`**: Primer CSSのテーマ変数（`--borderColor-default` 等）を有効化する属性。これがないとテーブルのボーダーが透明になる
- **`primer.css`（フルバンドル）**: `markdown.css` 単体ではCSS変数の定義が含まれないため、フルバンドルを使う
- **mermaid.js**: コードブロック内のmermaid記法を図としてレンダリングする。CDNから読み込み、Puppeteerのレンダリング待機と組み合わせて動作する。**ページに mermaid コードブロックがない場合はスクリプトタグを省略する**（CDN 非対応環境でのタイムアウト防止）
- **CDN フォールバック**: `html-to-pdf.mjs` は、ローカルの `node_modules` に `@primer/css` や `mermaid` があれば CDN URL を自動的にローカルパスに置換する。CDN にアクセスできない環境（Claude Desktop 等）でも動作する
- **CSS 変数フォールバック**: Primer CSS の多くのスタイル（テーブルボーダー、blockquote、見出し下線、コードブロック背景等）はテーマ CSS 変数に依存しており、環境によっては変数が未定義で透明になる。`<style>` ブロック内で明示的な色値をフォールバックとして定義している
- **`details[open]` スタイル**: Primer CSSにはdetails要素のスタイルが定義されていないため、展開状態のトグルに薄いグレー背景を付けて範囲を明確にする補完スタイル

## Markdown → HTML 変換ルール

### 基本要素

| Markdown | HTML |
|----------|------|
| `# 見出し` 〜 `###### 見出し` | `<h1>` 〜 `<h6>` |
| 段落テキスト | `<p>` |
| `**太字**` | `<strong>` |
| `*斜体*` | `<em>` |
| `~~取消線~~` | `<del>` |
| `- リスト` | `<ul><li>` |
| `1. リスト` | `<ol><li>` |
| `[text](url)` | `<a href="url">text</a>` |
| `![alt](url)` | `<img src="url" alt="alt">` |
| インラインコード | `<code>` |
| コードブロック | `<pre><code class="language-xxx">` |
| `> 引用` | `<blockquote>` |
| テーブル | `<table>` with `<thead>` / `<tbody>` |
| `---` | `<hr>` |
| `- [ ]` / `- [x]` | ☐ / ☑ |

### 特殊要素

| 要素 | HTML | 理由 |
|------|------|------|
| mermaidコードブロック | `<pre class="mermaid">` | `<code>` タグを付けない。mermaid.jsが `<pre class="mermaid">` を検出して図に変換する |
| トグル/折りたたみ | `<details open><summary>タイトル</summary>内容</details>` | PDFでは常に展開状態にする。`open` 属性がないと中身が出力されない |
| callout | `<blockquote>` またはカスタムdiv | アイコンがあればテキストとして保持 |
| 色付きテキスト `<span color="red">` | `<span style="color: #cf222e">` または `.text-red` クラス | Notionのcolor属性はブラウザが解釈できないため、CSSに変換する |
| 色付き背景セクション `{color="green_bg"}` | `.section-label.bg-green` 等のクラス | 視覚的な区別を保持するため |

### 色付き要素のCSSクラス（必要に応じてstyleタグに追加）

```css
.callout {
  border-left: 4px solid #218bff;
  background-color: #ddf4ff;
  padding: 12px 16px;
  margin: 16px 0;
  border-radius: 0 6px 6px 0;
}
.section-label {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 6px;
  font-weight: 600;
  margin: 16px 0 8px 0;
}
.bg-green { background-color: #dafbe1; }
.text-red { color: #cf222e; }
```

これらはPrimer CSSに含まれない補完スタイル。Notionのcalloutや色付き要素がページに含まれる場合のみ追加する。
