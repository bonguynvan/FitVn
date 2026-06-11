<#
  FitVN — PWA icon generator.

  Rasterizes the FitVN brand mark (warm coral->orange gradient + white dumbbell
  + lime "go" tick) into the PNG sizes the manifest and iOS home screen need.
  This is a dependency-free, repeatable rasterizer using GDI+ so the committed
  icons stay in sync with the brand without a Node/sharp toolchain.

  For a pixel-exact export of public/icons/icon.svg, use sharp/Inkscape instead
  (see public/icons/README.md); this produces a faithful, production-usable set.

  Run:  powershell -ExecutionPolicy Bypass -File scripts/generate-icons.ps1
#>

Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'

$outDir = Join-Path $PSScriptRoot '..\public\icons'
$outDir = [System.IO.Path]::GetFullPath($outDir)
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

function New-RoundedRectPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

function Add-Plate([System.Drawing.Graphics]$g, [System.Drawing.Brush]$brush, [float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $p = New-RoundedRectPath $x $y $w $h $r
  $g.FillPath($brush, $p)
  $p.Dispose()
}

# Draw the full 512x512 master onto $g. $rounded => rounded-corner background
# (for "any" icons); $false => full-bleed square (for maskable + apple-touch).
function Draw-Master([System.Drawing.Graphics]$g, [bool]$rounded) {
  $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)

  $full = New-Object System.Drawing.RectangleF(0, 0, 512, 512)

  # --- Background: diagonal 3-stop coral -> orange -> deep-orange gradient ---
  $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $full,
    [System.Drawing.Color]::FromArgb(255, 138, 76),
    [System.Drawing.Color]::FromArgb(241, 73, 47),
    [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal)
  $blend = New-Object System.Drawing.Drawing2D.ColorBlend(3)
  $blend.Colors    = @(
    [System.Drawing.Color]::FromArgb(255, 138, 76),
    [System.Drawing.Color]::FromArgb(255, 107, 61),
    [System.Drawing.Color]::FromArgb(241, 73, 47))
  $blend.Positions = @([float]0.0, [float]0.55, [float]1.0)
  $bg.InterpolationColors = $blend

  if ($rounded) {
    $bgPath = New-RoundedRectPath 0 0 512 512 112
    $g.FillPath($bg, $bgPath)
    # faint top sheen for depth
    $sheen = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 255, 255, 255))
    $g.FillPath($sheen, $bgPath)
    $sheen.Dispose()
    $bgPath.Dispose()
  } else {
    $g.FillRectangle($bg, $full)
    $sheen = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 255, 255, 255))
    $g.FillRectangle($sheen, $full)
    $sheen.Dispose()
  }
  $bg.Dispose()

  # --- Dumbbell, rotated -32deg to imply an upward progress stroke ---
  $cream = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 244, 236))
  $peach = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 217, 194))

  $m = New-Object System.Drawing.Drawing2D.Matrix
  $m.RotateAt(-32, (New-Object System.Drawing.PointF(256, 256)))
  $g.Transform = $m

  Add-Plate $g $cream 150 238 212 36 18   # bar
  Add-Plate $g $cream 118 206 34 100 16    # left inner plate
  Add-Plate $g $peach 96  226 26 60  13    # left outer plate
  Add-Plate $g $cream 360 206 34 100 16    # right inner plate
  Add-Plate $g $peach 390 226 26 60  13    # right outer plate

  $g.ResetTransform()
  $cream.Dispose()
  $peach.Dispose()

  # --- Lime "go" accent: a rising tick across the bar ---
  $lime = [System.Drawing.Color]::FromArgb(243, 183, 236, 66)
  $pen = New-Object System.Drawing.Pen($lime, 26)
  $pen.StartCap  = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap    = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.LineJoin  = [System.Drawing.Drawing2D.LineJoin]::Round
  $pts = @(
    (New-Object System.Drawing.PointF(150, 330)),
    (New-Object System.Drawing.PointF(236, 256)),
    (New-Object System.Drawing.PointF(300, 300)),
    (New-Object System.Drawing.PointF(392, 196)))
  $g.DrawLines($pen, $pts)
  $pen.Dispose()

  # --- Wordmark dot tag ---
  $dot = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(183, 236, 66))
  $g.FillEllipse($dot, 372, 176, 40, 40)
  $dot.Dispose()
}

function New-MasterBitmap([bool]$rounded) {
  $bmp = New-Object System.Drawing.Bitmap(512, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  Draw-Master $g $rounded
  $g.Dispose()
  return $bmp
}

function Save-Scaled([System.Drawing.Bitmap]$master, [int]$size, [string]$name) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::Transparent)
  $g.DrawImage($master, (New-Object System.Drawing.Rectangle(0, 0, $size, $size)))
  $g.Dispose()
  $path = Join-Path $outDir $name
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "  wrote $name ($size x $size)"
}

Write-Host "Generating FitVN icons into $outDir"

$rounded = New-MasterBitmap $true
$square  = New-MasterBitmap $false

# "any" icons — rounded master
Save-Scaled $rounded 192 'icon-192.png'
Save-Scaled $rounded 256 'icon-256.png'
Save-Scaled $rounded 384 'icon-384.png'
Save-Scaled $rounded 512 'icon-512.png'

# maskable + apple-touch — full-bleed square master (no transparent corners)
Save-Scaled $square 512 'icon-maskable-512.png'
Save-Scaled $square 180 'apple-touch-icon.png'

$rounded.Dispose()
$square.Dispose()

Write-Host "Done. 6 icons generated."
