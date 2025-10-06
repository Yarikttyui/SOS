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
        throw 'Unable to determine script path. Run the script from file system context.'
    }
    return Split-Path -Parent $scriptPath
}

$rootDir = Get-RootDirectory
$phoneDir = Join-Path $rootDir 'Phone'
$backendDir = Join-Path $rootDir 'backend'
$downloadsDir = Join-Path $backendDir 'downloads'
$gradleWrapper = Join-Path $phoneDir 'gradlew.bat'

if (-not (Test-Path $gradleWrapper)) {
    throw "Gradle wrapper not found at $gradleWrapper"
}

Write-Info "Building $Variant APK using $ApiBaseUrl"

$taskName = "assemble$([char]::ToUpper($Variant.Substring(0,1)))$($Variant.Substring(1))"
$gradleArgs = @($taskName, "-PAPI_BASE_URL=$ApiBaseUrl", "-PWS_BASE_URL=$WsBaseUrl")

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

if (-not (Test-Path $downloadsDir)) {
    Write-Info "Creating backend downloads directory at $downloadsDir"
    New-Item -ItemType Directory -Path $downloadsDir -Force | Out-Null
}

$destinationApk = Join-Path $downloadsDir $OutputName
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

$metadataPath = Join-Path $downloadsDir 'android-metadata.json'
$metadata | ConvertTo-Json -Depth 5 | Set-Content -Path $metadataPath -Encoding UTF8

Write-Info "Metadata saved to $metadataPath"
Write-Info 'Done'
