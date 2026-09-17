# ============================================================
# SIS-MALI — Script de demarrage local (Windows)
# ============================================================
# Usage : .\start.ps1

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  SIS-MALI — Demarrage" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verifier Docker
Write-Host "[1/5] Verification de Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>$null
    if (-not $dockerVersion) { throw "Docker non installe" }
    Write-Host "      $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "      ERREUR : Docker n est pas installe ou n est pas dans le PATH" -ForegroundColor Red
    Write-Host "      Installez Docker Desktop depuis https://www.docker.com/products/docker-desktop/" -ForegroundColor Red
    exit 1
}

# 2. Verifier .env
Write-Host "[2/5] Verification du fichier .env..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "      .env cree depuis .env.example" -ForegroundColor Green
    } else {
        Write-Host "      ERREUR : .env.example introuvable" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "      .env existe" -ForegroundColor Green
}

# 3. Demarrer Docker Compose
Write-Host "[3/5] Demarrage des conteneurs..." -ForegroundColor Yellow
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "      ERREUR : docker compose a echoue" -ForegroundColor Red
    exit 1
}
Write-Host "      Conteneurs demarres" -ForegroundColor Green

# 4. Attendre PostgreSQL
Write-Host "[4/5] Attente de PostgreSQL (15 secondes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15
Write-Host "      OK" -ForegroundColor Green

# 5. Appliquer les migrations et seed
Write-Host "[5/5] Initialisation de la base..." -ForegroundColor Yellow
docker compose exec -T api npx prisma migrate deploy
docker compose exec -T api npm run prisma:seed
Write-Host "      Base initialisee" -ForegroundColor Green

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "  SIS-MALI est pret !" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Acces :" -ForegroundColor Cyan
Write-Host "  Interface Web : http://localhost" -ForegroundColor White
Write-Host "  API REST      : http://localhost/api/v1" -ForegroundColor White
Write-Host "  Swagger       : http://localhost/api/docs" -ForegroundColor White
Write-Host ""
Write-Host "Connexion :" -ForegroundColor Cyan
Write-Host "  Email    : admin@sis-mali.local" -ForegroundColor White
Write-Host "  Password : Admin@2026!" -ForegroundColor White
Write-Host ""
