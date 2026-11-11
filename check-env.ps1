<#
  Aralytics environment check.

  Run it directly:
      powershell -NoProfile -ExecutionPolicy Bypass -File .\check-env.ps1

  Or double-click run-app.bat, which calls this script with the same policy bypass.
  Requirements: Java 17+, Node.js 20+, and MySQL (XAMPP) on port 3306 or 3307.
#>

$root = $PSScriptRoot

function Fail($message) {
    Write-Host ""
    Write-Host "  $message" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "Aralytics environment check" -ForegroundColor Cyan
Write-Host "----------------------------"

# 1. Java 17+
$java = Get-Command java -ErrorAction SilentlyContinue
if (-not $java) {
    Fail "Java 17+ is required. Please install it."
}
$javaOutput = (& java -version 2>&1 | Out-String)
if ($javaOutput -notmatch 'version "(\d+)(?:\.(\d+))?') {
    Fail "Java 17+ is required. Please install it."
}
$javaMajor = [int]$Matches[1]
if ($javaMajor -eq 1 -and $Matches[2]) {
    $javaMajor = [int]$Matches[2]
}
if ($javaMajor -lt 17) {
    Fail "Java 17+ is required. Please install it."
}
Write-Host "[OK] Java $javaMajor" -ForegroundColor Green
if ($javaMajor -ge 24) {
    Write-Host "[!] Java $javaMajor detected. Spring Boot 3.4 may need a JDK 17-21; set JAVA_HOME to one if startup fails." -ForegroundColor Yellow
}

# 2. Node.js
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Fail "Node.js is required. Please install Node.js 20+."
}
Write-Host "[OK] Node $(& node -v)" -ForegroundColor Green

# 3. Frontend dependencies
$frontend = Join-Path $root "frontend"
if (-not (Test-Path (Join-Path $frontend "node_modules"))) {
    Write-Host "[..] frontend/node_modules is missing, running npm install..." -ForegroundColor Yellow
    Push-Location $frontend
    try {
        & npm install
    } finally {
        Pop-Location
    }
    if ($LASTEXITCODE -ne 0) {
        Fail "npm install failed. Check the output above."
    }
    Write-Host "[OK] Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "[OK] Frontend dependencies present" -ForegroundColor Green
}

# 4. MySQL on 3307 (preferred) or 3306
$dbPort = $null
foreach ($port in 3307, 3306) {
    if (Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue) {
        $dbPort = $port
        break
    }
}
if (-not $dbPort) {
    Write-Host "[!] MySQL/XAMPP does not appear to be running on port 3306 or 3307. Please start your database before continuing." -ForegroundColor Yellow
} else {
    Write-Host "[OK] MySQL reachable on port $dbPort" -ForegroundColor Green

    $yml = Join-Path $root "backend\src\main\resources\application-dev.yml"
    if (Test-Path $yml) {
        $text = Get-Content -Raw $yml
        $updated = [regex]::Replace($text, "jdbc:mysql://localhost:\d+", "jdbc:mysql://localhost:$dbPort")
        if ($updated -ne $text) {
            [System.IO.File]::WriteAllText($yml, $updated)
            Write-Host "[OK] application-dev.yml datasource port set to $dbPort" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "Environment looks good." -ForegroundColor Green
exit 0
