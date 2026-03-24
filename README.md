# notion-pdf

NotionページをPDFファイルに変換する [Claude Code](https://docs.anthropic.com/en/docs/claude-code) / [Claude Desktop](https://claude.ai) スキル。

Notionからページ内容を取得し、見栄えのよいPDFとして出力します。テーブル、mermaid図、トグル、callout、画像、色付きテキストなど主要なNotion要素に対応しています。

👉 [サンプルPDFを見る](samples/sample.pdf)

## 使い方

Claudeに以下のように依頼するだけです：

```
このNotionページをPDFにして: https://www.notion.so/your-page-id

「プロジェクト計画書」のNotionページをPDFに変換して

このページをLetter用紙サイズでPDFにして
```

## Claude Code で使う

### 前提条件

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) がインストールされていること
- [Notion 連携](https://www.notion.com/integrations/claude) が設定されていること
- Node.js がインストールされていること

### インストール

```bash
npx skills add knktkc/notion-pdf -g -y
```

<details>
<summary>手動でインストールする場合</summary>

```bash
git clone https://github.com/knktkc/notion-pdf.git ~/.claude/skills/notion-pdf
```

</details>

## Claude Desktop で使う

### 前提条件

- [Claude Desktop](https://claude.ai)（Max プランまたは Team プラン）にログインしていること

### インストール

1. [Releases](https://github.com/knktkc/notion-pdf/releases) ページから `notion-pdf.zip` をダウンロード
2. Claude Desktop の画面左下 **⚙ Settings** → **Features** → **Skills** を開く
3. `notion-pdf.zip` をアップロード

### Notion の接続

PDF変換にはNotionとの連携が必要です。会話ごとに以下の手順で接続してください：

1. チャット入力欄の左にある **＋（Connectors）** ボタンをクリック
2. **Notion** を選択して接続

## 対応するNotion要素

テーブル / mermaid図 / トグル・折りたたみ / callout / 画像 / 色付きテキスト・背景色 / コードブロック / チェックボックス / 数式 / 引用 / 区切り線

## オプション

| オプション | デフォルト | 説明 |
|-----------|----------|------|
| 出力ファイル名 | ページタイトル.pdf | PDFのファイル名 |
| 用紙サイズ | A4 | A4, Letter 等 |
| 子ページ含む | false | サブページも含めて変換するか |

これらは会話の中で指定できます（例: 「Letter用紙サイズで」「サブページも含めて」）。指定しなければデフォルト値が使われます。

## トラブルシューティング

### Notionが接続されていない

- **Claude Code**: [Notion 連携](https://www.notion.com/integrations/claude)のページから設定してください
- **Claude Desktop**: チャット入力欄の **＋** ボタンから Notion を接続してください

### 画像が表示されない

NotionのS3署名付きURLは一時的なものです。PDF変換時に期限切れになる場合があります。この場合、画像なしでPDFが生成され、取得できなかった画像が報告されます。

<details>
<summary>開発者向けトラブルシューティング</summary>

### Chrome が見つからない

`CHROME_PATH` 環境変数で Chrome のパスを指定してください：

```bash
export CHROME_PATH=/path/to/chrome
```

### 依存パッケージのインストールエラー

```bash
npm install --prefix ~/.claude/skills/notion-pdf/scripts
```

スキルディレクトリが読み取り専用の場合は、作業ディレクトリにコピーしてからインストールしてください。

</details>

## ファイル構成

<details>
<summary>開発者向け</summary>

```
notion-pdf/
├── SKILL.md                 # スキル定義（Claudeが読む）
├── scripts/
│   ├── html-to-pdf.mjs      # HTML→PDF変換スクリプト (puppeteer-core)
│   ├── vendor/primer.css     # Primer CSS（オフライン用）
│   ├── build-zip.sh          # Claude Desktop用ZIPビルド
│   └── package.json
└── references/
    ├── html-template.md      # HTMLテンプレートと変換ルール
    └── notion-cleanup.md     # Notion固有記法のクリーンアップガイド
```

</details>

## ライセンス

[MIT](LICENSE)
