# Test sync for a single campaign (7187)
# This will sync 10 products to see the actual API response

$campaignId = "7187"
$adminSecret = "3a2c5e9d9f4b27a8c1f0e2b6d7a934e1"
$baseUrl = "http://localhost:3000/api/admin/sync-products"

Write-Host ""
Write-Host "Testing Campaign $campaignId..." -ForegroundColor Cyan
Write-Host "Check your terminal console for API response details!"
Write-Host ""

$body = @{
    source = "impact"
    syncAll = $false
    campaignId = $campaignId
    maxProducts = 10
    generateEmbeddings = $false
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "x-admin-secret" = $adminSecret
}

try {
    $response = Invoke-RestMethod -Uri $baseUrl -Method Post -Headers $headers -Body $body

    Write-Host ""
    Write-Host "Sync Results:" -ForegroundColor Cyan
    Write-Host "  Synced: $($response.synced) products" -ForegroundColor $(if ($response.synced -gt 0) { "Green" } else { "Yellow" })
    Write-Host "  Errors: $($response.errors)" -ForegroundColor $(if ($response.errors -gt 0) { "Red" } else { "Green" })
    Write-Host "  Embeddings: $($response.embeddingsGenerated)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Message: $($response.message)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "ERROR during sync:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host ""
}

Write-Host "IMPORTANT: Check your dev server console for the API field dump!" -ForegroundColor Yellow
Write-Host ""
