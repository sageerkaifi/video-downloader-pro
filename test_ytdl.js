const ytdl = require('@distube/ytdl-core');

async function test() {
  const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  
  try {
    const info = await ytdl.getInfo(url);
    const formats = info.formats;
    console.log("Found formats:", formats.length);
  } catch (err) {
    console.error("Info error:", err);
  }
}

test();
