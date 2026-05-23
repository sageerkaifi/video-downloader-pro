const { exec } = require('child_process');

exec('yt-dlp -j "https://www.youtube.com/watch?v=aqz-KE-bpKQ"', { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
  if (error) {
    console.error(`exec error: ${error}`);
    return;
  }
  const info = JSON.parse(stdout);
  console.log('Title:', info.title);
  console.log('Duration:', info.duration);
  console.log('Ext:', info.ext);
});
