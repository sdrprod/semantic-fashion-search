# Simple DHGate sync script
param([int]$ProductsPerCampaign = 1000, [int]$MinQualityScore = 6)

$campaigns = @("7186", "7184", "7187", "7188", "7183")
$adminSecret = "3a2c5e9d9f4b27a8c1f0e2b6d7a934e1"
$baseUrl = "http://localhost:3000/api/admin/sync-products"
$headers = @{ "Content-Type" = "application/json"; "x-admin-secret" = $adminSecret }

Write-Host "Starting DHGate sync: $($campaigns.Count) campaigns, $ProductsPerCampaign products each"
Write-Host ""

$totalSynced = 0
foreach ($campId in $campaigns) {
    Write-Host "Syncing campaign $campId..."
    $body = @{ source="impact"; campaignId=$campId; maxProducts=$ProductsPerCampaign; generateEmbeddings=$false; minQualityScore=$MinQualityScore } | ConvertTo-Json
    try {
        $r = Invoke-RestMethod -Uri $baseUrl -Method Post -Headers $headers -Body $body -TimeoutSec 600
        Write-Host "  Synced: $($r.synced)" -ForegroundColor Green
        $totalSynced += $r.synced
    } catch {
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    Start-Sleep -Seconds 3
}
Write-Host ""
Write-Host "Total: $totalSynced products synced" -ForegroundColor Cyan
