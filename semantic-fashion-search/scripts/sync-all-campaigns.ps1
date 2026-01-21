# Sync all high-quality and DHgate campaigns with embeddings
# This will sync ~166 products from high-quality campaigns + ~400 from DHgate

$adminSecret = "3a2c5e9d9f4b27a8c1f0e2b6d7a934e1"
$baseUrl = "http://localhost:3000/api/admin/sync-products"

# High-quality campaigns (75% quality score)
$highQualityCampaigns = @{
    "11817" = "Angles90 - Fitness Equipment"
    "11923" = "LUX Sports - Athletic Gear"
    "16350" = "Cloudfield - Sunglasses"
    "16376" = "Asebbo - Eco Bags (Part 1)"
    "16377" = "Asebbo - Eco Bags (Part 2)"
    "16378" = "Asebbo - Eco Bags (Part 3)"
}

# Medium-quality DHgate campaigns (will use title as description fallback)
$dhgateCampaigns = @{
    "7183" = "DHgate Fashion 1"
    "7184" = "DHgate Fashion 2"
    "7186" = "DHgate Fashion 3"
    "7187" = "DHgate Fashion 4"
}

$totalSynced = 0
$totalErrors = 0
$totalEmbeddings = 0

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  COMPREHENSIVE CAMPAIGN SYNC" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "HIGH-QUALITY CAMPAIGNS: 6 campaigns" -ForegroundColor Green
Write-Host "DHGATE CAMPAIGNS: 4 campaigns (with title fallback)" -ForegroundColor Yellow
Write-Host ""
Write-Host "This will take 10-15 minutes (API calls + embedding generation)..." -ForegroundColor Yellow
Write-Host ""

# Function to sync a campaign
function Sync-Campaign {
    param(
        [string]$campaignId,
        [string]$campaignName,
        [int]$maxProducts = 100,
        [bool]$generateEmbeddings = $true
    )

    Write-Host "[$campaignId] $campaignName" -ForegroundColor White
    Write-Host "  Max products: $maxProducts | Embeddings: $generateEmbeddings" -ForegroundColor Gray

    $body = @{
        source = "impact"
        syncAll = $false
        campaignId = $campaignId
        maxProducts = $maxProducts
        generateEmbeddings = $generateEmbeddings
    } | ConvertTo-Json

    $headers = @{
        "Content-Type" = "application/json"
        "x-admin-secret" = $adminSecret
    }

    try {
        $response = Invoke-RestMethod -Uri $baseUrl -Method Post -Headers $headers -Body $body

        if ($response.synced -gt 0) {
            Write-Host "  SUCCESS: Synced $($response.synced) products" -ForegroundColor Green
            Write-Host "  Embeddings: $($response.embeddingsGenerated)" -ForegroundColor Green

            $script:totalSynced += $response.synced
            $script:totalEmbeddings += $response.embeddingsGenerated

            if ($response.errors -gt 0) {
                Write-Host "  Errors: $($response.errors)" -ForegroundColor Red
                $script:totalErrors += $response.errors
            }
        } else {
            Write-Host "  SKIP: No valid products found" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $script:totalErrors++
    }

    Write-Host ""
    Start-Sleep -Seconds 2
}

# Sync high-quality campaigns first
Write-Host "PHASE 1: High-Quality Campaigns" -ForegroundColor Cyan
Write-Host "--------------------------------" -ForegroundColor Cyan
Write-Host ""

foreach ($entry in $highQualityCampaigns.GetEnumerator()) {
    Sync-Campaign -campaignId $entry.Key -campaignName $entry.Value -maxProducts 100 -generateEmbeddings $true
}

Write-Host ""
Write-Host "PHASE 2: DHgate Campaigns (with title fallback)" -ForegroundColor Cyan
Write-Host "------------------------------------------------" -ForegroundColor Cyan
Write-Host ""

foreach ($entry in $dhgateCampaigns.GetEnumerator()) {
    Sync-Campaign -campaignId $entry.Key -campaignName $entry.Value -maxProducts 100 -generateEmbeddings $true
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SYNC COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total products synced: $totalSynced" -ForegroundColor White
Write-Host "Total embeddings generated: $totalEmbeddings" -ForegroundColor Green
Write-Host "Total errors: $totalErrors" -ForegroundColor $(if ($totalErrors -gt 0) { "Red" } else { "Green" })
Write-Host ""
Write-Host "You can now search for:" -ForegroundColor Cyan
Write-Host "  - High-quality: 'fitness equipment', 'athletic gear', 'sunglasses', 'eco bags'" -ForegroundColor White
Write-Host "  - Fashion: 'sports wear', 'yoga clothes', 'workout gear', 'athletic apparel'" -ForegroundColor White
Write-Host ""
Write-Host "DHgate products (title-only descriptions) will rank lower than" -ForegroundColor Yellow
Write-Host "high-quality products (full descriptions) due to semantic search." -ForegroundColor Yellow
Write-Host ""
