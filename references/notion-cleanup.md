# Notion Enhanced Markdown クリーンアップガイド

`notion-fetch` が返すEnhanced Markdownには、PDF化に不要なNotion固有の記法が含まれる。以下のルールでクリーンアップする。

## 除去するタグ

### ページメタデータタグ
```
<page-title>...</page-title>         → 削除（h1として別途使用）
<page-icon>...</page-icon>           → 削除
<page-cover>...</page-cover>         → 削除（または画像として保持）
<page-properties>...</page-properties> → ヘッダー情報として整形するか削除
<page-discussions>...</page-discussions> → 削除
```

### データソースタグ
```
<data-source url="collection://...">...</data-source> → 削除
```

### メンションタグ
```
<mention type="page" id="...">ページ名</mention>  → テキスト「ページ名」に置換
<mention type="user" id="...">ユーザー名</mention> → テキスト「ユーザー名」に置換
<mention type="date">日付</mention>                → テキスト「日付」に置換
```

### ディスカッションマーカー
```
<discussion id="...">テキスト</discussion> → テキストのみ残す
```

## 変換するNotion固有記法

### Callout
Notionのcalloutブロックは以下のような形式で返る場合がある：
```
> ℹ️ これは情報です
```
→ `<blockquote>` として保持する。アイコン部分はそのまま残す。

### トグル
トグルは展開済みの状態で返されることが多い。そのままテキストとして保持する。
見出しトグルの場合はそのまま見出し + 本文として扱う。

### 埋め込み
```
<embed url="https://...">...</embed>
```
→ リンクとして変換: `[埋め込みコンテンツ](url)`

### 数式
- インライン数式: `$...$` → そのまま保持（PDF上ではテキスト表示）
- ブロック数式: `$$...$$` → そのまま保持

### ファイル添付
```
<file url="https://...">ファイル名</file>
```
→ リンクとして変換: `[ファイル名](url)`

## 処理の順序

1. ページタイトルを `<h1>` 用に抽出
2. Notion固有HTMLタグを正規表現で処理
3. メンションをプレーンテキストに置換
4. 埋め込み・ファイルをリンクに変換
5. 残りは標準Markdownとしてそのまま保持
