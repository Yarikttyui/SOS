[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ApiBaseUrl,

    [Parameter(Mandatory = $true)]
    [string]$WsBaseUrl,

    [ValidateSet('debug', 'release')]
    [string]$Variant = 'release',

    [string]$OutputName = 'sos-mobile-latest.apk',

    [string]$VersionName = '1.0',

    [int]$VersionCode = 1
)

$ErrorActionPreference = 'Stop'

function Write-Info($Message) {
    Write-Host "[publish-apk] $Message" -ForegroundColor Cyan
}

function Get-RootDirectory {
    $scriptPath = $MyInvocation.MyCommand.Path
    if (-not $scriptPath) {
        $invocation = (Get-Variable MyInvocation -Scope 1 -ErrorAction SilentlyContinue).Value
        if ($invocation -and $invocation.PSScriptRoot) {
            return $invocation.PSScriptRoot
        }
        Write-Info 'Fallback to current location for script root.'
        return (Get-Location).Path
    }
    return Split-Path -Parent $scriptPath
}

$rootDir = Get-RootDirectory
$phoneDir = Join-Path $rootDir 'Phone'
$backendDir = Join-Path $rootDir 'backend'
$downloadsDir = Join-Path $backendDir 'downloads'
$rootDownloadsDir = Join-Path $rootDir 'downloads'
$gradleWrapper = Join-Path $phoneDir 'gradlew.bat'

function Set-JavaEnvironment {
    if ($env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME 'bin\java.exe'))) {
        Write-Info "Using JAVA_HOME from environment: $env:JAVA_HOME"
        return
    }

    $embeddedJdkRoot = Join-Path $rootDir '.jdk'
    if (Test-Path $embeddedJdkRoot) {
        $jdkCandidates = Get-ChildItem -Path $embeddedJdkRoot -Directory | Where-Object {
            Test-Path (Join-Path $_.FullName 'bin\java.exe')
        } | Sort-Object Name -Descending

        if ($jdkCandidates) {
            $selectedJdk = $jdkCandidates | Select-Object -First 1
            $env:JAVA_HOME = $selectedJdk.FullName
            $env:PATH = "${env:JAVA_HOME}\bin;${env:PATH}"
            Write-Info "Configured JAVA_HOME to embedded JDK: $($selectedJdk.Name)"
            return
        }
    }

    throw 'Java JDK not found. Install JDK 11+ and set JAVA_HOME.'
}

Set-JavaEnvironment

if (-not (Test-Path $gradleWrapper)) {
    throw "Gradle wrapper not found at $gradleWrapper"
}

Write-Info "Building $Variant APK using $ApiBaseUrl"

$taskName = "assemble$([char]::ToUpper($Variant.Substring(0,1)))$($Variant.Substring(1))"
$gradleArgs = @(
    $taskName,
    "-PAPI_BASE_URL=$ApiBaseUrl",
    "-PWS_BASE_URL=$WsBaseUrl",
    "-PVERSION_NAME=$VersionName",
    "-PVERSION_CODE=$VersionCode"
)

$process = Start-Process -FilePath $gradleWrapper -WorkingDirectory $phoneDir -ArgumentList $gradleArgs -NoNewWindow -PassThru -Wait
if ($process.ExitCode -ne 0) {
    throw "Gradle build failed with exit code $($process.ExitCode)"
}

$apkOutputPath = Join-Path $phoneDir "app\build\outputs\apk\$Variant"
if (-not (Test-Path $apkOutputPath)) {
    throw "APK output directory not found: $apkOutputPath"
}

$latestApk = Get-ChildItem -Path $apkOutputPath -Filter '*.apk' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $latestApk) {
    throw "No APK files produced in $apkOutputPath"
}

foreach ($targetDir in @($downloadsDir, $rootDownloadsDir)) {
    if (-not (Test-Path $targetDir)) {
        Write-Info "Creating downloads directory at $targetDir"
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }

    $destinationApk = Join-Path $targetDir $OutputName
    Copy-Item -Path $latestApk.FullName -Destination $destinationApk -Force

    Write-Info "APK copied to $destinationApk"

    $hash = (Get-FileHash -Path $destinationApk -Algorithm SHA256).Hash
    $fileInfo = Get-Item $destinationApk
    $timestamp = (Get-Date).ToUniversalTime().ToString('o')

    $metadata = [ordered]@{
        versionName = $VersionName
        versionCode = $VersionCode
        variant = $Variant
        apiBaseUrl = $ApiBaseUrl
        wsBaseUrl = $WsBaseUrl
        fileName = $OutputName
        sizeBytes = $fileInfo.Length
        sha256 = $hash
        publishedAtUtc = $timestamp
    }

    $metadataPath = Join-Path $targetDir 'android-metadata.json'
    $metadata | ConvertTo-Json -Depth 5 | Set-Content -Path $metadataPath -Encoding UTF8

    Write-Info "Metadata saved to $metadataPath"
}
Write-Info 'Done'
