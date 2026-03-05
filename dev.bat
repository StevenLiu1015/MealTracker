@echo off
set PATH=%~dp0node\node-v24.13.1-win-x64;%~dp0node\node-v24.13.1-win-x64\node_modules\npm\bin;%PATH%
cmd /k npm run dev
