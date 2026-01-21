# Bulk sync high-quality fashion products from the 4 best DHgate campaigns
# Campaigns: 7183, 7184, 7186, 7187 (100% USD, 50-75% high quality)
# Updated: 2000 products per campaign for ~8000-10000 total after filtering

param(
    [int]$ProductsPerCampaign = 2000,
    [int]$MinQualityScore = 5,
    [switch]$GenerateEmbeddings = $false
)

$adminSecret = "3a2c5e9d9f4b27a8c1f0e2b6d7a934e1"
$baseUrl = "http://localhost:3000/api/admin/sync-products"

$campaigns = @(
    @{ id = "7186"; name = "DHgate Campaign 3"; quality = "75% high" },
    @{ id = "7184"; name = "DHgate Campaign 2"; quality = "55% high" },
    @{ id = "7187"; name = "DHgate Campaign 4"; quality = "49% high" },
    @{ id = "7188"; name = "DHgate Campaign 5"; quality = "49% high" },
    @{ id = "7183"; name = "DHgate Campaign 1"; quality = "32% high" }
)

Write-Host ""
Write-Host "═" * 70 -ForegroundColor Cyan
Write-Host "BULK SYNC: High-Quality Fashion Products" -ForegroundColor Cyan
Write-Host "═" * 70 -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Products per campaign: $ProductsPerCampaign" -ForegroundColor White
Write-Host "  Minimum quality score: $MinQualityScore (0-7)" -ForegroundColor White
Write-Host "  Generate embeddings: $GenerateEmbeddings" -ForegroundColor White
Write-Host "  Campaigns to sync: 4 (best DHgate campaigns)" -ForegroundColor White
Write-Host ""
Write-Host "Expected results (based on testing):" -ForegroundColor Gray
Write-Host "  Campaign 7186: ~75% pass = $([math]::Round($ProductsPerCampaign * 0.75)) products" -ForegroundColor Gray
Write-Host "  Campaign 7184: ~55% pass = $([math]::Round($ProductsPerCampaign * 0.55)) products" -ForegroundColor Gray
Write-Host "  Campaign 7187: ~49% pass = $([math]::Round($ProductsPerCampaign * 0.49)) products" -ForegroundColor Gray
Write-Host "  Campaign 7183: ~32% pass = $([math]::Round($ProductsPerCampaign * 0.32)) products" -ForegroundColor Gray
Write-Host "  TOTAL EXPECTED: ~$([math]::Round($ProductsPerCampaign * (0.75 + 0.55 + 0.49 + 0.32))) products (8000-10000 target)" -ForegroundColor Green
Write-Host ""

$proceed = Read-Host "Continue? (y/n)"
if ($proceed -ne "y") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "Starting bulk sync..." -ForegroundColor Green
Write-Host ""

$headers = @{
    "Content-Type" = "application/json"
    "x-admin-secret" = $adminSecret
}

$totalSynced = 0
$totalErrors = 0
$results = @()

foreach ($campaign in $campaigns) {
    Write-Host "Syncing $($campaign.name) (ID: $($campaign.id))..." -ForegroundColor Yellow
    Write-Host "  Quality rate: $($campaign.quality)" -ForegroundColor Gray

    $body = @{
        source = "impact"
        syncAll = $false
        campaignId = $campaign.id
        maxProducts = $ProductsPerCampaign
        generateEmbeddings = $GenerateEmbeddings
        minQualityScore = $MinQualityScore
    } | ConvertTo-Json

    try {
        $startTime = Get-Date
        $response = Invoke-RestMethod -Uri $baseUrl -Method Post -Headers $headers -Body $body
        $duration = ((Get-Date) - $startTime).TotalSeconds

        $totalSynced += $response.synced
        $totalErrors += $response.errors

        $results += @{
            campaign = $campaign.name
            campaignId = $campaign.id
            synced = $response.synced
            errors = $response.errors
            duration = $duration
        }

        Write-Host "  SUCCESS: $($response.synced) products synced in $([math]::Round($duration, 1))s" -ForegroundColor Green

        if ($response.errors -gt 0) {
            Write-Host "  WARNING: $($response.errors) errors" -ForegroundColor Red
        }

    } catch {
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $totalErrors++

        $results += @{
            campaign = $campaign.name
            campaignId = $campaign.id
            synced = 0
            errors = 1
            duration = 0
        }
    }

    Write-Host ""

    # Rate limiting between campaigns
    if ($campaign.id -ne $campaigns[-1].id) {
        Write-Host "  Waiting 2 seconds before next campaign..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
        Write-Host ""
    }
}

Write-Host "═" * 70 -ForegroundColor Cyan
Write-Host "SYNC COMPLETE" -ForegroundColor Cyan
Write-Host "═" * 70 -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
foreach ($result in $results) {
    Write-Host "  $($result.campaign): $($result.synced) products" -ForegroundColor White
}
Write-Host ""
Write-Host "Total synced: $totalSynced products" -ForegroundColor Green
Write-Host "Total errors: $totalErrors" -ForegroundColor $(if ($totalErrors -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($totalSynced -gt 0) {
    Write-Host "Next steps:" -ForegroundColor Yellow
    if (-not $GenerateEmbeddings) {
        Write-Host "  1. Generate embeddings for $totalSynced products" -ForegroundColor White
        Write-Host "     Use: scripts/generate-missing-embeddings.ps1" -ForegroundColor Gray
    }
    Write-Host "  2. Test search quality with expanded catalog" -ForegroundColor White
    Write-Host "  3. Deploy to Netlify when ready" -ForegroundColor White
    Write-Host ""
}

Write-Host "Quality filtering stats available in server logs" -ForegroundColor Gray
Write-Host ""
