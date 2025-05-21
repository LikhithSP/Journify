# Deployment script for Journify performance improvements

# Function to check if file exists
function checkFile() {
    if [[ ! -f $1 ]]; then
        echo "❌ Error: File $1 not found!"
        exit 1
    fi
}

echo "🚀 Starting deployment of Journify performance improvements..."

# Check required files
checkFile src/hooks/useOfflineSync.fixed.ts
checkFile src/pages/EntryPage.tsx
checkFile src/pages/Dashboard.tsx

# Backup original files
echo "📦 Creating backups of original files..."
cp src/hooks/useOfflineSync.ts src/hooks/useOfflineSync.ts.bak
echo "✅ Backup created: src/hooks/useOfflineSync.ts.bak"

# Deploy the optimized version
echo "⚡ Deploying optimized implementation..."
cp src/hooks/useOfflineSync.fixed.ts src/hooks/useOfflineSync.ts
echo "✅ Deployed: src/hooks/useOfflineSync.ts updated"

# Update all imports to use the standard path
echo "🔄 Updating import references..."
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/useOfflineSync.fixed/useOfflineSync/g'
echo "✅ Updated import references"

echo "🧪 Running tests..."
npm test

echo "✨ Performance improvement deployment complete!"
echo "   - Individual entry caching implemented"
echo "   - Single entry fetching optimized"
echo "   - Faster journal entry viewing"
