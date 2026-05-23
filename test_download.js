const http = require('http');

async function test() {
  console.log("Testing video-info...");
  const infoReq = await fetch('http://localhost:3000/api/video-info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4' })
  });
  const info = await infoReq.json();
  console.log("Info response:", info);

  console.log("\nTesting download...");
  const dlReq = await fetch(`http://localhost:3000/api/download?url=${encodeURIComponent('https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4')}`);
  console.log("Download status:", dlReq.status);
  console.log("Download headers:", Object.fromEntries(dlReq.headers.entries()));
  
  const buffer = await dlReq.arrayBuffer();
  console.log("Downloaded bytes:", buffer.byteLength);
  
  // check first few bytes to see if it's actually an mp4
  const bytes = new Uint8Array(buffer).slice(0, 16);
  console.log("First 16 bytes:", Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' '));
}

test().catch(console.error);
