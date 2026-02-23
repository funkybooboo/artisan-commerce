#!/bin/bash
set -e

echo "🔄 Renaming Bluebells & Thistles to Artisan Commerce..."
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to replace in file
replace_in_file() {
    local file=$1
    local old=$2
    local new=$3
    
    if [ -f "$file" ]; then
        sed -i "s|$old|$new|g" "$file"
    fi
}

# Function to replace in all files
replace_in_all() {
    local old=$1
    local new=$2
    
    echo -e "${BLUE}Replacing '$old' with '$new'...${NC}"
    
    # Find all relevant files (excluding node_modules, .git, dist, .next, etc.)
    find . -type f \( \
        -name "*.md" -o \
        -name "*.json" -o \
        -name "*.ts" -o \
        -name "*.tsx" -o \
        -name "*.js" -o \
        -name "*.jsx" -o \
        -name "*.toml" -o \
        -name "*.yaml" -o \
        -name "*.yml" -o \
        -name "*.txt" -o \
        -name ".env.example" \
    \) \
    ! -path "*/node_modules/*" \
    ! -path "*/.git/*" \
    ! -path "*/dist/*" \
    ! -path "*/.next/*" \
    ! -path "*/.wrangler/*" \
    -exec sed -i "s|$old|$new|g" {} +
}

echo "Step 1: Replacing package names..."
replace_in_all "@bluebellsandthistles/" "@artisan-commerce/"
replace_in_all "bluebellsandthistles" "artisan-commerce"

echo ""
echo "Step 2: Replacing brand names..."
replace_in_all "Bluebells & Thistles" "Artisan Commerce"
replace_in_all "Bluebells and Thistles" "Artisan Commerce"

echo ""
echo "Step 3: Replacing domain references..."
replace_in_all "bluebellsandthistles.com" "artisan-commerce.example.com"

echo ""
echo "Step 4: Replacing repository references..."
replace_in_all "funkybooboo/bluebellsandthistles" "funkybooboo/artisan-commerce"

echo ""
echo "Step 5: Updating descriptions..."
replace_in_all "made-to-order artisan crafts marketplace" "open-source platform for artisan e-commerce with queue-based capacity management"
replace_in_all "craft marketplace" "artisan e-commerce platform"

echo ""
echo "Step 6: Updating specific references..."
# Update tenant IDs
replace_in_all "tenant_bluebells" "tenant_default"

# Update example emails
replace_in_all "noreply@bluebellsandthistles.com" "noreply@artisan-commerce.example.com"
replace_in_all "@bluebellsandthistles.com" "@artisan-commerce.example.com"

echo ""
echo -e "${GREEN}✅ Rename complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Review changes: git diff"
echo "2. Test that everything still works"
echo "3. Commit changes: git add -A && git commit -m 'refactor: rename to Artisan Commerce'"
echo "4. Update GitHub repository name in settings"
echo ""
