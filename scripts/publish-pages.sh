#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
node --test textbook/tests/*.test.*

if [[ -n "$(git status --porcelain -- textbook)" ]]; then
  echo '教材の変更をコミットしてから公開してください。' >&2
  exit 1
fi

publish_dir="$(mktemp -d)"
trap 'rm -rf "$publish_dir"' EXIT
remote_url="$(git remote get-url origin)"
source_commit="$(git rev-parse --short HEAD)"

git init -b gh-pages "$publish_dir"
git -C "$publish_dir" remote add origin "$remote_url"
if [[ -n "$(git ls-remote --heads origin gh-pages)" ]]; then
  git -C "$publish_dir" fetch --depth=1 origin gh-pages
  git -C "$publish_dir" checkout -B gh-pages FETCH_HEAD
fi

rsync -a --delete --exclude='.git/' --exclude='tests/' textbook/ "$publish_dir/"
touch "$publish_dir/.nojekyll"
git -C "$publish_dir" add --all
if git -C "$publish_dir" diff --cached --quiet; then
  echo '公開する変更はありません。'
  exit 0
fi
git -C "$publish_dir" commit -m "教科書を公開（元のコミット: ${source_commit}）"
git -C "$publish_dir" push origin gh-pages
