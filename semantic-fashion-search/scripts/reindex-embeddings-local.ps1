# Reindex all product embeddings locally - no Netlify required.
# Reads credentials from .env.local, hits Supabase and OpenAI directly.
#
# Usage (run from the semantic-fashion-search directory):
#   .\scripts\reindex-embeddings-local.ps1
#
# Optional flags:
#   -BatchSize 20      products per round (default: 20)
#   -StartOffset 0     resume a partial run from this row offset
#   -DryRun            count only, make no changes

param(
    [int]$BatchSize   = 20,
    [int]$StartOffset = 0,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# ── 1. Load credentials from .env.local ──────────────────────────────────────

$envPath = Join-Path (Join-Path $PSScriptRoot "..") ".env.local"
if (-not (Test-Path $envPath)) {
    Write-Host "ERROR: .env.local not found at $envPath" -ForegroundColor Red
    exit 1
}

$env_vars = @{}
Get-Content $envPath | ForEach-Object {
    if ($_ -match '^\s*([^#=][^=]*?)\s*=\s*(.*)\s*$') {
        $key = $Matches[1].Trim()
        $val = $Matches[2].Trim().Trim('"').Trim("'")
        $env_vars[$key] = $val
    }
}

# PS 5.1 does not have the ?? operator - use if/else
if ($env_vars['SUPABASE_URL']) {
    $SUPABASE_URL = $env_vars['SUPABASE_URL']
} else {
    $SUPABASE_URL = $env_vars['NEXT_PUBLIC_SUPABASE_URL']
}
$SUPABASE_KEY = $env_vars['SUPABASE_SERVICE_ROLE_KEY']
$OPENAI_KEY   = $env_vars['OPENAI_API_KEY']

if (-not $SUPABASE_URL) {
    Write-Host "ERROR: SUPABASE_URL not found in .env.local" -ForegroundColor Red; exit 1
}
if (-not $SUPABASE_KEY) {
    Write-Host "ERROR: SUPABASE_SERVICE_ROLE_KEY not found in .env.local" -ForegroundColor Red; exit 1
}
if (-not $OPENAI_KEY) {
    Write-Host "ERROR: OPENAI_API_KEY not found in .env.local" -ForegroundColor Red; exit 1
}

$supabaseHeaders = @{
    "apikey"        = $SUPABASE_KEY
    "Authorization" = "Bearer $SUPABASE_KEY"
    "Content-Type"  = "application/json"
}
$openaiHeaders = @{
    "Authorization" = "Bearer $OPENAI_KEY"
    "Content-Type"  = "application/json"
}

Write-Host ""
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host " LOCAL EMBEDDING REINDEX" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host " Supabase : $SUPABASE_URL"
Write-Host " Model    : text-embedding-3-small (OpenAI)"
Write-Host " Batch    : $BatchSize products per round"
Write-Host ""

# ── 2. Count total products ───────────────────────────────────────────────────

$countHeaders = $supabaseHeaders.Clone()
$countHeaders["Prefer"]     = "count=exact"
$countHeaders["Range-Unit"] = "items"
$countHeaders["Range"]      = "0-0"

$countResp = Invoke-WebRequest `
    -Uri "$SUPABASE_URL/rest/v1/products?select=id" `
    -Method GET `
    -Headers $countHeaders

$contentRange  = $countResp.Headers["Content-Range"]
$totalProducts = 0
if ($contentRange -match '/(\d+)') {
    $totalProducts = [int]$Matches[1]
}

Write-Host " Total products in database: $totalProducts"

if ($DryRun) {
    Write-Host ""
    Write-Host "Dry run - no changes made. Remove -DryRun to start." -ForegroundColor Yellow
    exit 0
}
if ($totalProducts -eq 0) {
    Write-Host "No products found." -ForegroundColor Yellow
    exit 0
}

$estimatedRounds = [math]::Ceiling(($totalProducts - $StartOffset) / $BatchSize)
Write-Host " Estimated rounds         : $estimatedRounds"
Write-Host ""

# ── 3. Reindex loop ───────────────────────────────────────────────────────────

$offset      = $StartOffset
$totalDone   = 0
$totalErrors = 0
$round       = 0
$startTime   = Get-Date

do {
    $round++

    # Fetch a batch of products
    $fetchUri = "$SUPABASE_URL/rest/v1/products?select=id,combined_text,title&order=created_at.asc&limit=$BatchSize&offset=$offset"
    $products = Invoke-RestMethod -Uri $fetchUri -Method GET -Headers $supabaseHeaders

    if (-not $products -or $products.Count -eq 0) { break }

    # Build texts array - fall back to title if combined_text is empty
    $texts = @()
    foreach ($p in $products) {
        $t = $p.combined_text
        if (-not $t -or $t.Trim() -eq '') { $t = $p.title }
        $texts += $t
    }

    # Generate embeddings for the whole batch in one OpenAI call
    $embeddingBody = ConvertTo-Json -Depth 3 @{
        model = "text-embedding-3-small"
        input = $texts
    }

    try {
        $embResp   = Invoke-RestMethod `
            -Uri "https://api.openai.com/v1/embeddings" `
            -Method POST `
            -Headers $openaiHeaders `
            -Body $embeddingBody

        $embeddings = $embResp.data | Sort-Object { $_.index } | ForEach-Object { $_.embedding }
    } catch {
        Write-Host "  ERROR calling OpenAI at offset $offset : $_" -ForegroundColor Red
        Write-Host "  Resume from here with: -StartOffset $offset" -ForegroundColor Yellow
        break
    }

    # Update each product in Supabase
    $batchDone   = 0
    $batchErrors = 0

    for ($i = 0; $i -lt $products.Count; $i++) {
        $productId = $products[$i].id
        $embedding = $embeddings[$i]

        # Format as PostgreSQL vector literal: [0.1,0.2,...]
        $vectorStr   = "[" + ($embedding -join ",") + "]"
        $updateBody  = ConvertTo-Json @{ embedding = $vectorStr }

        $patchHeaders = $supabaseHeaders.Clone()
        $patchHeaders["Prefer"] = "return=minimal"

        try {
            Invoke-RestMethod `
                -Uri "$SUPABASE_URL/rest/v1/products?id=eq.$productId" `
                -Method PATCH `
                -Headers $patchHeaders `
                -Body $updateBody | Out-Null
            $batchDone++
        } catch {
            Write-Host "  ERROR updating product $productId : $_" -ForegroundColor Yellow
            $batchErrors++
        }
    }

    $totalDone   += $batchDone
    $totalErrors += $batchErrors
    $elapsed      = [math]::Round(((Get-Date) - $startTime).TotalSeconds)
    $pct          = [math]::Round(($offset + $products.Count) / $totalProducts * 100)

    Write-Host "Round $round | offset $offset | $batchDone updated, $batchErrors errors | $pct% | ${elapsed}s"

    $offset += $products.Count

} while ($products.Count -eq $BatchSize)

# ── 4. Summary ────────────────────────────────────────────────────────────────

$totalElapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds)
Write-Host ""
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host " Done!" -ForegroundColor Green
Write-Host " Updated : $totalDone products"
Write-Host " Errors  : $totalErrors"
Write-Host " Time    : ${totalElapsed}s"
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host ""
if ($totalErrors -gt 0) {
    Write-Host "Some updates failed. Run again to retry -" -ForegroundColor Yellow
    Write-Host "already-updated products will simply be re-written." -ForegroundColor Yellow
}
