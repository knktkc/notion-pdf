---
name: notion-pdf
description: NotionページをPDFファイルに変換するスキル。Notion MCPでページ内容を取得し、見栄えのよいPDFとして出力する。ユーザーがNotionページのURL・ページ名を指定してPDF化・PDF変換・PDF出力・印刷用出力・オフライン共有を依頼した場合に使用する。「NotionをPDFにして」「このページを印刷したい」「ドキュメントをPDFで共有したい」「Notionのページを保存したい」といった表現にも反応すること。ユーザーの発言にNotionページのURLが含まれていてPDF化の意図がある場合は、明示的にPDFと言っていなくても積極的にこのスキルの使用を検討する。
---

# Notion → PDF 変換スキル

NotionページをスタイリングされたPDFに変換する。

## 前提条件

- Notion MCP（`mcp__claude_ai_Notion`）が接続されていること
- Node.js がインストールされていること
- Chrome/Chromium が環境にあること（自動検出される）

## ワークフロー

### ステップ1: 対象ページの特定

ユーザーからNotionページの情報を受け取る。

- **URLが提供された場合**: そのままステップ2へ
- **ページ名が提供された場合**: `mcp__claude_ai_Notion__notion-search` で検索し、候補をユーザーに提示して選んでもらう
- **曖昧な場合**: どのページか確認する

### ステップ2: ページ内容の取得

`mcp__claude_ai_Notion__notion-fetch` でページ内容を取得する。返却形式はNotion Enhanced Markdown。

子ページを含める場合は、子ページのリンクを辿って再帰的に取得する。

### ステップ3: Markdownのクリーンアップ

取得したEnhanced Markdownには、Notion固有のタグ（`<page-*>`, `<data-source>`, `<mention>` 等）が含まれる。これらはブラウザで描画できないため、標準HTMLに変換または除去する必要がある。

詳細なクリーンアップルールは `references/notion-cleanup.md` を参照。

### ステップ4: HTML生成

クリーンアップしたMarkdownをHTMLに変換する。

HTMLテンプレートと変換ルールは `references/html-template.md` を参照。Primer CSSのテーマ変数を有効にするため `data-color-mode="light"` 属性が必須。これがないとテーブルのボーダー等のCSS変数が未定義になり、表示が崩れる。

**mermaid スクリプトの条件付き挿入**: ページに mermaid コードブロックが含まれない場合は、mermaid の `<script>` タグを省略する。CDN にアクセスできない環境でのタイムアウトを防ぐため。

生成したHTMLを作業ディレクトリに保存する。ファイル名はページタイトルをベースにする（例: `my-page.html`）。

### ステップ5: PDF変換

スキルディレクトリの `scripts/html-to-pdf.mjs` を使用する。puppeteer-core で HTML を開き、CSS の読み込みと mermaid 図のレンダリングを待ってから PDF 化するスクリプト。

Chrome/Chromium バイナリは環境から自動検出される（`CHROME_PATH` 環境変数でも指定可能）。HTML 内の CDN URL（Primer CSS、mermaid.js）は、`scripts/vendor/` または `scripts/node_modules/` にローカルファイルがあれば自動的にローカルパスに置換される（Primer CSS は `vendor/primer.css` に同梱済み）。

スキルディレクトリは `${CLAUDE_SKILL_DIR}` で参照できる。

```bash
# PDF生成
node ${CLAUDE_SKILL_DIR}/scripts/html-to-pdf.mjs <input.html> <output.pdf>
```

node_modules が存在しない場合は依存パッケージをインストールする:
```bash
npm install --prefix ${CLAUDE_SKILL_DIR}/scripts
```

スキルディレクトリが読み取り専用の場合（Claude Desktop 等）は、scripts を作業ディレクトリにコピーしてから実行する:
```bash
cp -r ${CLAUDE_SKILL_DIR}/scripts ./notion-pdf-scripts
npm install --prefix ./notion-pdf-scripts
node ./notion-pdf-scripts/html-to-pdf.mjs <input.html> <output.pdf>
```

### ステップ6: 完了

1. 生成されたPDFのパスをユーザーに報告
2. 一時HTMLファイルを削除
3. 追加ページの変換が必要か確認

## オプション

ユーザーが指定可能なオプション。指定がなければデフォルトを使用し、事前に聞かない。

| オプション | デフォルト | 説明 |
|-----------|----------|------|
| 出力ファイル名 | ページタイトル.pdf | PDFのファイル名 |
| 用紙サイズ | A4 | A4, Letter 等 |
| 子ページ含む | false | サブページも含めるか |

## エラーハンドリング

- **Notion MCPが未接続**: 接続設定を確認するよう案内する
- **ページが見つからない**: URLの再確認を促す
- **puppeteer-core未インストール**: `npm install --prefix ${CLAUDE_SKILL_DIR}/scripts` の実行を提案する（読み取り専用の場合はコピーしてから）
- **Chrome が見つからない**: `CHROME_PATH` 環境変数の設定か `chromium-browser` のインストールを提案する
- **画像取得失敗**: Notion S3の署名付きURLは一時的で期限切れになる場合がある。画像なしで続行し、取得できなかった画像を報告する
