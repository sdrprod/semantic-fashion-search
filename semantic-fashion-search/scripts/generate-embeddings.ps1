# Generate embeddings for all products without embeddings

param(
    [int]$BatchSize = 50,
    [switch]$DryRun = $false
)

$adminSecret = "3a2c5e9d9f4b27a8c1f0e2b6d7a934e1"
$baseUrl = "http://localhost:3000/api/admin/generate-embeddings"

Write-Host ""
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host "GENERATE EMBEDDINGS FOR SEMANTIC SEARCH" -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host ""

# First, check how many products need embeddings
Write-Host "Checking products without embeddings..." -ForegroundColor Yellow

$checkBody = @{
    action = "count"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "x-admin-secret" = $adminSecret
}

try {
    $countResponse = Invoke-RestMethod -Uri $baseUrl -Method Post -Headers $headers -Body $checkBody
    $totalProducts = $countResponse.count

    Write-Host ""
    Write-Host "Products without embeddings: $totalProducts" -ForegroundColor White
    Write-Host ""

    if ($totalProducts -eq 0) {
        Write-Host "All products already have embeddings!" -ForegroundColor Green
        Write-Host ""
        exit
    }

    # Calculate estimates
    $batches = [Math]::Ceiling($totalProducts / $BatchSize)
    $estimatedMinutes = [Math]::Ceiling($batches * 0.5)
    $estimatedCost = ($totalProducts / 1000) * 0.02

    Write-Host "Configuration:" -ForegroundColor Yellow
    Write-Host "  Batch size: $BatchSize products" -ForegroundColor White
    Write-Host "  Total batches: $batches" -ForegroundColor White
    Write-Host "  Estimated time: $estimatedMinutes minutes" -ForegroundColor White
    Write-Host "  Estimated cost: `$$([Math]::Round($estimatedCost, 2))" -ForegroundColor White
    Write-Host ""

    if ($DryRun) {
        Write-Host "DRY RUN MODE - No embeddings will be generated" -ForegroundColor Yellow
        Write-Host ""
        exit
    }

    Write-Host "This will generate embeddings using OpenAI API." -ForegroundColor Yellow
    $proceed = Read-Host "Continue? (y/n)"

    if ($proceed -ne "y") {
        Write-Host "Cancelled." -ForegroundColor Yellow
        exit
    }

    Write-Host ""
    Write-Host "Starting embedding generation..." -ForegroundColor Green
    Write-Host ""

    $startTime = Get-Date
    $totalGenerated = 0
    $totalErrors = 0
    $batchNumber = 1

    while ($totalGenerated -lt $totalProducts) {
        $remaining = $totalProducts - $totalGenerated
        $currentBatchSize = [Math]::Min($BatchSize, $remaining)

        Write-Host "Batch $batchNumber/$batches (generating $currentBatchSize embeddings)..." -ForegroundColor Cyan

        $generateBody = @{
            action = "generate"
            batchSize = $currentBatchSize
        } | ConvertTo-Json

        try {
            $batchStartTime = Get-Date
            $response = Invoke-RestMethod -Uri $baseUrl -Method Post -Headers $headers -Body $generateBody
            $batchDuration = ((Get-Date) - $batchStartTime).TotalSeconds

            $totalGenerated += $response.generated

            if ($response.errors -gt 0) {
                $totalErrors += $response.errors
                Write-Host "  Generated: $($response.generated), Errors: $($response.errors) (${batchDuration}s)" -ForegroundColor Yellow
            } else {
                Write-Host "  Generated: $($response.generated) embeddings (${batchDuration}s)" -ForegroundColor Green
            }

            $percentComplete = [Math]::Round(($totalGenerated / $totalProducts) * 100, 1)
            $elapsed = ((Get-Date) - $startTime).TotalMinutes
            $estimatedTotal = if ($totalGenerated -gt 0) { $elapsed / ($totalGenerated / $totalProducts) } else { 0 }
            $remainingTime = [Math]::Max(0, $estimatedTotal - $elapsed)

            Write-Host "  Progress: $percentComplete% ($totalGenerated/$totalProducts) | Elapsed: $([Math]::Round($elapsed, 1))m | ETA: $([Math]::Round($remainingTime, 1))m" -ForegroundColor Gray
            Write-Host ""

            $batchNumber++

        } catch {
            Write-Host "  Batch failed: $($_.Exception.Message)" -ForegroundColor Red
            $totalErrors++
            Write-Host "  Waiting 5 seconds before retry..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5
        }

        if ($totalGenerated -lt $totalProducts) {
            Start-Sleep -Milliseconds 500
        }
    }

    $totalDuration = ((Get-Date) - $startTime).TotalMinutes

    Write-Host ""
    Write-Host ("=" * 70) -ForegroundColor Cyan
    Write-Host "EMBEDDING GENERATION COMPLETE" -ForegroundColor Cyan
    Write-Host ("=" * 70) -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Summary:" -ForegroundColor Yellow
    Write-Host "  Total generated: $totalGenerated embeddings" -ForegroundColor Green
    Write-Host "  Total errors: $totalErrors" -ForegroundColor $(if ($totalErrors -gt 0) { "Red" } else { "Green" })
    Write-Host "  Total time: $([Math]::Round($totalDuration, 1)) minutes" -ForegroundColor White
    Write-Host "  Average: $([Math]::Round($totalGenerated / $totalDuration, 1)) embeddings/minute" -ForegroundColor White
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Test semantic search with expanded catalog" -ForegroundColor White
    Write-Host "  2. Try complex queries (e.g., elegant dress for summer wedding)" -ForegroundColor White
    Write-Host "  3. Deploy updated catalog to Netlify" -ForegroundColor White
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    exit 1
}
