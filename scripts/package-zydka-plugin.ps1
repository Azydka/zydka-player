param(
    [ValidateSet("player", "manager")]
    [string]$Plugin = "player"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..")

# player: built from TypeScript, only the runtime files are shipped.
# manager: imported as-is from production, every file is shipped.
$pluginConfigs = @{
    player  = @{
        Source       = "apps\zydka-plugin"
        Slug         = "zydka-player"
        BuildFilter  = "@zydka/zydka-plugin"
        RuntimeFiles = @(
            "zydka-player.php",
            "README.md",
            "assets\css\zydka-player.css",
            "assets\img\zydka-original.png",
            "assets\js\zydka-player.js"
        )
    }
    manager = @{
        Source       = "apps\zydka-player-manager"
        Slug         = "zydka-player-manager"
        BuildFilter  = $null
        RuntimeFiles = $null
    }
}

$config = $pluginConfigs[$Plugin]
$pluginSource = Join-Path $repoRoot $config.Source
$slug = $config.Slug
$distDir = Join-Path $repoRoot "dist"
$stageRoot = Join-Path $distDir $slug
$zipPath = Join-Path $distDir "$slug.zip"

function Assert-ChildPath {
    param(
        [Parameter(Mandatory = $true)][string]$Parent,
        [Parameter(Mandatory = $true)][string]$Child
    )

    $parentFull = [System.IO.Path]::GetFullPath($Parent).TrimEnd('\') + '\'
    $childFull = [System.IO.Path]::GetFullPath($Child)

    if (-not $childFull.StartsWith($parentFull, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to operate outside repository: $childFull"
    }
}

function Copy-RuntimeFile {
    param(
        [Parameter(Mandatory = $true)][string]$RelativePath
    )

    $source = Join-Path $pluginSource $RelativePath
    $destination = Join-Path $stageRoot $RelativePath
    $destinationDir = Split-Path -Parent $destination

    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
        throw "Missing runtime file: $source"
    }

    New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
    Copy-Item -LiteralPath $source -Destination $destination -Force
}

if ($config.BuildFilter) {
    $pnpm = Get-Command pnpm.cmd -ErrorAction Stop
    & $pnpm.Source --filter $config.BuildFilter build
}

$runtimeFiles = $config.RuntimeFiles

if (-not $runtimeFiles) {
    $sourceFull = [System.IO.Path]::GetFullPath($pluginSource).TrimEnd('\') + '\'
    $runtimeFiles = @(
        Get-ChildItem -LiteralPath $pluginSource -Recurse -File -Force |
            Sort-Object FullName |
            ForEach-Object { $_.FullName.Substring($sourceFull.Length) }
    )
}

if ($runtimeFiles.Count -eq 0) {
    throw "No runtime files found in $pluginSource"
}

Assert-ChildPath -Parent $repoRoot -Child $distDir
Assert-ChildPath -Parent $repoRoot -Child $stageRoot
Assert-ChildPath -Parent $repoRoot -Child $zipPath

if (-not (Test-Path -LiteralPath $distDir)) {
    New-Item -ItemType Directory -Path $distDir | Out-Null
}

if (Test-Path -LiteralPath $stageRoot) {
    Remove-Item -LiteralPath $stageRoot -Recurse -Force
}

if (Test-Path -LiteralPath $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
}

New-Item -ItemType Directory -Path $stageRoot | Out-Null

foreach ($runtimeFile in $runtimeFiles) {
    Copy-RuntimeFile $runtimeFile
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)

try {
    [void]$archive.CreateEntry("$slug/")

    foreach ($runtimeFile in $runtimeFiles) {
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
            $archive,
            (Join-Path $stageRoot $runtimeFile),
            "$slug/" + $runtimeFile.Replace("\", "/"),
            [System.IO.Compression.CompressionLevel]::Optimal
        ) | Out-Null
    }
}
finally {
    $archive.Dispose()
}

$archive = [System.IO.Compression.ZipFile]::OpenRead($zipPath)

try {
    $entries = @($archive.Entries | ForEach-Object { $_.FullName.Replace("\", "/") })
    $requiredEntries = @("$slug/") + @($runtimeFiles | ForEach-Object { "$slug/" + $_.Replace("\", "/") })

    foreach ($entry in $requiredEntries) {
        if ($entries -notcontains $entry) {
            throw "ZIP is missing required entry: $entry"
        }
    }

    if ($entries.Count -ne $requiredEntries.Count) {
        throw "ZIP contains $($entries.Count) entries, expected $($requiredEntries.Count)"
    }

    $forbiddenPatterns = @(
        "apps/",
        "dist/",
        "$slug/$slug/",
        "node_modules/",
        "src/",
        "package.json",
        "tsconfig.json",
        "tsup.config.ts"
    )

    foreach ($pattern in $forbiddenPatterns) {
        $match = $entries | Where-Object { $_.Contains($pattern) } | Select-Object -First 1

        if ($match) {
            throw "ZIP contains forbidden entry matching '$pattern': $match"
        }
    }
}
finally {
    $archive.Dispose()
}

Write-Host "Created WordPress plugin ZIP:"
Write-Host $zipPath
