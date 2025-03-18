# GitHub Repository Setup

Follow these instructions to push the San Mateo County Housing Element Dashboard to GitHub.

## Prerequisites

- GitHub account
- Git installed on your system
- Repository code ready on your local machine

## Steps to Create and Push to GitHub

### 1. Create a New Repository on GitHub

1. Sign in to your GitHub account
2. Click the "+" icon in the top-right corner and select "New repository"
3. Enter repository details:
   - Repository name: `hcd-dashboard`
   - Description: `San Mateo County Housing Element Dashboard with AI-powered insights`
   - Choose Public or Private visibility
   - Do NOT initialize with README, .gitignore, or license (we'll push our existing files)
4. Click "Create repository"

### 2. Initialize Git in the Local Project (if not already done)

```bash
cd /path/to/hcd-dashboard
git init
```

### 3. Configure Git User Information (if not already configured)

```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### 4. Add the Remote Repository

```bash
git remote add origin https://github.com/yourusername/hcd-dashboard.git
```

### 5. Stage All Files for Commit

```bash
git add .
```

### 6. Create Initial Commit

```bash
git commit -m "Initial commit: San Mateo County Housing Dashboard with AI Assistant"
```

### 7. Push to GitHub

```bash
git push -u origin main
```

**Note**: If your default branch is named `master`, use that instead of `main`:

```bash
git push -u origin master
```

## Setting Up GitHub Secrets

To ensure the CI workflow can access your OpenAI API key:

1. Go to your repository on GitHub
2. Click on "Settings" > "Secrets and variables" > "Actions"
3. Click "New repository secret"
4. Add the following secret:
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key
5. Click "Add secret"

## Additional Configuration

### Setting Up GitHub Pages (Optional)

To deploy the dashboard to GitHub Pages:

1. Go to repository "Settings" > "Pages"
2. Under "Source", select "GitHub Actions"
3. Choose the workflow that builds and deploys to GitHub Pages
4. Click "Save"

### Setting Up Branch Protection (Recommended)

1. Go to repository "Settings" > "Branches"
2. Click "Add rule" under "Branch protection rules"
3. Enter your main branch name (usually "main")
4. Configure settings:
   - Require pull request reviews before merging
   - Require status checks to pass before merging
   - Include administrators
5. Click "Create"

## Collaborating with Others

### Adding Collaborators

1. Go to repository "Settings" > "Collaborators and teams"
2. Click "Add people" or "Add teams"
3. Enter the GitHub username/team name
4. Select the appropriate permission level
5. Click "Add"

### Working with Branches

```bash
# Create a new feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature: description"

# Push branch to remote
git push -u origin feature/new-feature

# Create pull request on GitHub
# (Click "Compare & pull request" button on your GitHub repository)
```

## Keeping Your Repository Updated

```bash
# Pull latest changes from remote
git pull origin main

# Pull and rebase
git pull --rebase origin main
```

## Final Steps

After pushing your repository to GitHub:

1. Review your repository on GitHub to ensure all files are properly uploaded
2. Check the "Actions" tab to verify that workflows are running correctly
3. Update the README.md with the actual repository URL
4. Customize the repository details as needed 