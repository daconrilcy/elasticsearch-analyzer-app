@echo off
echo 🚀 Configuration de l'environnement de développement...
echo.

REM Vérifier si .env existe déjà
if exist .env (
    echo ⚠️  Le fichier .env existe déjà
    echo.
    echo Contenu actuel :
    type .env
    echo.
    set /p choice="Voulez-vous le remplacer ? (y/N): "
    if /i "%choice%"=="y" (
        echo ✅ Remplacement du fichier .env...
    ) else (
        echo ❌ Opération annulée
        pause
        exit /b 0
    )
)

echo.
echo 📝 Création du fichier .env pour le développement...
echo.

REM Créer le fichier .env
(
echo # Development Environment Variables for Mapping Studio V2.2
echo # This file should not be committed to version control
echo.
echo # API Configuration ^(REQUIRED^)
echo VITE_API_BASE=http://localhost:8000
echo.
echo # Authentication ^(Optional^)
echo VITE_AUTH_TOKEN=
echo.
echo # Feature Flags
echo VITE_ENABLE_OFFLINE_MODE=true
echo VITE_ENABLE_METRICS=true
echo VITE_ENABLE_ANALYTICS=false
echo.
echo # Performance Settings
echo VITE_DEBOUNCE_DELAY=500
echo VITE_RATE_LIMIT_REQUESTS=5
echo VITE_RATE_LIMIT_WINDOW=1000
echo.
echo # Cache Settings
echo VITE_CACHE_TTL=300000
echo VITE_OFFLINE_CACHE_SIZE=50
echo.
echo # Build Information
echo VITE_APP_VERSION=2.2.0
echo VITE_BUILD_DATE=%date%
echo VITE_ENVIRONMENT=development
) > .env

echo ✅ Fichier .env créé avec succès !
echo.
echo 📋 Contenu du fichier :
echo.
type .env
echo.
echo 🚀 Vous pouvez maintenant démarrer l'application avec : npm run dev
echo.
pause
