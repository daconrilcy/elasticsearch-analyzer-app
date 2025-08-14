@echo off
echo 🚀 Deploying Mapping Studio V2.2 to Production...
echo.

REM Vérification de l'environnement
if not exist ".env.production.local" (
    echo ⚠️  Warning: .env.production.local not found
    echo    Using default production values
    echo.
)

REM Nettoyage du dossier dist
if exist "dist" (
    echo 📁 Cleaning dist folder...
    rmdir /s /q dist
)

REM Build de production
echo 🔨 Building with TypeScript and Vite...
call npm run build

if %ERRORLEVEL% neq 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

REM Génération des métadonnées de build
echo 📊 Generating build metadata...
echo {> dist\build-info.json
echo   "version": "2.2.0",>> dist\build-info.json
echo   "buildDate": "%date% %time%",>> dist\build-info.json
echo   "environment": "production",>> dist\build-info.json
echo   "features": [>> dist\build-info.json
echo     "Anti-drift schema (ETag + cache + offline)",>> dist\build-info.json
echo     "Robustness (fallback offline, masking)",>> dist\build-info.json
echo     "UI Performance (virtualization, debounce, rate limiting)",>> dist\build-info.json
echo     "Modern UX (drag & drop, templates, shortcuts)",>> dist\build-info.json
echo     "Accessibility (ARIA, keyboard, responsive)">> dist\build-info.json
echo   ],>> dist\build-info.json
echo   "components": [>> dist\build-info.json
echo     "SchemaBanner",>> dist\build-info.json
echo     "DocsPreviewVirtualized",>> dist\build-info.json
echo     "PipelineDnD",>> dist\build-info.json
echo     "TemplatesMenu",>> dist\build-info.json
echo     "DiffView",>> dist\build-info.json
echo     "ToastsContainer",>> dist\build-info.json
echo     "ShortcutsHelp">> dist\build-info.json
echo   ],>> dist\build-info.json
echo   "hooks": [>> dist\build-info.json
echo     "useSchema",>> dist\build-info.json
echo     "useDebounce",>> dist\build-info.json
echo     "useAbortable",>> dist\build-info.json
echo     "useShortcuts",>> dist\build-info.json
echo     "useToasts">> dist\build-info.json
echo   ]>> dist\build-info.json
echo }>> dist\build-info.json

REM Génération du manifeste de production
echo 📋 Generating production manifest...
echo {> dist\manifest.json
echo   "name": "Mapping Studio V2.2",>> dist\manifest.json
echo   "version": "2.2.0",>> dist\manifest.json
echo   "description": "Modern Elasticsearch mapping management interface",>> dist\manifest.json
echo   "author": "Mapping Studio Team",>> dist\manifest.json
echo   "license": "MIT",>> dist\manifest.json
echo   "homepage": "/",>> dist\manifest.json
echo   "build": {>> dist\manifest.json
echo     "timestamp": "%date% %time%",>> dist\manifest.json
echo     "environment": "production">> dist\manifest.json
echo   }>> dist\manifest.json
echo }>> dist\manifest.json

REM Vérification des fichiers critiques
echo 🔍 Verifying critical files...
if exist "dist\index.html" (
    echo   ✅ index.html
) else (
    echo   ❌ index.html - MISSING
)

if exist "dist\assets\index-*.js" (
    echo   ✅ index-*.js
) else (
    echo   ❌ index-*.js - MISSING
)

if exist "dist\assets\index-*.css" (
    echo   ✅ index-*.css
) else (
    echo   ❌ index-*.css - MISSING
)

if exist "dist\build-info.json" (
    echo   ✅ build-info.json
) else (
    echo   ❌ build-info.json - MISSING
)

if exist "dist\manifest.json" (
    echo   ✅ manifest.json
) else (
    echo   ❌ manifest.json - MISSING
)

REM Calcul de la taille du bundle
echo 📏 Analyzing bundle size...
for /f "tokens=3" %%a in ('dir dist /s ^| find "File(s)"') do set totalSize=%%a
echo    Bundle size: %totalSize% bytes

echo.
echo 🎉 Production build completed successfully!
echo.
echo 📁 Output directory: dist\
echo 🚀 Ready for deployment
echo.
echo 📋 Next steps:
echo    1. Update VITE_API_BASE in your environment
echo    2. Configure your web server (nginx, Apache, etc.)
echo    3. Set up SSL certificates
echo    4. Configure CDN if needed
echo    5. Deploy to your hosting platform
echo.
echo 💡 For Docker deployment, use: docker-compose -f docker-compose.production.yml up -d
echo 💡 For manual deployment, copy the 'dist' folder to your web server
echo.
pause
