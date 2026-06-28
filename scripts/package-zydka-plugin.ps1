$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..")
$pluginSource = Join-Path $repoRoot "apps\zydka-plugin"
$distDir = Join-Path $repoRoot "dist"
$stageRoot = Join-Path $distDir "zydka-player"
$zipPath = Join-Path $distDir "zydka-player.zip"

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

$pnpm = Get-Command pnpm.cmd -ErrorAction Stop
& $pnpm.Source --filter @zydka/zydka-plugin build

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

Copy-RuntimeFile "zydka-player.php"
Copy-RuntimeFile "README.md"
Copy-RuntimeFile "assets\css\zydka-player.css"
Copy-RuntimeFile "assets\js\zydka-player.js"

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)

try {
    [void]$archive.CreateEntry("zydka-player/")

    $runtimeEntries = @(
        @{ Source = Join-Path $stageRoot "zydka-player.php"; Entry = "zydka-player/zydka-player.php" },
        @{ Source = Join-Path $stageRoot "README.md"; Entry = "zydka-player/README.md" },
        @{ Source = Join-Path $stageRoot "assets\css\zydka-player.css"; Entry = "zydka-player/assets/css/zydka-player.css" },
        @{ Source = Join-Path $stageRoot "assets\js\zydka-player.js"; Entry = "zydka-player/assets/js/zydka-player.js" }
    )

    foreach ($runtimeEntry in $runtimeEntries) {
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
            $archive,
            $runtimeEntry.Source,
            $runtimeEntry.Entry,
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
    $requiredEntries = @(
        "zydka-player/",
        "zydka-player/zydka-player.php",
        "zydka-player/README.md",
        "zydka-player/assets/css/zydka-player.css",
        "zydka-player/assets/js/zydka-player.js"
    )

    foreach ($entry in $requiredEntries) {
        if ($entries -notcontains $entry) {
            throw "ZIP is missing required entry: $entry"
        }
    }

    $forbiddenPatterns = @(
        "apps/zydka-plugin/",
        "dist/",
        "zydka-player/zydka-player/",
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
