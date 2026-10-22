$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$speechDemo = New-Object System.Speech.Synthesis.SpeechSynthesizer
$speechDemo.SelectVoice('Microsoft Huihui Desktop')
$speechDemo.Rate = 1
$sceneList = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'scenes.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$audioFolder = Join-Path $PSScriptRoot '../artifacts/audio'
New-Item -ItemType Directory -Force -Path $audioFolder | Out-Null
for ($sceneIndex = 0; $sceneIndex -lt $sceneList.Count; $sceneIndex++) {
  $audioTarget = [System.IO.Path]::GetFullPath((Join-Path $audioFolder ('scene-' + $sceneIndex + '.wav')))
  $speechDemo.SetOutputToWaveFile($audioTarget)
  $speechDemo.Speak($sceneList[$sceneIndex].text)
}
$speechDemo.Dispose()
Write-Output 'Generated Chinese narration segments.'
