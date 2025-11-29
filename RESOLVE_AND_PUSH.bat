@echo off
REM ========================================
REM Resolve Git Push Conflict and Push
REM ========================================

echo.
echo ========================================
echo RESOLVING GIT PUSH CONFLICT
echo ========================================
echo.

echo [STEP 1] Fetching latest from remote...
git fetch origin
echo.

echo [STEP 2] Checking differences...
echo.
echo Commits on remote that you don't have:
git log --oneline HEAD..origin/master
echo.
echo Commits you have that remote doesn't:
git log --oneline origin/master..HEAD
echo.

echo [STEP 3] Pulling remote changes...
echo.
git pull origin master --no-edit
echo.

if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Merge conflicts detected!
    echo.
    echo You need to resolve conflicts manually:
    echo 1. Check which files have conflicts: git status
    echo 2. Open conflicted files and resolve conflicts
    echo 3. Stage resolved files: git add .
    echo 4. Complete merge: git commit
    echo 5. Then push: git push origin master
    echo.
    pause
    exit /b 1
)

echo.
echo [STEP 4] Checking status after pull...
git status
echo.

echo [STEP 5] Pushing to remote...
git push origin master
echo.

if %errorlevel% == 0 (
    echo.
    echo [SUCCESS] Push completed successfully!
    echo.
    echo Your fixes are now on GitHub and Vercel should auto-deploy.
) else (
    echo.
    echo [ERROR] Push failed. Check the error message above.
    echo.
    echo If you're sure your local changes are correct and want to overwrite remote:
    echo git push origin master --force-with-lease
    echo.
    echo WARNING: Force push will overwrite remote changes. Use with caution!
)

echo.
pause
