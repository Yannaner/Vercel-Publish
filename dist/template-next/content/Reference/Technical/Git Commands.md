# Git Commands Reference

Essential Git commands for daily development work.

## Basic Commands

### Repository Setup
```bash
# Initialize a new repository
git init

# Clone an existing repository
git clone <url>
```

### Making Changes
```bash
# Check status
git status

# Stage files
git add <file>
git add .

# Commit changes
git commit -m "Your message"

# Push to remote
git push origin main
```

## Branching

```bash
# Create a new branch
git branch <branch-name>

# Switch to a branch
git checkout <branch-name>

# Create and switch in one command
git checkout -b <branch-name>

# List all branches
git branch -a

# Delete a branch
git branch -d <branch-name>
```

## Undoing Changes

```bash
# Discard local changes
git checkout -- <file>

# Unstage a file
git reset HEAD <file>

# Revert a commit
git revert <commit-hash>

# Reset to a previous commit (dangerous!)
git reset --hard <commit-hash>
```

## Working with Remotes

```bash
# View remotes
git remote -v

# Add a remote
git remote add <name> <url>

# Fetch from remote
git fetch origin

# Pull changes
git pull origin main

# Push to remote
git push origin <branch-name>
```

## Advanced

### Stashing
```bash
# Stash changes
git stash

# List stashes
git stash list

# Apply stash
git stash apply

# Drop stash
git stash drop
```

### Rebasing
```bash
# Rebase onto another branch
git rebase <branch-name>

# Interactive rebase
git rebase -i HEAD~3
```

## Tips

- Commit often with meaningful messages
- Pull before you push
- Use branches for features
- Don't commit secrets or sensitive data
- Review changes before committing: `git diff`
