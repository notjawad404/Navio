param(
  [string]$Function = "all"
)

$functions = @("navio-trips", "navio-places", "navio-ai-plan", "navio-share", "navio-reviews")

if ($Function -ne "all") {
  $functions = @($Function)
}

foreach ($fn in $functions) {
  $dir = "functions\$fn"
  $zip = "dist\$fn.zip"

  if (-not (Test-Path "dist")) { New-Item -ItemType Directory -Path "dist" | Out-Null }

  Write-Host "Deploying $fn..." -ForegroundColor Cyan

  Compress-Archive -Path "$dir\*" -DestinationPath $zip -Force

  aws lambda update-function-code `
    --function-name $fn `
    --zip-file "fileb://$zip" `
    --region ap-southeast-1 | Out-Null

  Write-Host "$fn deployed." -ForegroundColor Green
}
