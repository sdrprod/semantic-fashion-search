# Test multiple campaigns to find fashion products
# Tests first 5 campaigns quickly to identify fashion merchants

$campaigns = @("7163", "7183", "7184", "7186", "7187")
$adminSecret = "3a2c5e9d9f4b27a8c1f0e2b6d7a934e1"
$baseUrl = "http://localhost:3000/api/admin/sync-products"

Write-Host ""
Write-Host "Testing campaigns to find fashion products..." -ForegroundColor Cyan
Write-Host ""

foreach ($campaignId in $campaigns) {
    Write-Host "Testing Campaign $campaignId..." -ForegroundColor Yellow

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
            Write-Host "  SUCCESS: Found $($response.synced) valid products!" -ForegroundColor Green
        } else {
            Write-Host "  SKIP: No valid products (might not be fashion)" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }

    Write-Host ""
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "Test complete! Check which campaigns returned valid products." -ForegroundColor Cyan
Write-Host ""
