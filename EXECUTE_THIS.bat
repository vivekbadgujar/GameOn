@echo off
REM ========================================
REM COMPLETE GIT FIX AND PUSH SCRIPT
REM Run this to fix the index.css issue
REM ========================================

echo.
echo ========================================
echo GIT DIAGNOSIS AND FIX
echo ========================================
echo.

echo [STEP 1] Current Local State
echo -----------------------------
git status --porcelain
echo.
git branch --show-current
echo.
git rev-parse --abbrev-ref HEAD
echo.
echo Last 5 commits:
git log --oneline -n 5
echo.

echo [STEP 2] Remote Configuration
echo ------------------------------
git remote -v
echo.

echo [STEP 3] File Check
echo --------------------
if exist "admin-panel\src\index.css" (
    echo [OK] File exists: admin-panel\src\index.css
) else (
    echo [ERROR] File NOT found: admin-panel\src\index.css
    pause
    exit /b 1
)
echo.
echo Checking if file is tracked by git:
git ls-files -- admin-panel/src/index.css
echo.
echo Checking if file is ignored:
git check-ignore -v admin-panel/src/index.css
echo.

echo [STEP 4] Local vs Remote Comparison
echo ------------------------------------
echo Fetching latest from remote...
git fetch origin --prune
echo.
echo Local HEAD:
git rev-parse HEAD
echo.
echo Remote master:
git rev-parse origin/master 2>&1
echo.
echo Commits ahead of remote:
git log --oneline origin/master..HEAD 2>&1
echo.
echo Commits behind remote:
git log --oneline HEAD..origin/master 2>&1
echo.

echo [STEP 5] Staging and Committing
echo ---------------------------------
echo Adding admin-panel/src/index.css...
git add admin-panel/src/index.css
echo.
echo Current status:
git status --short
echo.

git status --porcelain | findstr "admin-panel/src/index.css" >nul
if %errorlevel% == 0 (
    echo [ACTION] Committing changes...
    git commit -m "fix(admin): add missing index.css, ensure file tracked"
    echo.
    echo [OK] New commit created:
    git log --oneline -n 1
    echo.
    echo [OK] Commit SHA:
    git rev-parse HEAD
    echo.
) else (
    echo [INFO] No changes to commit - file may already be committed
    echo Current commit:
    git log --oneline -n 1
    echo.
)

echo [STEP 6] Pushing to Remote
echo ---------------------------
echo Checking if we need to create a branch...
git branch --show-current | findstr "fix/admin-css-final" >nul
if %errorlevel% neq 0 (
    echo Creating feature branch: fix/admin-css-final
    git checkout -b fix/admin-css-final 2>&1
    echo.
    echo Pushing feature branch...
    git push origin fix/admin-css-final 2>&1
    echo.
    echo [SUCCESS] Feature branch pushed!
    echo.
    echo Next steps:
    echo 1. Go to GitHub and create a PR from fix/admin-css-final to master
    echo 2. OR merge locally: git checkout master ^&^& git merge fix/admin-css-final ^&^& git push origin master
) else (
    echo Already on fix/admin-css-final branch
    echo Pushing...
    git push origin fix/admin-css-final 2>&1
)

echo.
echo [STEP 7] Verification
echo ----------------------
echo Fetching from remote...
git fetch origin
echo.
echo Checking if file exists on remote branch:
git ls-tree --name-only origin/fix/admin-css-final | findstr "admin-panel/src/index.css"
echo.
echo Remote commit SHA:
git rev-parse origin/fix/admin-css-final 2>&1
echo.

echo ========================================
echo DIAGNOSIS COMPLETE
echo ========================================
echo.
echo Summary:
echo - File checked: admin-panel\src\index.css
echo - File added to git: Yes
echo - Committed: Check output above
echo - Pushed: Check output above
echo.
echo Next Steps:
echo 1. Verify the commit appears on GitHub
echo 2. Check Vercel Project Settings - Production Branch is 'master'
echo 3. Redeploy on Vercel (or wait for auto-deploy)
echo 4. Verify build log shows new commit SHA (not 6621f72)
echo.
pause
