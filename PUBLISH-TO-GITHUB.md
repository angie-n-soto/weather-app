# Publish Chibi Weather to GitHub

Your repo is ready and empty: https://github.com/angie-n-soto/weather-app

## 1. Open the terminal in VS Code
1. In VS Code, choose **File → Open Folder** and pick `Documents\weather-app`.
2. Open the terminal with **Terminal → New Terminal**.

## 2. Tell Git who you are (only the first time)
```bash
git config --global user.name "Angie Soto"
git config --global user.email "you@example.com"
```
Use the email address on your GitHub account.

## 3. Save your first version and push it
Run these one at a time:
```bash
git init
git add .
git commit -m "First version of Chibi Weather"
git branch -M main
git remote add origin https://github.com/angie-n-soto/weather-app.git
git push -u origin main
```
A browser window may ask you to sign in to GitHub. Approve it, and the push will finish.

**What each line does:**
- `git init` turns the folder into a Git project.
- `git add .` picks every file to save.
- `git commit` saves a snapshot with a message.
- `git branch -M main` names your main branch `main`.
- `git remote add` links the folder to your GitHub repo.
- `git push` uploads it.

Refresh your repo page and you'll see your files with the README shown underneath.

## 4. Turn on GitHub Pages (your live link)
1. On the repo page, go to **Settings → Pages**.
2. Under **Source**, choose **Deploy from a branch**.
3. Pick **main** and **/(root)**, then click **Save**.
4. Wait a minute or two, then open https://angie-n-soto.github.io/weather-app/

The live site uses real weather for wherever you are.

## 5. Every change after this
```bash
git add .
git commit -m "Describe what you changed"
git push
```
Small commits with clear messages show your progress, which is great project-management evidence. The live site updates a minute after each push.
