# Test quality filtering with DHgate campaign 7186 (best quality: 75% high, 66% premium)

$adminSecret = "3a2c5e9d9f4b27a8c1f0e2b6d7a934e1"
$baseUrl = "http://localhost:3000/api/admin/sync-products"

Write-Host ""
Write-Host "Testing quality filtering with DHgate campaign 7186..." -ForegroundColor Cyan
Write-Host "This campaign showed 75% high quality (score>=5) products in testing" -ForegroundColor Gray
Write-Host ""

# Test 1: Sync 20 products with HIGH quality threshold (score >= 5)
Write-Host "Test 1: HIGH quality threshold (minQualityScore=5)" -ForegroundColor Yellow

$body1 = @{
    source = "impact"
    syncAll = $false
    campaignId = "7186"
    maxProducts = 20
    generateEmbeddings = $false
    minQualityScore = 5
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "x-admin-secret" = $adminSecret
}

try {
    $response1 = Invoke-RestMethod -Uri $baseUrl -Method Post -Headers $headers -Body $body1
    Write-Host "  Result: $($response1.synced) products synced (expected ~15 from 20 fetched)" -ForegroundColor Green
    Write-Host "  Message: $($response1.message)" -ForegroundColor Gray
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Start-Sleep -Seconds 2

# Test 2: Sync 20 products with PREMIUM quality threshold (score >= 6)
Write-Host "Test 2: PREMIUM quality threshold (minQualityScore=6)" -ForegroundColor Yellow

$body2 = @{
    source = "impact"
    syncAll = $false
    campaignId = "7186"
    maxProducts = 20
    generateEmbeddings = $false
    minQualityScore = 6
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri $baseUrl -Method Post -Headers $headers -Body $body2
    Write-Host "  Result: $($response2.synced) products synced (expected ~13 from 20 fetched)" -ForegroundColor Green
    Write-Host "  Message: $($response2.message)" -ForegroundColor Gray
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Start-Sleep -Seconds 2

# Test 3: Sync 20 products with MEDIUM quality threshold (score >= 4)
Write-Host "Test 3: MEDIUM quality threshold (minQualityScore=4)" -ForegroundColor Yellow

$body3 = @{
    source = "impact"
    syncAll = $false
    campaignId = "7186"
    maxProducts = 20
    generateEmbeddings = $false
    minQualityScore = 4
} | ConvertTo-Json

try {
    $response3 = Invoke-RestMethod -Uri $baseUrl -Method Post -Headers $headers -Body $body3
    Write-Host "  Result: $($response3.synced) products synced (expected ~15-16 from 20 fetched)" -ForegroundColor Green
    Write-Host "  Message: $($response3.message)" -ForegroundColor Gray
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "═" * 70 -ForegroundColor Cyan
Write-Host "QUALITY SCORING:" -ForegroundColor Cyan
Write-Host "  Score 4 (Medium): USD + description + price + (fashion OR brand)" -ForegroundColor Gray
Write-Host "  Score 5 (High):   Above + good description (50+ chars) OR reasonable price" -ForegroundColor Gray
Write-Host "  Score 6 (Premium): Above + detailed description (150+ chars) + brand" -ForegroundColor Gray
Write-Host "  Score 7 (Perfect): All of the above" -ForegroundColor Gray
Write-Host "═" * 70 -ForegroundColor Cyan
Write-Host ""
Write-Host "RECOMMENDATIONS:" -ForegroundColor Green
Write-Host "  • Use minQualityScore=5 for best user experience (~169,723 products available)" -ForegroundColor White
Write-Host "  • Use minQualityScore=6 for premium quality (~125,482 products available)" -ForegroundColor White
Write-Host "  • Focus on campaigns: 7183, 7184, 7186, 7187 (100% USD, high quality)" -ForegroundColor White
Write-Host ""
