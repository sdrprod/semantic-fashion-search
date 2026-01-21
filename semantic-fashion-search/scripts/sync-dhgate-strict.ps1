# Sync DHGate campaigns with STRICT quality filtering (minQualityScore=6)

param(
    [int]$ProductsPerCampaign = 1000,
    [int]$MinQualityScore = 6
)

$adminSecret = "3a2c5e9d9f4b27a8c1f0e2b6d7a934e1"
$baseUrl = "http://localhost:3000/api/admin/sync-products"

$campaigns = @(
    @{ id = "7186"; name = "DHGate Campaign 3" },
    @{ id = "7184"; name = "DHGate Campaign 2" },
    @{ id = "7187"; name = "DHGate Campaign 4" },
    @{ id = "7188"; name = "DHGate Campaign 5" },
    @{ id = "7183"; name = "DHGate Campaign 1" }
)

Write-Host ""
Write-Host ("=" * 80)
Write-Host "DHGATE STRICT QUALITY SYNC"
Write-Host ("=" * 80)
Write-Host ""
Write-Host "Configuration:"
Write-Host "  Products per campaign: $ProductsPerCampaign"
Write-Host "  Minimum quality score: $MinQualityScore (PREMIUM)"
Write-Host "  Campaigns: 5 DHGate campaigns"
Write-Host ""

$proceed = Read-Host "Continue? (y/n)"
if ($proceed -ne "y") {
    Write-Host "Cancelled."
    exit
}

Write-Host ""
Write-Host "Starting sync..."
Write-Host ""

$headers = @{
    "Content-Type" = "application/json"
    "x-admin-secret" = $adminSecret
}

$totalSynced = 0
$totalErrors = 0
$results = @()

foreach ($campaign in $campaigns) {
    Write-Host ("─" * 80)
    Write-Host "Syncing $($campaign.name) (ID: $($campaign.id))..."

    $body = @{
        source = "impact"
        campaignId = $campaign.id
        maxProducts = $ProductsPerCampaign
        generateEmbeddings = $false
        minQualityScore = $MinQualityScore
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri $baseUrl -Method Post -Headers $headers -Body $body -TimeoutSec 600

        $synced = $response.synced
        $errors = $response.errors

        $totalSynced += $synced
        $totalErrors += $errors

        $results += @{
            campaign = $campaign.name
            id = $campaign.id
            synced = $synced
            errors = $errors
        }

        Write-Host "  Synced: $synced products" -ForegroundColor Green
        if ($errors -gt 0) {
            Write-Host "  Errors: $errors" -ForegroundColor Yellow
        }

    } catch {
        Write-Host "  Failed: $($_.Exception.Message)" -ForegroundColor Red
        $totalErrors++
    }

    Write-Host ""
    Start-Sleep -Seconds 3
}

Write-Host ("=" * 80)
Write-Host "SYNC COMPLETE"
Write-Host ("=" * 80)
Write-Host ""
Write-Host "Results:"
foreach ($result in $results) {
    Write-Host "  $($result.campaign): $($result.synced) products"
}
Write-Host ""
Write-Host "Total synced: $totalSynced products" -ForegroundColor Green
Write-Host ""
