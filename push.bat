REM Run from Claude Code with: ! .\push.bat
REM You need to be in the correct folder
@echo off
cd "C:\ClaudeCode\staff-task-app"
git add .
git commit -m "Deploy update"
git push
pause
