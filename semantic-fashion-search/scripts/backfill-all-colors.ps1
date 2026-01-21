<#
.SYNOPSIS
    Backfill verified_colors for all products using GPT-4 Vision

.DESCRIPTION
    This script repeatedly runs extract-product-colors.mjs in batches until
    all products have their colors analyzed and stored in the verified_colors field.

.PARAMETER BatchSize
    Number of products to process per batch (default: 50)

.PARAMETER MaxBatches
    Maximum number of batches to process before stopping (default: unlimited)

.PARAMETER DelayBetweenBatches
    Seconds to wait between batches (default: 5)

.EXAMPLE
    .\backfill-all-colors.ps1
    Process all products with default settings (50 per batch)

.EXAMPLE
    .\backfill-all-colors.ps1 -BatchSize 25
    Process in smaller batches of 25 products

.EXAMPLE
    .\backfill-all-colors.ps1 -MaxBatches 10 -BatchSize 100
    Process only 10 batches of 100 products (1000 total)
#>

param(
    [int]$BatchSize = 50,
    [int]$MaxBatches = 0,
    [int]$DelayBetweenBatches = 5
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$ExtractScript = Join-Path $ScriptDir "extract-product-colors.mjs"

Write-Host ""
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host "PRODUCT COLOR BACKFILL - SETUP" -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $ExtractScript)) {
    Write-Host "[ERROR] Extract script not found: $ExtractScript" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

$EnvFile = Join-Path $ProjectRoot ".env.local"
if (-not (Test-Path $EnvFile)) {
    Write-Host "[ERROR] .env.local file not found: $EnvFile" -ForegroundColor Red
    Write-Host "  Please create .env.local with required credentials:" -ForegroundColor Blue
    Write-Host "  - OPENAI_API_KEY" -ForegroundColor Blue
    Write-Host "  - SUPABASE_URL" -ForegroundColor Blue
    Write-Host "  - SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Blue
    exit 1
}

Write-Host "[OK] Prerequisites validated" -ForegroundColor Green
Write-Host "  Extract script: $ExtractScript" -ForegroundColor Gray
Write-Host "  Batch size: $BatchSize products" -ForegroundColor Gray
Write-Host "  Max batches: $(if ($MaxBatches -gt 0) { $MaxBatches } else { 'unlimited' })" -ForegroundColor Gray
Write-Host "  Delay between batches: $DelayBetweenBatches seconds" -ForegroundColor Gray

$BatchCount = 0
$TotalProcessed = 0
$TotalSuccess = 0
$TotalFailed = 0
$StartTime = Get-Date

Write-Host ""
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host "STARTING BACKFILL PROCESS" -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor Cyan

try {
    while ($true) {
        $BatchCount++

        if ($MaxBatches -gt 0 -and $BatchCount -gt $MaxBatches) {
            Write-Host ""
            Write-Host "[WARN] Reached maximum batch limit ($MaxBatches batches)" -ForegroundColor Yellow
            break
        }

        Write-Host ""
        Write-Host "=== Batch $BatchCount ===" -ForegroundColor Cyan
        Write-Host ""

        $Output = & node $ExtractScript --batch-size=$BatchSize 2>&1 | ForEach-Object {
            $line = $_.ToString()
            Write-Host $line
            $line
        }

        $OutputText = $Output -join "`n"

        if ($OutputText -match "No products need color analysis") {
            Write-Host ""
            Write-Host "[OK] All products have been analyzed!" -ForegroundColor Green
            break
        }

        if ($OutputText -match "Successful:\s+(\d+)") {
            $BatchSuccess = [int]$Matches[1]
            $TotalSuccess += $BatchSuccess
        } else {
            $BatchSuccess = 0
        }

        if ($OutputText -match "Failed:\s+(\d+)") {
            $BatchFailed = [int]$Matches[1]
            $TotalFailed += $BatchFailed
        } else {
            $BatchFailed = 0
        }

        $BatchProcessed = $BatchSuccess + $BatchFailed
        $TotalProcessed += $BatchProcessed

        $RemainingCount = -1
        if ($OutputText -match "(\d+)\s+products still need analysis") {
            $RemainingCount = [int]$Matches[1]
        }

        Write-Host ""
        Write-Host "Batch $BatchCount Summary:" -ForegroundColor Cyan
        Write-Host "  [OK] Processed: $BatchProcessed products" -ForegroundColor Green
        if ($BatchSuccess -gt 0) {
            Write-Host "  [OK] Succeeded: $BatchSuccess" -ForegroundColor Green
        }
        if ($BatchFailed -gt 0) {
            Write-Host "  [WARN] Failed: $BatchFailed" -ForegroundColor Yellow
        }
        if ($RemainingCount -ge 0) {
            Write-Host "  >> Remaining: $RemainingCount products" -ForegroundColor Gray
        }

        $ElapsedTime = (Get-Date) - $StartTime
        $ElapsedMinutes = [math]::Round($ElapsedTime.TotalMinutes, 1)

        Write-Host ""
        Write-Host "Overall Progress:" -ForegroundColor Cyan
        Write-Host "  >> Total processed: $TotalProcessed products" -ForegroundColor Gray
        Write-Host "  >> Total succeeded: $TotalSuccess" -ForegroundColor Gray
        Write-Host "  >> Total failed: $TotalFailed" -ForegroundColor Gray
        Write-Host "  >> Time elapsed: $ElapsedMinutes minutes" -ForegroundColor Gray

        if ($TotalProcessed -gt 0 -and $ElapsedMinutes -gt 0) {
            $Rate = [math]::Round($TotalProcessed / $ElapsedMinutes, 1)
            Write-Host "  >> Processing rate: $Rate products/minute" -ForegroundColor Gray

            if ($RemainingCount -gt 0) {
                $EstimatedMinutes = [math]::Round($RemainingCount / $Rate, 1)
                Write-Host "  >> Estimated time remaining: $EstimatedMinutes minutes" -ForegroundColor Gray
            }
        }

        if ($RemainingCount -eq 0) {
            Write-Host ""
            Write-Host "[OK] All products have been analyzed!" -ForegroundColor Green
            break
        }

        if ($DelayBetweenBatches -gt 0) {
            Write-Host ""
            Write-Host "  Waiting $DelayBetweenBatches seconds before next batch..." -ForegroundColor Gray
            Start-Sleep -Seconds $DelayBetweenBatches
        }
    }

} catch {
    Write-Host ""
    Write-Host "[ERROR] Script failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host "BACKFILL COMPLETE" -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host ""

$EndTime = Get-Date
$TotalTime = ($EndTime - $StartTime)
$TotalMinutes = [math]::Round($TotalTime.TotalMinutes, 1)

Write-Host "Final Statistics:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  [OK] Total batches: $BatchCount" -ForegroundColor Green
Write-Host "  [OK] Total products processed: $TotalProcessed" -ForegroundColor Green
Write-Host "  [OK] Total succeeded: $TotalSuccess" -ForegroundColor Green
if ($TotalFailed -gt 0) {
    Write-Host "  [WARN] Total failed: $TotalFailed" -ForegroundColor Yellow
}
Write-Host "  [OK] Total time: $TotalMinutes minutes" -ForegroundColor Green

if ($TotalProcessed -gt 0) {
    $SuccessRate = [math]::Round(($TotalSuccess / $TotalProcessed) * 100, 1)
    $AvgRate = [math]::Round($TotalProcessed / $TotalMinutes, 1)

    Write-Host ""
    Write-Host "  >> Success rate: $SuccessRate%" -ForegroundColor Gray
    Write-Host "  >> Average rate: $AvgRate products/minute" -ForegroundColor Gray
}

$EstimatedCost = [math]::Round($TotalSuccess * 0.0015, 2)
Write-Host ""
Write-Host "  >> Estimated API cost: `$$EstimatedCost USD" -ForegroundColor Gray

Write-Host ""
Write-Host "[OK] Color backfill completed successfully!" -ForegroundColor Green
Write-Host ""
