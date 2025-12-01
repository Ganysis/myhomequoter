@echo off
REM ============================================
REM Script d'automatisation quotidienne - MyHomeQuoter
REM ============================================
REM
REM Ce script genere 5 articles, build et deploie
REM
REM Configuration Windows Task Scheduler:
REM - Action: Demarrer un programme
REM - Programme: c:\Users\locri\Desktop\PV_2\myhomequoter\scripts\run-daily.bat
REM - Argument: (laisser vide)
REM - Demarrer dans: c:\Users\locri\Desktop\PV_2\myhomequoter
REM
REM Pour automatiser:
REM 1. Ouvrir "Planificateur de taches Windows"
REM 2. Creer une tache de base
REM 3. Declencher: Quotidien a 9h00
REM 4. Action: Demarrer ce programme

cd /d "c:\Users\locri\Desktop\PV_2\myhomequoter"

echo.
echo ========================================
echo  MYHOMEQUOTER - WORKFLOW QUOTIDIEN
echo  %date% %time%
echo ========================================

REM Creer dossier logs si inexistant
if not exist "logs" mkdir logs

REM Log de debut
echo %date% %time% - Debut workflow >> logs\daily-run.log

echo.
echo [1/4] Analyse du silo...
echo ----------------------------------------
call npm run blog:analyze
if errorlevel 1 (
    echo ERREUR: Analyse echouee >> logs\daily-run.log
)

echo.
echo [2/4] Generation de 5 articles...
echo ----------------------------------------
call npm run blog:5
if errorlevel 1 (
    echo ERREUR: Generation echouee
    echo %date% %time% - ERREUR Generation >> logs\daily-run.log
    goto :error
)

echo.
echo [3/4] Build du site...
echo ----------------------------------------
call npm run build
if errorlevel 1 (
    echo ERREUR: Build echoue
    echo %date% %time% - ERREUR Build >> logs\daily-run.log
    goto :error
)

echo.
echo [4/4] Deploiement Cloudflare Pages...
echo ----------------------------------------
call npm run blog:deploy
if errorlevel 1 (
    echo ATTENTION: Deploy echoue - verifiez wrangler login
    echo %date% %time% - ERREUR Deploy >> logs\daily-run.log
)

echo.
echo ========================================
echo  SUCCES! 5 articles generes et deployes
echo  %date% %time%
echo ========================================
echo %date% %time% - SUCCES >> logs\daily-run.log
goto :end

:error
echo.
echo ========================================
echo  ERREUR - Verifiez les logs ci-dessus
echo ========================================

:end
echo.
echo Logs disponibles dans: logs\daily-run.log
echo.
