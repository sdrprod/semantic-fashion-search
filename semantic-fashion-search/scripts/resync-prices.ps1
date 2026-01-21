# Re-sync all products to update prices with fixed CurrentPrice mapping
# This will UPSERT products (update existing with new price data)

$adminSecret = "3a2c5e9d9f4b27a8c1f0e2b6d7a934e1"
$baseUrl = "http://localhost:3000/api/admin/sync-products"

$campaigns = @("11817", "11923", "16350", "16376", "16377", "16378", "7183", "7184", "7186", "7187")

Write-Host ""
Write-Host "Re-syncing products to update prices..." -ForegroundColor Cyan
Write-Host ""

foreach ($campaignId in $campaigns) {
    Write-Host "Syncing campaign $campaignId..." -ForegroundColor White

    $body = @{
        source = "impact"
        syncAll = $false
        campaignId = $campaignId
        maxProducts = 100
        generateEmbeddings = $false  # Skip embeddings, just update prices
    } | ConvertTo-Json

    $headers = @{
        "Content-Type" = "application/json"
        "x-admin-secret" = $adminSecret
    }

    try {
        $response = Invoke-RestMethod -Uri $baseUrl -Method Post -Headers $headers -Body $body
        Write-Host "  Synced: $($response.synced) products" -ForegroundColor Green
    } catch {
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }

    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "Done! Prices should now be available." -ForegroundColor Green
Write-Host ""
