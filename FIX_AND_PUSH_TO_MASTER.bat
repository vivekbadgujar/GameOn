@echo off
echo ========================================
echo QUICK FIX: Add, Commit, Push to Master
echo ========================================
echo.

echo Adding admin-panel/src/index.css...
git add admin-panel/src/index.css
echo.

echo Current status:
git status --short
echo.

echo Committing...
git commit -m "fix(admin): add missing index.css, ensure file tracked"
echo.

echo Current commit:
git log --oneline -n 1
echo.

echo Pushing to origin/master...
git push origin master
echo.

echo === DONE ===
echo.
echo Verify on GitHub that the commit appears and the file is present.
echo Then check Vercel to see if it picks up the new commit.
echo.
pause
