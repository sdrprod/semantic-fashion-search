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

# ── 2. Verify connection with a quick 1-row fetch ────────────────────────────

$testResp = Invoke-RestMethod `
    -Uri "$SUPABASE_URL/rest/v1/products?select=id&limit=1" `
    -Method GET `
    -Headers $supabaseHeaders

if ($null -eq $testResp) {
    Write-Host "ERROR: Could not reach Supabase products table." -ForegroundColor Red
    exit 1
}

Write-Host " Supabase connection OK"

if ($DryRun) {
    Write-Host ""
    Write-Host "Dry run - no changes made. Remove -DryRun to start." -ForegroundColor Yellow
    exit 0
}

Write-Host " Starting at offset       : $StartOffset"
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

    # Build texts array - fall back to title if combined_text is empty.
    # Sanitize: remove control characters that break OpenAI JSON parsing.
    $texts = @()
    foreach ($p in $products) {
        $t = $p.combined_text
        if (-not $t -or $t.Trim() -eq '') { $t = $p.title }
        if (-not $t) { $t = 'fashion product' }
        # Strip control characters (null bytes, tabs that aren't spaces, etc.)
        $t = $t -replace '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', ' '
        $t = $t.Trim()
        if ($t.Length -gt 2000) { $t = $t.Substring(0, 2000) }
        $texts += $t
    }

    # Helper: call OpenAI embeddings for a single array of texts.
    # Returns the sorted data array, or $null on failure.
    function Invoke-OpenAIEmbeddings($inputTexts) {
        try {
            $body = ConvertTo-Json -Depth 4 @{
                model = "text-embedding-3-small"
                input = $inputTexts
            }
            $resp = Invoke-RestMethod `
                -Uri "https://api.openai.com/v1/embeddings" `
                -Method POST `
                -Headers $openaiHeaders `
                -Body $body
            return @($resp.data | Sort-Object { [int]$_.index })
        } catch {
            return $null
        }
    }

    # Helper: sanitize a text string progressively more aggressively.
    # Returns an array of fallback texts to try in order.
    function Get-TextFallbacks($raw, $titleFallback) {
        # Level 1: strip control chars (already done, but redo cleanly here)
        $l1 = ($raw -replace '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', ' ').Trim()
        if ($l1.Length -gt 2000) { $l1 = $l1.Substring(0, 2000) }

        # Level 2: strip all non-printable-ASCII (catches Unicode surrogates,
        # stray emoji bytes, and other characters PS 5.1 serializes badly)
        $l2 = ($l1 -replace '[^\x20-\x7E]', ' ').Trim()
        $l2 = ($l2 -replace '\s+', ' ').Trim()

        # Level 3: just the product title
        $l3 = if ($titleFallback) { ($titleFallback -replace '[^\x20-\x7E]', ' ').Trim() } else { '' }

        # Level 4: generic placeholder
        $l4 = 'fashion clothing product'

        return @($l1, $l2, $l3, $l4) | Where-Object { $_ -and $_.Trim() -ne '' }
    }

    # Try batch call first (fastest path)
    $embeddingData = Invoke-OpenAIEmbeddings $texts

    if (-not $embeddingData) {
        # Batch failed - fall back to one product at a time so bad text
        # doesn't block the whole batch. Try progressively simpler text.
        Write-Host "  Batch failed at offset $offset - switching to per-product mode..." -ForegroundColor Yellow
        $embeddingData = @()
        for ($j = 0; $j -lt $products.Count; $j++) {
            $fallbacks = Get-TextFallbacks $texts[$j] $products[$j].title
            $singleData = $null
            foreach ($attempt in $fallbacks) {
                $singleData = Invoke-OpenAIEmbeddings @($attempt)
                if ($singleData) { break }
            }
            if ($singleData) {
                $embeddingData += $singleData[0]
            } else {
                Write-Host "  SKIP product $($products[$j].id) - all text variants failed" -ForegroundColor Red
                $embeddingData += $null
            }
        }
    }

    # Update each product in Supabase
    $batchDone   = 0
    $batchErrors = 0

    for ($i = 0; $i -lt $products.Count; $i++) {
        $productId = $products[$i].id

        # Skip products where all text fallbacks failed
        if ($null -eq $embeddingData[$i]) {
            $batchErrors++
            continue
        }

        # Access the embedding array by index - avoids the pipeline unroll bug
        $vec = $embeddingData[$i].embedding

        # Format as PostgreSQL vector literal: [f1,f2,...,f1536]
        $vectorStr  = "[" + ($vec -join ",") + "]"
        $updateBody = ConvertTo-Json @{ embedding = $vectorStr }

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
    $nextOffset   = $offset + $products.Count

    Write-Host "Round $round | rows $offset-$($nextOffset - 1) | $batchDone updated, $batchErrors errors | ${elapsed}s elapsed"

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
