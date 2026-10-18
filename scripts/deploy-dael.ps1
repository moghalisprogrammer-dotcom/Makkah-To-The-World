$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$stamp = Get-Date -Format 'yyyyMMddHHmmss'
$archive = Join-Path $env:TEMP "makkah-$stamp.tar.gz"
# The SSH target comes from the environment so the server address never lives in this public repo.
$remote = $env:MAKKAH_DEPLOY_REMOTE
if (-not $remote) { throw 'Set MAKKAH_DEPLOY_REMOTE (for example user@host) before deploying.' }
# Only committed application files are packaged; server secrets stay on the server.
git -C $repo archive --format=tar.gz --output=$archive HEAD
if ($LASTEXITCODE -ne 0) { throw 'Could not package the application.' }
scp $archive "${remote}:/tmp/makkah-$stamp.tar.gz"
if ($LASTEXITCODE -ne 0) { throw 'Upload failed.' }
scp (Join-Path $PSScriptRoot 'deploy-dael.sh') "${remote}:/tmp/deploy-dael-$stamp.sh"
if ($LASTEXITCODE -ne 0) { throw 'Script upload failed.' }
ssh -t $remote "bash /tmp/deploy-dael-$stamp.sh /tmp/makkah-$stamp.tar.gz $stamp"
if ($LASTEXITCODE -ne 0) { throw 'Deployment did not finish. Read the server error above.' }
Write-Host 'Deployment completed: https://daeloffice.com'
