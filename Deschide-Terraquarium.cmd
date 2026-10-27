@echo off
setlocal
cd /d "%~dp0"
set "TERRA_NODE=node"
where node >nul 2>nul
if errorlevel 1 set "TERRA_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
"%TERRA_NODE%" --version >nul 2>nul
if errorlevel 1 (
  echo Instaleaza Node.js 22 sau mai nou, apoi redeschide acest fisier.
  pause
  exit /b 1
)
powershell.exe -NoProfile -Command "try { $page = Invoke-WebRequest 'http://127.0.0.1:4173' -UseBasicParsing -TimeoutSec 2; if ($page.Content -notmatch 'Terraquarium') { throw 'Port ocupat' } } catch { Start-Process -FilePath $env:TERRA_NODE -ArgumentList 'scripts/dev-server.mjs' -WorkingDirectory (Get-Location).Path -WindowStyle Hidden; Start-Sleep -Seconds 2 }; try { $page = Invoke-WebRequest 'http://127.0.0.1:4173' -UseBasicParsing -TimeoutSec 3; if ($page.Content -notmatch 'Terraquarium') { throw 'Port ocupat' }; Start-Process 'http://127.0.0.1:4173' } catch { Write-Host 'Nu am putut porni jocul. Verifica daca portul 4173 este liber.'; exit 1 }"
if errorlevel 1 pause
