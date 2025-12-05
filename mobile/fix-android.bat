@echo off
echo ===================================
echo Fixing Android Project
echo ===================================
echo.

echo Step 1: Removing incomplete android folder...
if exist android (
    rmdir /s /q android
    echo Android folder removed.
) else (
    echo No android folder found (already clean).
)
echo.

echo Step 2: Re-creating Android project...
call npx cap add android
echo.

echo Step 3: Syncing web assets...
call npx cap sync
echo.

echo ===================================
echo Done! Now open in Android Studio:
echo    npx cap open android
echo ===================================
pause

