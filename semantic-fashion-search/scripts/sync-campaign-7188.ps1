# Sync campaign 7188 only

$adminSecret = "3a2c5e9d9f4b27a8c1f0e2b6d7a934e1"
$baseUrl = "http://localhost:3000/api/admin/sync-products"

$headers = @{
    "Content-Type" = "application/json"
    "x-admin-secret" = $adminSecret
}

$body = @{
    source = "impact"
    syncAll = $false
    campaignId = "7188"
    maxProducts = 2000
    generateEmbeddings = $false
    minQualityScore = 5
} | ConvertTo-Json

Write-Host ""
Write-Host "Syncing DHgate Campaign 5 (ID: 7188)..." -ForegroundColor Yellow
Write-Host "  Expected: ~49% fashion, ~32% quality" -ForegroundColor Gray
Write-Host ""

try {
    $startTime = Get-Date
    $response = Invoke-RestMethod -Uri $baseUrl -Method Post -Headers $headers -Body $body
    $duration = ((Get-Date) - $startTime).TotalSeconds

    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "  Synced: $($response.synced) products in $([math]::Round($duration, 1))s" -ForegroundColor White

    if ($response.errors -gt 0) {
        Write-Host "  Errors: $($response.errors)" -ForegroundColor Red
    }

    Write-Host ""
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
