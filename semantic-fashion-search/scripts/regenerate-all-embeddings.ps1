# Regenerate all embeddings with proper vector format
# This clears existing string-based embeddings and regenerates them properly

$adminSecret = "3a2c5e9d9f4b27a8c1f0e2b6d7a934e1"
$baseUrl = "http://localhost:3000/api/admin/sync-products"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  REGENERATE ALL EMBEDDINGS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will regenerate embeddings for all products" -ForegroundColor Yellow
Write-Host "with the corrected PostgreSQL vector format." -ForegroundColor Yellow
Write-Host ""
Write-Host "Estimated time: 5-10 minutes..." -ForegroundColor Yellow
Write-Host ""

# All campaigns
$campaigns = @("11817", "11923", "16350", "16376", "16377", "16378", "7183", "7184", "7186", "7187")

$totalEmbeddings = 0

foreach ($campaignId in $campaigns) {
    Write-Host "Processing campaign $campaignId..." -ForegroundColor White

    $body = @{
        source = "impact"
        syncAll = $false
        campaignId = $campaignId
        maxProducts = 100
        generateEmbeddings = $true
    } | ConvertTo-Json

    $headers = @{
        "Content-Type" = "application/json"
        "x-admin-secret" = $adminSecret
    }

    try {
        $response = Invoke-RestMethod -Uri $baseUrl -Method Post -Headers $headers -Body $body

        Write-Host "  Embeddings: $($response.embeddingsGenerated)" -ForegroundColor Green
        $totalEmbeddings += $response.embeddingsGenerated
    } catch {
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }

    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total embeddings regenerated: $totalEmbeddings" -ForegroundColor Green
Write-Host ""
Write-Host "Now run test-search-quality.mjs to validate!" -ForegroundColor Cyan
Write-Host ""
