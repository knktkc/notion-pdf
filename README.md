# notion-pdf

NotionページをPDFファイルに変換する [Claude Code](https://docs.anthropic.com/en/docs/claude-code) スキル。

Notion MCPでページ内容を取得し、見栄えのよいPDFとして出力します。テーブル、mermaid図、トグル、callout、画像、色付きテキストなど主要なNotion要素に対応しています。

## 前提条件

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) がインストールされていること
- [Notion MCP](https://www.notion.com/integrations/claude) が接続されていること
- Node.js がインストールされていること

## インストール

### Skills CLIを使用（推奨）

```bash
npx skills add knktkc/notion-pdf -g -y
```

### 手動インストール

```bash
git clone https://github.com/knktkc/notion-pdf.git ~/.claude/skills/notion-pdf
```

## 使い方

Claude Codeに以下のように依頼します：

```
# URL指定
このNotionページをPDFにして: https://www.notion.so/your-page-id

# ページ名で検索
「プロジェクト計画書」のNotionページをPDFに変換して

# オプション指定
このページをLetter用紙サイズでPDFにして
```

## 対応するNotion要素

- テーブル
- mermaid図（コードブロック）
- トグル / 折りたたみ
- callout
- 画像
- 色付きテキスト / 背景色
- コードブロック（シンタックスハイライト付き）
- チェックボックス
- 数式
- 引用
- 区切り線

## オプション

| オプション | デフォルト | 説明 |
|-----------|----------|------|
| 出力ファイル名 | ページタイトル.pdf | PDFのファイル名 |
| 用紙サイズ | A4 | A4, Letter 等 |
| 子ページ含む | false | サブページも含めて変換するか |

## ファイル構成

```
notion-pdf/
├── SKILL.md                 # スキル定義（Claude Codeが読む）
├── scripts/
│   ├── html-to-pdf.mjs      # HTML→PDF変換スクリプト (Puppeteer)
│   └── package.json
└── references/
    ├── html-template.md      # HTMLテンプレートと変換ルール
    └── notion-cleanup.md     # Notion固有記法のクリーンアップガイド
```

## トラブルシューティング

### Notion MCPが接続されていない

Claude Codeの設定でNotion MCPの接続を確認してください。

### puppeteerのインストールエラー

```bash
npm install --prefix ~/.claude/skills/notion-pdf/scripts puppeteer
```

### 画像が表示されない

NotionのS3署名付きURLは一時的なものです。PDF変換時に期限切れになる場合があります。この場合、画像なしでPDFが生成され、取得できなかった画像が報告されます。

## ライセンス

[MIT](LICENSE)
