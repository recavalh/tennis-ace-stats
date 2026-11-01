param([int]$Port = 55432)
$ErrorActionPreference = 'Stop'
$taskWorkspace = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$taskPgPath = [IO.Path]::GetFullPath((Join-Path $taskWorkspace ('output/pg-check-' + [Guid]::NewGuid().ToString('N'))))
if (-not $taskPgPath.StartsWith($taskWorkspace + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Diretório de teste fora do projeto.' }
$taskPgBin = 'C:\Program Files\PostgreSQL\18\bin'
if (-not (Test-Path -LiteralPath (Join-Path $taskPgBin 'initdb.exe'))) { throw 'PostgreSQL 18 não encontrado.' }
if (Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue) { throw 'A porta de teste já está em uso.' }
[IO.Directory]::CreateDirectory((Split-Path -Parent $taskPgPath)) | Out-Null
& (Join-Path $taskPgBin 'initdb.exe') -D $taskPgPath -U ace_test -A trust --encoding=UTF8 --locale=C
if ($LASTEXITCODE -ne 0) { throw 'Não foi possível preparar o cluster temporário.' }
$taskStarted = $false
$taskOldUrl = $env:TEST_DATABASE_URL
$taskOldDirectory = $env:TEST_PG_DIRECTORY
$taskOldPort = $env:TEST_PG_PORT
try {
  $taskArguments = '-D "' + $taskPgPath + '" -l "' + (Join-Path $taskPgPath 'server.log') + '" -o "-p ' + $Port + ' -h 127.0.0.1" -w start'
  $taskProcess = Start-Process -FilePath (Join-Path $taskPgBin 'pg_ctl.exe') -ArgumentList $taskArguments -WindowStyle Hidden -PassThru
  $taskProcess.WaitForExit()
  if ($taskProcess.ExitCode -ne 0) { throw 'Não foi possível iniciar o PostgreSQL temporário.' }
  $taskStarted = $true
  $env:TEST_DATABASE_URL = 'postgresql://ace_test@127.0.0.1:' + $Port + '/postgres'
  $env:TEST_PG_DIRECTORY = $taskPgPath
  $env:TEST_PG_PORT = [string]$Port
  Push-Location (Join-Path $taskWorkspace 'strategy-game')
  try {
    node --import tsx scripts/verify-postgres.ts
    if ($LASTEXITCODE -ne 0) { throw 'A verificação PostgreSQL falhou.' }
  } finally { Pop-Location }
} finally {
  $env:TEST_DATABASE_URL = $taskOldUrl
  $env:TEST_PG_DIRECTORY = $taskOldDirectory
  $env:TEST_PG_PORT = $taskOldPort
  if ($taskStarted) {
    $taskArguments = '-D "' + $taskPgPath + '" -m fast -w stop'
    $taskStopProcess = Start-Process -FilePath (Join-Path $taskPgBin 'pg_ctl.exe') -ArgumentList $taskArguments -WindowStyle Hidden -PassThru
    $taskStopProcess.WaitForExit()
  }
}
