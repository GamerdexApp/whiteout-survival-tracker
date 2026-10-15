#!/bin/bash
# Copies the image folders the app uses from whiteout-survival-data into public/images.
# The package holds 150 MB of images. Add a folder name to FOLDERS when a page needs it.
# Image paths in the package data start with /images/, so the folder names stay the same.

set -e

PACKAGE_DIR="node_modules/whiteout-survival-data/images"
TARGET_DIR="public/images"
FOLDERS=(buildings facilities items research heroes hero-gear)

rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR"

for folder in "${FOLDERS[@]}"; do
  cp -r "$PACKAGE_DIR/$folder" "$TARGET_DIR/$folder"
done

echo "Copied ${FOLDERS[*]} from whiteout-survival-data to $TARGET_DIR"
