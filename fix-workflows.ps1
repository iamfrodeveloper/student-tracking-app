# PowerShell script to fix GitHub workflow paths
# This script removes the 'student-tracking-app/' prefix from paths in workflow files

$workflowFiles = Get-ChildItem -Path ".github/workflows" -Filter "*.yml"

foreach ($file in $workflowFiles) {
    Write-Host "Fixing $($file.Name)..."
    
    $content = Get-Content $file.FullName -Raw
    
    # Fix cache-dependency-path
    $content = $content -replace "cache-dependency-path: 'student-tracking-app/package-lock.json'", "cache-dependency-path: 'package-lock.json'"
    
    # Fix working-directory paths
    $content = $content -replace "working-directory: \./student-tracking-app", "working-directory: ."
    
    # Fix hashFiles paths
    $content = $content -replace "hashFiles\('student-tracking-app/package-lock.json'\)", "hashFiles('package-lock.json')"
    
    # Fix cache paths
    $content = $content -replace "student-tracking-app/node_modules", "node_modules"
    $content = $content -replace "student-tracking-app/\.next/", ".next/"
    $content = $content -replace "student-tracking-app/out/", "out/"
    $content = $content -replace "student-tracking-app/\.next/analyze/", ".next/analyze/"
    
    Set-Content -Path $file.FullName -Value $content -NoNewline
    Write-Host "Fixed $($file.Name)"
}

Write-Host "All workflow files have been fixed!"
