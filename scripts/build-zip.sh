#!/bin/bash
# Claude Desktop にアップロードするための ZIP を作成する
# vendor/primer.css を同梱し、CDN 非対応環境でも動作するようにする
#
# 使い方: bash scripts/build-zip.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PARENT_DIR="$(cd "$PROJECT_DIR/.." && pwd)"
PROJECT_NAME="$(basename "$PROJECT_DIR")"
OUTPUT="$PARENT_DIR/$PROJECT_NAME.zip"

# vendor/primer.css が無ければ npm install して取得
if [ ! -f "$SCRIPT_DIR/vendor/primer.css" ]; then
  echo "Fetching primer.css..."
  npm install --prefix "$SCRIPT_DIR" @primer/css@21 --save=false
  mkdir -p "$SCRIPT_DIR/vendor"
  cp "$SCRIPT_DIR/node_modules/@primer/css/dist/primer.css" "$SCRIPT_DIR/vendor/primer.css"
fi

# 既存の ZIP があれば削除
rm -f "$OUTPUT"

# ZIP 作成（node_modules は除外、vendor/ は含める）
cd "$PARENT_DIR"
zip -r "$OUTPUT" "$PROJECT_NAME/" \
  -x "$PROJECT_NAME/.git/*" \
  -x "$PROJECT_NAME/.claude/*" \
  -x "$PROJECT_NAME/node_modules/*" \
  -x "$PROJECT_NAME/scripts/package-lock.json" \
  -x "$PROJECT_NAME/test-output/*" \
  -x "$PROJECT_NAME/samples/*"
  -x "$PROJECT_NAME/scripts/package-lock.json" \
  -x "$PROJECT_NAME/test-output/*"

echo ""
echo "Created: $OUTPUT"
ls -lh "$OUTPUT"
echo ""
echo "ZIP contents:"
zipinfo -1 "$OUTPUT"
