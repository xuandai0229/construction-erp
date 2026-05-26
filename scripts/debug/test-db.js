const http = require('http');

http.get('http://localhost:3000/api/analytics?projectId=00321b7b-5ef3-41ca-89b0-ebed6336ab03&action=all', (res) => {
  let data = '';
  console.log("STATUS CODE:", res.statusCode);
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log("RESPONSE BODY:", JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log("RAW RESPONSE:", data);
    }
  });
}).on('error', (err) => {
  console.error("HTTP GET Error:", err);
});
