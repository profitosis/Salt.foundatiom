#!/bin/bash

# Default values
TITLE="Update: $(date +'%Y-%m-%d %H:%M')"
BODY=""
TARGET_BRANCH="main"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--title)
            TITLE="$2"
            shift 2
            ;;
        -b|--body)
            BODY="$2"
            shift 2
            ;;
        --target-branch)
            TARGET_BRANCH="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Create or update a GitHub pull request"
            echo ""
            echo "Options:"
            echo "  -t, --title TITLE        PR title (default: 'Update: YYYY-MM-DD HH:MM')"
            echo "  -b, --body BODY          PR description (wrap in quotes)"
            echo "  --target-branch BRANCH   Target branch (default: main)"
            echo "  -h, --help               Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# If no body provided, use a default template
if [ -z "$BODY" ]; then
    BODY="## Changes\n\n- [ ] Updated SaltMorph contracts\n- [ ] Updated deployment scripts\n- [ ] Tested locally\n\n## Testing Instructions\n\n1. Deploy contracts\n2. Run tests\n3. Verify frontend integration\n\n## Notes\n\n* Any additional notes here"
fi

echo "🚀 Creating/Updating PR..."
echo "📝 Title: $TITLE"
echo "🌳 From: $CURRENT_BRANCH → $TARGET_BRANCH"

# Check if PR already exists
PR_EXISTS=$(gh pr view --json number 2>/dev/null || echo "")

if [ -n "$PR_EXISTS" ]; then
    echo "📝 Updating existing PR..."
    gh pr edit --title "$TITLE" --body "$BODY"
else
    echo "✨ Creating new PR..."
    gh pr create \
        --base "$TARGET_BRANCH" \
        --head "$CURRENT_BRANCH" \
        --title "$TITLE" \
        --body "$BODY"
fi

# Open PR in browser
gh pr view --web
