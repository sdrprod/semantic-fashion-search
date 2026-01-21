# Test multiple campaigns to find the best quality product data
# Tests 5 products from each campaign and shows data quality metrics

$campaigns = @("7183", "7184", "7186", "11817", "11923", "16350", "16376", "16377", "16378")
$adminSecret = "3a2c5e9d9f4b27a8c1f0e2b6d7a934e1"
$baseUrl = "http://localhost:3000/api/admin/sync-products"

Write-Host ""
Write-Host "Testing campaign data quality..." -ForegroundColor Cyan
Write-Host "Syncing 5 products from each campaign (no embeddings for speed)" -ForegroundColor Yellow
Write-Host ""

$goodCampaigns = @()

foreach ($campaignId in $campaigns) {
    Write-Host "Testing Campaign $campaignId..." -ForegroundColor White

    $body = @{
        source = "impact"
        syncAll = $false
        campaignId = $campaignId
        maxProducts = 5
        generateEmbeddings = $false
    } | ConvertTo-Json

    $headers = @{
        "Content-Type" = "application/json"
        "x-admin-secret" = $adminSecret
    }

    try {
        $response = Invoke-RestMethod -Uri $baseUrl -Method Post -Headers $headers -Body $body

        if ($response.synced -gt 0) {
            Write-Host "  SUCCESS: Synced $($response.synced) products" -ForegroundColor Green
            $goodCampaigns += $campaignId
        } else {
            Write-Host "  SKIP: No valid products found" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }

    Write-Host ""
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "RESULTS:" -ForegroundColor Cyan
Write-Host "Good campaigns with products: $($goodCampaigns -join ', ')" -ForegroundColor Green
Write-Host ""
Write-Host "Now run check-campaign-data.mjs to see product quality details!" -ForegroundColor Yellow
Write-Host ""
