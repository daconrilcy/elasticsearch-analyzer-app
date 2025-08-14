# 🧹 Script de Nettoyage Python - Elasticsearch Analyzer App
# Supprime tous les fichiers temporaires Python du projet

param(
    [string]$Path = ".",
    [switch]$DryRun,
    [switch]$Verbose,
    [switch]$Force
)

# Fonction pour formater la taille
function Format-Size {
    param([long]$SizeBytes)
    
    if ($SizeBytes -eq 0) { return "0 B" }
    
    $sizeNames = @("B", "KB", "MB", "GB")
    $i = 0
    while ($SizeBytes -ge 1024 -and $i -lt $sizeNames.Length - 1) {
        $SizeBytes = $SizeBytes / 1024.0
        $i++
    }
    
    return "{0:N1} {1}" -f $SizeBytes, $sizeNames[$i]
}

# Fonction pour calculer la taille des dossiers
function Get-DirectorySize {
    param([string]$Path)
    
    try {
        $size = (Get-ChildItem -Path $Path -Recurse -File | Measure-Object -Property Length -Sum).Sum
        return if ($size) { $size } else { 0 }
    }
    catch {
        return 0
    }
}

# Fonction principale de nettoyage
function Cleanup-PythonCache {
    param(
        [string]$RootDir,
        [bool]$DryRun = $true,
        [bool]$Verbose = $false
    )
    
    Write-Host "🧹 Nettoyage des fichiers temporaires Python dans : $RootDir" -ForegroundColor Cyan
    Write-Host ("=" * 60) -ForegroundColor Gray
    
    # Patterns de fichiers à supprimer
    $patterns = @(
        "**/__pycache__",
        "**/*.pyc",
        "**/*.pyo",
        "**/.pytest_cache",
        "**/*.egg-info",
        "**/.coverage",
        "**/htmlcov",
        "**/.mypy_cache",
        "**/.ruff_cache",
        "**/.pylint.d",
        "**/*.log",
        "**/.DS_Store",
        "**/Thumbs.db"
    )
    
    $filesToRemove = @()
    $dirsToRemove = @()
    
    # Trouver les fichiers et dossiers
    foreach ($pattern in $patterns) {
        $matches = Get-ChildItem -Path $RootDir -Recurse -Name $pattern -ErrorAction SilentlyContinue
        foreach ($match in $matches) {
            $fullPath = Join-Path $RootDir $match
            if (Test-Path $fullPath) {
                if ((Get-Item $fullPath) -is [System.IO.DirectoryInfo]) {
                    $dirsToRemove += $fullPath
                } else {
                    $filesToRemove += $fullPath
                }
            }
        }
    }
    
    if ($filesToRemove.Count -eq 0 -and $dirsToRemove.Count -eq 0) {
        Write-Host "✅ Aucun fichier temporaire trouvé !" -ForegroundColor Green
        return
    }
    
    # Calculer la taille totale
    $totalSize = 0
    foreach ($file in $filesToRemove) {
        try {
            $totalSize += (Get-Item $file).Length
        }
        catch {
            # Ignorer les erreurs
        }
    }
    
    foreach ($dir in $dirsToRemove) {
        $totalSize += Get-DirectorySize $dir
    }
    
    Write-Host "📊 Fichiers à supprimer : $($filesToRemove.Count)" -ForegroundColor Yellow
    Write-Host "📁 Dossiers à supprimer : $($dirsToRemove.Count)" -ForegroundColor Yellow
    Write-Host "💾 Espace à libérer : $(Format-Size $totalSize)" -ForegroundColor Yellow
    Write-Host ""
    
    if ($DryRun) {
        Write-Host "🔍 Mode simulation - Aucun fichier ne sera supprimé" -ForegroundColor Blue
        Write-Host ""
        
        if ($Verbose) {
            Write-Host "📋 Fichiers qui seraient supprimés :" -ForegroundColor Gray
            foreach ($file in ($filesToRemove | Sort-Object)) {
                Write-Host "  📄 $file" -ForegroundColor Gray
            }
            
            Write-Host "`n📋 Dossiers qui seraient supprimés :" -ForegroundColor Gray
            foreach ($dir in ($dirsToRemove | Sort-Object)) {
                Write-Host "  📁 $dir" -ForegroundColor Gray
            }
        }
        
        return
    }
    
    # Demander confirmation
    $response = Read-Host "❓ Continuer la suppression ? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "❌ Opération annulée" -ForegroundColor Red
        return
    }
    
    # Supprimer les fichiers
    $removedFiles = 0
    $removedDirs = 0
    $errors = 0
    
    Write-Host "`n🗑️  Suppression en cours..." -ForegroundColor Red
    
    # Supprimer les fichiers
    foreach ($file in $filesToRemove) {
        try {
            Remove-Item $file -Force
            $removedFiles++
            if ($Verbose) {
                Write-Host "  ✅ Supprimé : $file" -ForegroundColor Green
            }
        }
        catch {
            $errors++
            if ($Verbose) {
                Write-Host "  ❌ Erreur : $file - $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
    
    # Supprimer les dossiers
    foreach ($dir in $dirsToRemove) {
        try {
            Remove-Item $dir -Recurse -Force
            $removedDirs++
            if ($Verbose) {
                Write-Host "  ✅ Supprimé : $dir" -ForegroundColor Green
            }
        }
        catch {
            $errors++
            if ($Verbose) {
                Write-Host "  ❌ Erreur : $dir - $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
    
    # Résumé
    Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
    Write-Host "📊 RÉSUMÉ DU NETTOYAGE" -ForegroundColor Cyan
    Write-Host ("=" * 60) -ForegroundColor Gray
    Write-Host "✅ Fichiers supprimés : $removedFiles" -ForegroundColor Green
    Write-Host "✅ Dossiers supprimés : $removedDirs" -ForegroundColor Green
    Write-Host "❌ Erreurs : $errors" -ForegroundColor Red
    Write-Host "💾 Espace libéré : $(Format-Size $totalSize)" -ForegroundColor Green
    
    if ($errors -gt 0) {
        Write-Host "`n⚠️  $errors erreur(s) lors de la suppression" -ForegroundColor Yellow
        Write-Host "   Certains fichiers peuvent être verrouillés ou protégés" -ForegroundColor Yellow
    }
}

# Vérifier que le dossier existe
if (-not (Test-Path $Path)) {
    Write-Host "❌ Erreur : Le dossier '$Path' n'existe pas" -ForegroundColor Red
    exit 1
}

# Mode dry-run par défaut pour la sécurité
if (-not $DryRun -and -not $Force) {
    Write-Host "🔒 Mode simulation activé par défaut pour la sécurité" -ForegroundColor Yellow
    Write-Host "   Utilisez -Force pour une suppression réelle" -ForegroundColor Yellow
    $DryRun = $true
}

try {
    Cleanup-PythonCache -RootDir $Path -DryRun $DryRun -Verbose $Verbose
}
catch {
    Write-Host "`n❌ Erreur inattendue : $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
