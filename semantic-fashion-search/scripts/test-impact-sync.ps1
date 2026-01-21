# Test Impact.com product sync with a single campaign
# PowerShell version for Windows

Write-Host "Starting test sync from Impact.com campaign 7163..." -ForegroundColor Green

$body = @{
    source = "impact"
    syncAll = $false
    campaignId = "7163"
    maxProducts = 50
    generateEmbeddings = $true
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "x-admin-secret" = "3a2c5e9d9f4b27a8c1f0e2b6d7a934e1"
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/sync-products" `
        -Method Post `
        -Headers $headers `
        -Body $body

    Write-Host "`nSync Results:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10

    Write-Host "`nSynced: $($response.synced) products" -ForegroundColor Green
    Write-Host "Errors: $($response.errors)" -ForegroundColor Yellow
    Write-Host "Embeddings: $($response.embeddingsGenerated)" -ForegroundColor Green
} catch {
    Write-Host "`nError during sync:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
