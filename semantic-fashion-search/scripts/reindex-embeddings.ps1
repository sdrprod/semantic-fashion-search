# Reindex all product embeddings using the current OpenAI model.
#
# Run this whenever the embedding model changes — stale embeddings from a
# different model produce ~0.01 cosine similarity and the search threshold
# filters everything out, giving empty results.
#
# Usage:
#   .\scripts\reindex-embeddings.ps1 -SiteUrl "https://your-site.netlify.app" -AdminSecret "your-secret"
#
# Optional:
#   -BatchSize 50    (default: 50, max recommended: 50 to stay under Netlify timeout)
#   -StartOffset 0   (resume a partial run by setting the offset where it stopped)
#   -DryRun          (count products only, don't generate any embeddings)

param(
    [Parameter(Mandatory=$true)]
    [string]$SiteUrl,

    [Parameter(Mandatory=$true)]
    [string]$AdminSecret,

    [int]$BatchSize = 50,
    [int]$StartOffset = 0,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$headers = @{
    "Content-Type"  = "application/json"
    "x-admin-secret" = $AdminSecret
}
$endpoint = "$SiteUrl/api/admin/generate-embeddings"

# --- Step 1: Count ---
Write-Host ""
Write-Host "Checking product catalog..." -ForegroundColor Cyan
$countBody = @{ action = "count"; force = $true } | ConvertTo-Json
$countResult = Invoke-RestMethod -Uri $endpoint -Method POST -Headers $headers -Body $countBody
Write-Host "  Total products : $($countResult.totalProducts)"
Write-Host "  Mode           : $($countResult.mode)"
Write-Host ""

if ($DryRun) {
    Write-Host "Dry run complete. Remove -DryRun to start re-indexing." -ForegroundColor Yellow
    exit 0
}

if ($countResult.totalProducts -eq 0) {
    Write-Host "No products found in the database." -ForegroundColor Yellow
    exit 0
}

# --- Step 2: Re-index in batches ---
$offset      = $StartOffset
$totalDone   = 0
$totalErrors = 0
$batchNum    = 0
$startTime   = Get-Date

Write-Host "Starting re-index (batch size: $BatchSize, starting at offset: $StartOffset)" -ForegroundColor Green
Write-Host "-------------------------------------------------------"

do {
    $batchNum++
    $body = @{
        action    = "generate"
        force     = $true
        batchSize = $BatchSize
        offset    = $offset
    } | ConvertTo-Json

    try {
        $result = Invoke-RestMethod -Uri $endpoint -Method POST -Headers $headers -Body $body

        $totalDone   += $result.generated
        $totalErrors += $result.errors
        $elapsed      = [math]::Round(((Get-Date) - $startTime).TotalSeconds)
        $pct          = if ($countResult.totalProducts -gt 0) {
                            [math]::Round(($offset + $result.processed) / $countResult.totalProducts * 100)
                        } else { 0 }

        Write-Host "Batch $batchNum | offset $offset | $($result.generated) updated, $($result.errors) errors | $pct% complete | ${elapsed}s elapsed"

        if ($result.errors -gt 0) {
            Write-Host "  WARNING: $($result.errors) error(s) in this batch" -ForegroundColor Yellow
        }

        $offset = $result.nextOffset

    } catch {
        Write-Host "ERROR on batch $batchNum (offset $offset): $_" -ForegroundColor Red
        Write-Host "To resume from this point, re-run with: -StartOffset $offset" -ForegroundColor Yellow
        break
    }

} while ($null -ne $offset)

# --- Summary ---
$totalElapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds)
Write-Host "-------------------------------------------------------"
Write-Host ""
Write-Host "Re-index complete!" -ForegroundColor Green
Write-Host "  Updated : $totalDone products"
Write-Host "  Errors  : $totalErrors"
Write-Host "  Time    : ${totalElapsed}s"
Write-Host ""
if ($totalErrors -gt 0) {
    Write-Host "Some products had errors. Run again with -StartOffset 0 to retry all," -ForegroundColor Yellow
    Write-Host "or check the Netlify function log for details." -ForegroundColor Yellow
}
