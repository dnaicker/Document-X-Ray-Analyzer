# Google Drive Sync Setup Guide

This guide will help you set up Google Drive synchronization for Grammar Highlighter.

## Why Google Drive Sync?

Google Drive sync allows you to:
- **Backup your notes and highlights** to the cloud
- **Access your data across multiple devices**
- **Share documents** with the app automatically

---

## Prerequisites

- A Google account (free)
- Access to Google Cloud Console

---

## Step 1: Create a Google Cloud Project

1. **Go to Google Cloud Console:**  
   👉 [https://console.cloud.google.com/](https://console.cloud.google.com/)

2. **Sign in** with your Google account

3. **Create a new project:**
   - Click the project dropdown at the top
   - Click **"New Project"**
   - Enter a name: `Grammar Highlighter` (or any name you prefer)
   - Click **"Create"**
   - Wait for the project to be created (takes ~30 seconds)

---

## Step 2: Enable Google Drive API

1. **In your new project**, go to **"APIs & Services"** → **"Library"**  
   Or visit: [https://console.cloud.google.com/apis/library](https://console.cloud.google.com/apis/library)

2. **Search for "Google Drive API"**

3. **Click on "Google Drive API"**

4. **Click "Enable"**

---

## Step 3: Configure OAuth Consent Screen

1. **Go to "APIs & Services"** → **"OAuth consent screen"**  
   Or visit: [https://console.cloud.google.com/apis/credentials/consent](https://console.cloud.google.com/apis/credentials/consent)

2. **Select "External"** (unless you have a Google Workspace account)

3. **Click "Create"**

4. **Fill in the required fields:**
   - **App name:** `Grammar Highlighter` (or your preferred name)
   - **User support email:** Your email address
   - **Developer contact information:** Your email address
   
5. **Click "Save and Continue"**

6. **Scopes screen:**
   - Click **"Add or Remove Scopes"**
   - Search and select these scopes:
     - `https://www.googleapis.com/auth/drive.file` (Create and access your own files)
     - `https://www.googleapis.com/auth/drive.appdata` (View and manage app data)
   - Click **"Update"**
   - Click **"Save and Continue"**

7. **Test users screen:**
   - Click **"Add Users"**
   - Add your Google email address (and any other users you want to allow)
   - Click **"Save and Continue"**

8. **Review and click "Back to Dashboard"**

---

## Step 4: Create OAuth Credentials

1. **Go to "APIs & Services"** → **"Credentials"**  
   Or visit: [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)

2. **Click "+ Create Credentials"** → **"OAuth client ID"**

3. **Select Application type:** `Desktop app`

4. **Name:** `Grammar Highlighter Desktop` (or any name)

5. **Click "Create"**

6. **A popup appears with your credentials:**
   - **Client ID:** `123456789-abcdefg.apps.googleusercontent.com`
   - **Client Secret:** `GOCSPX-abc123xyz`
   
7. **⚠️ IMPORTANT: Copy both values** - you'll need them in the next step!

8. **Click "OK"**

---

## Step 5: Configure Grammar Highlighter

### Option A: For Personal Use (Recommended for most users)

If you're building the app yourself:

1. **Open the project folder** in your code editor

2. **Find `config.js`** in the root directory

3. **Update it with your credentials:**
   ```javascript
   module.exports = {
       google: {
           clientId: 'YOUR_CLIENT_ID_HERE',
           clientSecret: 'YOUR_CLIENT_SECRET_HERE',
           redirectUri: 'http://localhost/callback'
       }
   };
   ```

4. **Replace:**
   - `YOUR_CLIENT_ID_HERE` with your Client ID
   - `YOUR_CLIENT_SECRET_HERE` with your Client Secret

5. **Save the file**

6. **Rebuild the app:**
   ```bash
   npm run build
   ```

---

### Option B: For Distribution (App developers)

If you're distributing the app to others:

**⚠️ Security Note:** You should **NOT** include your Google credentials in the distributed app for security reasons. Instead:

#### Method 1: User-provided credentials (Most Secure)
Have each user create their own Google Cloud project and credentials following Steps 1-4 above, then:

1. Add a **Settings page** in the app where users can paste their credentials
2. Store credentials securely using Electron's `safeStorage` API

#### Method 2: OAuth with your credentials (Easier for users)
If you want to provide credentials with your app:

1. **Keep credentials on a secure server** (never in the app code)
2. Implement a backend server that handles OAuth
3. Use environment variables or secure key storage
4. Consider using Google's verification process for trusted apps

---

## Step 6: Test the Connection

1. **Open Grammar Highlighter**

2. **Click "File"** → **"Sync with Drive"**

3. **Click "Connect Google Drive"**

4. **A browser window opens** - sign in with your Google account

5. **Grant permissions** to the app

6. **You should see "Connected to Google Drive"**

7. **Test uploading/downloading** to verify it works

---

## Troubleshooting

### Error: "Access blocked: This app's request is invalid"

**Solution:** Make sure you added your email as a test user in Step 3.7

### Error: "redirect_uri_mismatch"

**Solution:** The redirect URI must be exactly `http://localhost/callback` in both:
- Your Google Cloud Console OAuth settings
- Your `config.js` file

### Error: "invalid_client"

**Solution:** Double-check your Client ID and Client Secret are copied correctly.

### "App not verified" warning

This is normal for apps in testing mode. Click **"Advanced"** → **"Go to [App Name] (unsafe)"** to proceed.

To remove this warning:
1. Go through Google's app verification process (for public distribution)
2. Or use it in testing mode (for personal use)

---

## Security Best Practices

### ⚠️ For Developers:

1. **Never commit `config.js`** to Git (it's in `.gitignore` by default)
2. **Never share your Client Secret** publicly
3. **Rotate credentials** if they're accidentally exposed
4. **Use environment variables** for production builds
5. **Consider implementing server-side OAuth** for distributed apps

### For End Users:

1. Only enter credentials from **trusted sources**
2. Review the **permissions** the app requests
3. You can **revoke access** anytime at: [https://myaccount.google.com/permissions](https://myaccount.google.com/permissions)

---

## Alternative: Disable Google Drive Sync

If you don't want to use Google Drive sync:

The app works perfectly fine **without** Google Drive credentials! Simply:
- Don't click the "Sync with Drive" button
- All your data is stored locally on your computer
- You can still export notes manually

---

## Need Help?

- **Google Cloud Console Help:** [https://cloud.google.com/docs](https://cloud.google.com/docs)
- **OAuth Setup Guide:** [https://developers.google.com/identity/protocols/oauth2](https://developers.google.com/identity/protocols/oauth2)
- **Report Issues:** [https://github.com/dnaicker/Document-X-Ray-Analyzer/issues](https://github.com/dnaicker/Document-X-Ray-Analyzer/issues)

---

**Happy Syncing! ☁️**

