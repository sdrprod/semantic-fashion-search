# Test quality filtering with a small batch
# Syncs 100 products from best DHGate campaign to verify filters work

$adminSecret = "3a2c5e9d9f4b27a8c1f0e2b6d7a934e1"
$baseUrl = "http://localhost:3000/api/admin/sync-products"

Write-Host ""
Write-Host "═" * 70 -ForegroundColor Cyan
Write-Host "TEST QUALITY FILTERING" -ForegroundColor Cyan
Write-Host "═" * 70 -ForegroundColor Cyan
Write-Host ""
Write-Host "Testing with:" -ForegroundColor Yellow
Write-Host "  Campaign: 7186 (best DHGate campaign)" -ForegroundColor White
Write-Host "  Products: 100" -ForegroundColor White
Write-Host "  Quality Score: 6 (premium)" -ForegroundColor White
Write-Host ""
Write-Host "Expected: ~50 products will pass quality filtering (50% pass rate)" -ForegroundColor Gray
Write-Host ""

$headers = @{
    "Content-Type" = "application/json"
    "x-admin-secret" = $adminSecret
}

$body = @{
    source = "impact"
    campaignId = "7186"
    maxProducts = 100
    generateEmbeddings = $false
    minQualityScore = 6
} | ConvertTo-Json

Write-Host "Starting test sync..." -ForegroundColor Green
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $baseUrl -Method Post -Headers $headers -Body $body -TimeoutSec 120

    Write-Host "═" * 70 -ForegroundColor Green
    Write-Host "TEST RESULTS" -ForegroundColor Green
    Write-Host "═" * 70 -ForegroundColor Green
    Write-Host ""
    Write-Host "Synced: $($response.synced) products" -ForegroundColor Cyan
    Write-Host "Errors: $($response.errors)" -ForegroundColor $(if ($response.errors -gt 0) { "Yellow" } else { "Gray" })
    Write-Host ""

    if ($response.synced -gt 0) {
        Write-Host "✅ Quality filtering is working!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Pass rate: $([math]::Round($response.synced / 1.0, 0))% ($($response.synced)/100)" -ForegroundColor White
        Write-Host ""
        Write-Host "Now checking product quality..." -ForegroundColor Yellow
        Write-Host ""

        # Check data quality
        $qualityCheck = node "scripts/check-data-quality-issues.mjs"
        Write-Host $qualityCheck
        Write-Host ""

        Write-Host "═" * 70 -ForegroundColor Yellow
        Write-Host "NEXT STEPS" -ForegroundColor Yellow
        Write-Host "═" * 70 -ForegroundColor Yellow
        Write-Host ""
        Write-Host "If quality looks good:" -ForegroundColor White
        Write-Host "  1. Clear test data: echo yes | node scripts/clear-products.mjs" -ForegroundColor Gray
        Write-Host "  2. Run full sync: .\\scripts\\sync-dhgate-strict.ps1" -ForegroundColor Gray
        Write-Host ""
        Write-Host "If quality needs adjustment:" -ForegroundColor White
        Write-Host "  - Review lib/impact.ts filtering logic" -ForegroundColor Gray
        Write-Host "  - Adjust NON_FASHION_KEYWORDS or quality scoring" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "⚠️  No products passed filtering!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Possible issues:" -ForegroundColor Red
        Write-Host "  - MinQualityScore too high (try 5 instead of 6)" -ForegroundColor White
        Write-Host "  - Fashion category whitelist too strict" -ForegroundColor White
        Write-Host "  - Non-fashion keywords too aggressive" -ForegroundColor White
        Write-Host ""
    }

} catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check that:" -ForegroundColor Yellow
    Write-Host "  - Next.js dev server is running (npm run dev)" -ForegroundColor White
    Write-Host "  - API credentials are configured in .env.local" -ForegroundColor White
    Write-Host "  - Campaign 7186 is accessible" -ForegroundColor White
    Write-Host ""
}
