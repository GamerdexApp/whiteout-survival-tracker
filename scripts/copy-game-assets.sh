#!/bin/bash
# Copies the image folders the app uses from whiteout-survival-data into public/images.
# The package holds 150 MB of images. Add a folder name to FOLDERS when a page needs it.
# Image paths in the package data start with /images/, so the folder names stay the same.

set -e

PACKAGE_DIR="node_modules/whiteout-survival-data/images"
TARGET_DIR="public/images"
FOLDERS=(buildings facilities items)

rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR"

for folder in "${FOLDERS[@]}"; do
  cp -r "$PACKAGE_DIR/$folder" "$TARGET_DIR/$folder"
done

# Hero shards are items, so the Resources page needs their icons before the Heroes page copies the
# whole folder.
(cd "$PACKAGE_DIR" && find heroes -name '*-Shard.png') | while read -r file; do
  mkdir -p "$TARGET_DIR/$(dirname "$file")"
  cp "$PACKAGE_DIR/$file" "$TARGET_DIR/$file"
done

echo "Copied ${FOLDERS[*]} from whiteout-survival-data to $TARGET_DIR"
