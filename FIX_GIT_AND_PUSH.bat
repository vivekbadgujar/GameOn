@echo off
echo ========================================
echo GIT DIAGNOSIS AND FIX SCRIPT
echo ========================================
echo.

echo === STEP 1: Current Local State ===
git status --porcelain
echo.
git branch --show-current
echo.
git rev-parse --abbrev-ref HEAD
echo.
git log --oneline -n 5
echo.
git log --format="%%H %%an %%ad %%s" -n 3
echo.

echo === STEP 2: Remote Config ===
git remote -v
echo.

echo === STEP 3: File Check ===
if exist "admin-panel\src\index.css" (
    echo File exists: YES
) else (
    echo File exists: NO
)
echo.
git ls-files -- admin-panel/src/index.css
echo.
git check-ignore -v admin-panel/src/index.css
echo.

echo === STEP 4: Local vs Remote ===
git fetch origin --prune
echo.
git rev-parse HEAD
echo.
git rev-parse origin/master 2>&1
echo.
git log --oneline origin/master..HEAD 2>&1
echo.
git log --oneline HEAD..origin/master 2>&1
echo.

echo === STEP 5: Staging and Committing ===
git add admin-panel/src/index.css
echo.
git status --short
echo.

git status --porcelain | findstr "admin-panel/src/index.css" >nul
if %errorlevel% == 0 (
    echo Committing changes...
    git commit -m "fix(admin): add missing index.css, ensure file tracked"
    echo.
    echo New commit SHA:
    git rev-parse HEAD
    echo.
) else (
    echo No changes to commit (file may already be committed)
    echo.
)

echo === STEP 6: Pushing to Remote ===
git checkout -b fix/admin-css-final 2>&1
echo.
git push origin fix/admin-css-final 2>&1
echo.

echo === STEP 7: Verification ===
git fetch origin
echo.
echo Checking if file exists on remote:
git ls-tree --name-only origin/fix/admin-css-final | findstr "admin-panel/src/index.css"
echo.
echo Remote commit SHA:
git rev-parse origin/fix/admin-css-final 2>&1
echo.

echo === COMPLETE ===
echo.
echo If push was successful, you can:
echo 1. Merge the branch: git checkout master && git merge fix/admin-css-final
echo 2. Push to master: git push origin master
echo 3. Or create a PR from fix/admin-css-final to master on GitHub
echo.
pause
