# Test the 10 remaining campaigns we haven't synced yet

$adminSecret = "3a2c5e9d9f4b27a8c1f0e2b6d7a934e1"
$baseUrl = "http://localhost:3000/api/admin/sync-products"

$campaigns = @("7163", "7188", "19090", "19224", "21283", "22361", "25480", "27725", "27815", "28532")

Write-Host ""
Write-Host "Testing remaining 10 campaigns..." -ForegroundColor Cyan
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
            Write-Host "  SUCCESS: $($response.synced) products available" -ForegroundColor Green
            $goodCampaigns += $campaignId
        } else {
            Write-Host "  SKIP: No valid products" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }

    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "RESULTS:" -ForegroundColor Cyan
Write-Host "Campaigns with products: $($goodCampaigns -join ', ')" -ForegroundColor Green
Write-Host ""
