#!/bin/bash

# Check if commit message is provided
if [ $# -eq 0 ]; then
    echo "❌ Error: Please provide a commit message"
    echo "Usage: ./push_changes.sh \"Your commit message\""
    exit 1
fi

echo "🔄 Staging changes..."
git add .

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "⚠️ No changes to commit!"
    exit 0
fi

echo "💾 Committing changes with message: $1"
git commit -m "$1"

# Get current branch name
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "🚀 Pushing to $CURRENT_BRANCH..."
git push origin $CURRENT_BRANCH

echo "✅ Done! Changes pushed to your GitHub fork."
echo "🔗 Visit: https://github.com/renesandoval/Salt.foundatiom/tree/$CURRENT_BRANCH"
