const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const zipUrl = 'https://kenney.nl/media/pages/assets/cube-pets/44e58e945f-1774520254/kenney_cube-pets_1.0.zip';
const zipPath = path.join(__dirname, 'kenney.zip');
const outPath = path.join(__dirname, 'kenney_out');

console.log('Downloading...');
const file = fs.createWriteStream(zipPath);
https.get(zipUrl, (response) => {
  response.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Download complete. Unzipping...');
    try {
      if (!fs.existsSync(outPath)) {
        fs.mkdirSync(outPath);
      }
      execSync(`powershell -command "Expand-Archive -Path '${zipPath}' -DestinationPath '${outPath}' -Force"`);
      console.log('Unzip complete.');
      
      const searchCmd = `powershell -command "Get-ChildItem -Path '${outPath}' -Recurse -Filter colormap.png | Select-Object -ExpandProperty FullName"`;
      let colormapPath = execSync(searchCmd).toString().trim();
      
      // PowerShell might return multiple lines if multiple match, get the first one
      if (colormapPath.includes('\n')) {
         colormapPath = colormapPath.split('\n')[0].trim();
      }
      
      if (colormapPath) {
        console.log('Found colormap.png at:', colormapPath);
        const targetDir = path.join(__dirname, 'public', 'models', 'Textures');
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        const targetFile = path.join(targetDir, 'colormap.png');
        fs.copyFileSync(colormapPath, targetFile);
        console.log('SUCCESS: Copied to ' + targetFile);
      } else {
        console.log('colormap.png not found in zip');
      }
    } catch (e) {
      console.error('Error:', e.message);
    }
  });
});
