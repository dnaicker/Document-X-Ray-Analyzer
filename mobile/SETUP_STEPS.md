# Setup Steps (After Fixing Dependencies)

You've successfully installed the dependencies! Now follow these steps:

## Step 2: Copy Source Files

From the `mobile` directory, run:

```bash
npm run copy:src
npm run copy:assets
```

Or manually:
```bash
# Copy source files
cp -r ../src/* ./www/
cp -r ../lib ./www/

# Copy assets
cp -r ../assets ./www/
```

On Windows (if cp doesn't work), use:
```bash
xcopy /E /I /Y ..\src www
xcopy /E /I /Y ..\lib www\lib
xcopy /E /I /Y ..\assets www\assets
```

Or just run:
```bash
npm run dev
```

This copies:
- `../src/` → `./www/`
- `../lib/` → `./www/lib/`
- `../assets/` → `./www/assets/`

## Step 3: Add Android Platform

```bash
npx cap add android
```

This creates the `android/` directory with your native Android project.

## Step 4: Open in Android Studio

```bash
npx cap open android
```

Or manually open the `android` folder in Android Studio.

## Step 5: Run the App

1. In Android Studio, wait for Gradle sync to complete
2. Select an emulator or connect a physical device
3. Click the green "Run" button (▶️)

## Troubleshooting

### If `npm run` commands don't work:

**Option 1: Manual copy (Windows)**
```batch
mkdir www 2>nul
xcopy /E /I /Y ..\src www
xcopy /E /I /Y ..\lib www\lib
xcopy /E /I /Y ..\assets www\assets
copy src\mobile-index.html www\index.html
copy src\mobile-styles.css www\mobile-styles.css
copy src\mobile-navigation.js www\mobile-navigation.js
copy src\capacitor-bridge.js www\capacitor-bridge.js
```

**Option 2: Use PowerShell**
```powershell
New-Item -ItemType Directory -Force -Path www
Copy-Item -Path ..\src\* -Destination www -Recurse -Force
Copy-Item -Path ..\lib -Destination www -Recurse -Force
Copy-Item -Path ..\assets -Destination www -Recurse -Force
Copy-Item -Path src\* -Destination www -Force
```

### If you get "www directory not found" error:

Create it first:
```bash
mkdir www
```

Then copy files again.

## What's Next?

Once you've completed these steps, your mobile app should run on Android!

See `README.md` for detailed documentation.

