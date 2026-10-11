$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (-not (Get-Command npx.cmd -ErrorAction SilentlyContinue)) {
    throw 'Instala Node.js LTS desde https://nodejs.org/ y vuelve a abrir PowerShell.'
}
Write-Host '1. Autoriza tu cuenta de Cloudflare en el navegador.'
& npx.cmd wrangler login
if ($LASTEXITCODE -ne 0) { throw 'No se pudo iniciar sesion en Cloudflare.' }
$projectName = (Read-Host 'Nombre del proyecto (minusculas y guiones, por ejemplo carla-fache-portfolio)').Trim()
if ($projectName -notmatch '^[a-z0-9][a-z0-9-]*$') { throw 'Nombre de proyecto no valido.' }
$existing = Read-Host 'El proyecto ya existe en Cloudflare? [s/N]'
if ($existing -notmatch '^[sSyY]$') {
    & npx.cmd wrangler pages project create $projectName --production-branch main
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo crear el proyecto. Usa otro nombre si ya esta ocupado.' }
}
Write-Host 'Busca la direccion pages.dev del proyecto en Cloudflare > Workers & Pages.'
$siteUrl = (Read-Host 'Pega la URL del proyecto, por ejemplo https://tu-proyecto.pages.dev').Trim().TrimEnd('/')
$uri = $null
if (-not [Uri]::TryCreate($siteUrl, [UriKind]::Absolute, [ref]$uri)) { throw 'URL no valida.' }
if ($uri.Scheme -ne 'https' -or $uri.AbsolutePath -ne '/' -or $uri.Query -or $uri.Fragment -or $uri.UserInfo) {
    throw 'Pega solo la URL HTTPS del sitio, sin rutas, parametros ni credenciales.'
}
$originFile = Join-Path $PSScriptRoot 'deployment-origin.txt'
$oldOrigin = ([IO.File]::ReadAllText($originFile)).Trim()
$encoding = New-Object System.Text.UTF8Encoding($false)
foreach ($folder in @('dist', 'src')) {
    Get-ChildItem (Join-Path $PSScriptRoot $folder) -Recurse -File | Where-Object { $_.Extension -in @('.html', '.json', '.js') } | ForEach-Object {
        $content = [IO.File]::ReadAllText($_.FullName)
        $updated = $content.Replace($oldOrigin, $siteUrl)
        if ($updated -ne $content) { [IO.File]::WriteAllText($_.FullName, $updated, $encoding) }
    }
}
[IO.File]::WriteAllText($originFile, $siteUrl, $encoding)
Write-Host '2. Subiendo el sitio publico a Cloudflare Pages...'
& npx.cmd wrangler pages deploy (Join-Path $PSScriptRoot 'dist') --project-name $projectName --branch main
if ($LASTEXITCODE -ne 0) { throw 'La subida no se completo. Revisa el mensaje de Wrangler y vuelve a intentarlo.' }
Write-Host "Sitio publicado. Abre $siteUrl"
