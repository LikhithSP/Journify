@echo off
REM Deployment script for Journify performance improvements on Windows

echo 🚀 Starting deployment of Journify performance improvements...

REM Check required files
if not exist src\hooks\useOfflineSync.fixed.ts (
    echo ❌ Error: File src\hooks\useOfflineSync.fixed.ts not found!
    exit /b 1
)
if not exist src\pages\EntryPage.tsx (
    echo ❌ Error: File src\pages\EntryPage.tsx not found!
    exit /b 1
)
if not exist src\pages\Dashboard.tsx (
    echo ❌ Error: File src\pages\Dashboard.tsx not found!
    exit /b 1
)

REM Backup original files
echo 📦 Creating backups of original files...
copy src\hooks\useOfflineSync.ts src\hooks\useOfflineSync.ts.bak
echo ✅ Backup created: src\hooks\useOfflineSync.ts.bak

REM Deploy the optimized version
echo ⚡ Deploying optimized implementation...
copy src\hooks\useOfflineSync.fixed.ts src\hooks\useOfflineSync.ts
echo ✅ Deployed: src\hooks\useOfflineSync.ts updated

echo 🔄 Updating import references (this may take a moment)...
powershell -Command "Get-ChildItem -Path src -Recurse -Include *.tsx,*.ts | Select-String -Pattern 'useOfflineSync.fixed' -List | ForEach-Object { $content = Get-Content $_.Path -Raw; $content = $content -replace 'useOfflineSync.fixed', 'useOfflineSync'; Set-Content -Path $_.Path -Value $content }"
echo ✅ Updated import references

echo 🧪 Running tests...
call npm test

echo ✨ Performance improvement deployment complete!
echo    - Individual entry caching implemented
echo    - Single entry fetching optimized
echo    - Faster journal entry viewing
