# Bulk sync Amazon products across multiple fashion categories
# Uses Rainforest API to fetch products from Amazon with affiliate links
# Processes multiple categories in parallel or sequentially

param(
    [int]$ProductsPerCategory = 200,
    [int]$MinQualityScore = 5,
    [string[]]$Categories = @('all'),
    [switch]$Sequential = $false
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodeScript = Join-Path $scriptDir "sync-amazon-products.mjs"

# Available categories
$availableCategories = @{
    'all' = 'All women''s fashion'
    'dresses' = 'Women''s Dresses'
    'tops' = 'Women''s Tops, Tees & Blouses'
    'pants' = 'Women''s Pants'
    'shoes' = 'Women''s Shoes'
    'jewelry' = 'Women''s Jewelry'
    'handbags' = 'Women''s Handbags & Wallets'
    'activewear' = 'Women''s Active Wear'
    'swimwear' = 'Women''s Swimwear'
    'outerwear' = 'Women''s Coats, Jackets & Vests'
}

Write-Host ""
Write-Host "═" * 70 -ForegroundColor Cyan
Write-Host "BULK SYNC: Amazon Fashion Products" -ForegroundColor Cyan
Write-Host "═" * 70 -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Products per category: $ProductsPerCategory" -ForegroundColor White
Write-Host "  Minimum quality score: $MinQualityScore (0-7)" -ForegroundColor White
Write-Host "  Categories: $($Categories -join ', ')" -ForegroundColor White
Write-Host "  Mode: $(if ($Sequential) { 'Sequential' } else { 'Default' })" -ForegroundColor White
Write-Host ""

# Display selected categories
Write-Host "Categories to sync:" -ForegroundColor Yellow
foreach ($cat in $Categories) {
    if ($availableCategories.ContainsKey($cat)) {
        Write-Host "  - $cat`: $($availableCategories[$cat])" -ForegroundColor Gray
    } else {
        Write-Host "  - $cat`: (custom keyword)" -ForegroundColor Gray
    }
}
Write-Host ""

# Check if node script exists
if (-not (Test-Path $nodeScript)) {
    Write-Host "ERROR: Node script not found at $nodeScript" -ForegroundColor Red
    exit 1
}

# Check for .env.local
$envFile = Join-Path (Split-Path -Parent $scriptDir) ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "WARNING: .env.local not found at $envFile" -ForegroundColor Yellow
    Write-Host "Make sure environment variables are set for:" -ForegroundColor Yellow
    Write-Host "  - RAINFOREST_API_KEY" -ForegroundColor Gray
    Write-Host "  - NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor Gray
    Write-Host "  - SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Gray
    Write-Host "  - AMAZON_ASSOCIATE_ID (optional)" -ForegroundColor Gray
    Write-Host ""
}

$proceed = Read-Host "Continue? (y/n)"
if ($proceed -ne "y") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "Starting bulk sync..." -ForegroundColor Green
Write-Host ""

$totalSynced = 0
$totalErrors = 0
$totalSkipped = 0
$results = @()

foreach ($category in $Categories) {
    $categoryName = if ($availableCategories.ContainsKey($category)) {
        $availableCategories[$category]
    } else {
        $category
    }

    Write-Host "═" * 70 -ForegroundColor DarkCyan
    Write-Host "Syncing category: $categoryName" -ForegroundColor Yellow
    Write-Host "═" * 70 -ForegroundColor DarkCyan
    Write-Host ""

    $startTime = Get-Date

    try {
        # Run the node script
        $output = & node $nodeScript $ProductsPerCategory $category 2>&1
        $exitCode = $LASTEXITCODE

        # Display the output
        $output | ForEach-Object { Write-Host $_ }

        # Parse the summary from output (look for plain text patterns to avoid emoji encoding issues)
        $syncedMatch = $output | Select-String "Synced:\s*(\d+)"
        $errorsMatch = $output | Select-String "Errors:\s*(\d+)"
        $skippedMatch = $output | Select-String "Skipped:\s*(\d+)"

        $synced = if ($syncedMatch) {
            # Get the last match (from the summary section)
            $matches = $syncedMatch | Select-Object -Last 1
            if ($matches.Matches.Count -gt 0) {
                [int]$matches.Matches[0].Groups[1].Value
            } else { 0 }
        } else { 0 }

        $errors = if ($errorsMatch) {
            $matches = $errorsMatch | Select-Object -Last 1
            if ($matches.Matches.Count -gt 0) {
                [int]$matches.Matches[0].Groups[1].Value
            } else { 0 }
        } else { 0 }

        $skipped = if ($skippedMatch) {
            $matches = $skippedMatch | Select-Object -Last 1
            if ($matches.Matches.Count -gt 0) {
                [int]$matches.Matches[0].Groups[1].Value
            } else { 0 }
        } else { 0 }

        $duration = ((Get-Date) - $startTime).TotalSeconds

        $totalSynced += $synced
        $totalErrors += $errors
        $totalSkipped += $skipped

        $results += @{
            category = $categoryName
            synced = $synced
            errors = $errors
            skipped = $skipped
            duration = $duration
            exitCode = $exitCode
        }

        Write-Host ""
        if ($exitCode -eq 0) {
            Write-Host "✅ Category complete: $synced products synced in $([math]::Round($duration, 1))s" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Category complete with errors: $synced synced, $errors errors in $([math]::Round($duration, 1))s" -ForegroundColor Yellow
        }

    } catch {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $totalErrors++

        $results += @{
            category = $categoryName
            synced = 0
            errors = 1
            skipped = 0
            duration = 0
            exitCode = 1
        }
    }

    Write-Host ""

    # Rate limiting between categories
    if ($category -ne $Categories[-1]) {
        Write-Host "Waiting 3 seconds before next category..." -ForegroundColor Gray
        Start-Sleep -Seconds 3
        Write-Host ""
    }
}

Write-Host ""
Write-Host "═" * 70 -ForegroundColor Cyan
Write-Host "BULK SYNC COMPLETE" -ForegroundColor Cyan
Write-Host "═" * 70 -ForegroundColor Cyan
Write-Host ""

Write-Host "Summary by Category:" -ForegroundColor Yellow
Write-Host ""
foreach ($result in $results) {
    $statusColor = if ($result.exitCode -eq 0) { "Green" } else { "Yellow" }
    Write-Host "  $($result.category):" -ForegroundColor White
    Write-Host "    Synced: $($result.synced) | Skipped: $($result.skipped) | Errors: $($result.errors)" -ForegroundColor $statusColor
    Write-Host "    Duration: $([math]::Round($result.duration, 1))s" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "═" * 70 -ForegroundColor Cyan
Write-Host "Overall Totals:" -ForegroundColor Yellow
Write-Host "  Total synced: $totalSynced products" -ForegroundColor Green
Write-Host "  Total skipped: $totalSkipped products" -ForegroundColor Gray
Write-Host "  Total errors: $totalErrors" -ForegroundColor $(if ($totalErrors -gt 0) { "Red" } else { "Green" })
Write-Host "═" * 70 -ForegroundColor Cyan
Write-Host ""

if ($totalSynced -gt 0) {
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Generate vision embeddings for new products" -ForegroundColor White
    Write-Host "     Use: node scripts/generate-vision-embeddings.mjs" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Test search quality with Amazon products" -ForegroundColor White
    Write-Host "     Use: node scripts/test-search-quality.mjs" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Verify affiliate links are working" -ForegroundColor White
    Write-Host "     Check that product URLs contain your Amazon Associate ID" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "Amazon sync complete! 🎉" -ForegroundColor Green
Write-Host ""
