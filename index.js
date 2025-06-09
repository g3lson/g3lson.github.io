const http = require('http');
const fs = require('fs');
const path = require('path');

const hostname = '0.0.0.0';
const port = 3000;
const docsDir = path.join(__dirname, 'docs');

function send(res, status, content, type = 'text/html') {
  res.statusCode = status;
  res.setHeader('Content-Type', type);
  res.end(content);
}

function listDocs() {
  if (!fs.existsSync(docsDir)) return [];
  return fs.readdirSync(docsDir).filter(f => f.endsWith('.md'));
}

function handleIndex(req, res) {
  const docs = listDocs();
  const docLinks = docs.map(d => `<li><a href="/docs/${encodeURIComponent(d)}">${d}</a></li>`).join('\n');
  const html = `<!DOCTYPE html>
<html><head><title>Documentation</title></head><body>
<h1>Documentation</h1>
<ul>${docLinks}</ul>
<a href="/upload">Upload New Document</a>
</body></html>`;
  send(res, 200, html);
}

function handleDoc(req, res, name) {
  const filePath = path.join(docsDir, name);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath);
    send(res, 200, content, 'text/plain');
  } else {
    send(res, 404, 'Document not found');
  }
}

function handleUploadPage(req, res) {
  const html = `<!DOCTYPE html>
<html><head><title>Upload</title></head><body>
<h1>Upload Document</h1>
<form method="POST" action="/upload">
<label>Document Name: <input name="name"/></label><br/>
<label>Content:</label><br/>
<textarea name="content" rows="10" cols="50"></textarea><br/>
<button type="submit">Upload</button>
</form>
<a href="/">Back</a>
</body></html>`;
  send(res, 200, html);
}

function parseBody(req, callback) {
  let body = '';
  req.on('data', chunk => {
    body += chunk;
  });
  req.on('end', () => {
    const parsed = {};
    body.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key) parsed[decodeURIComponent(key)] = decodeURIComponent((value || '').replace(/\+/g, ' '));
    });
    callback(parsed);
  });
}

function handleUpload(req, res) {
  parseBody(req, data => {
    const name = data.name;
    const content = data.content || '';
    if (!name) {
      send(res, 400, 'Name required');
      return;
    }
    const fileName = name.endsWith('.md') ? name : `${name}.md`;
    const filePath = path.join(docsDir, fileName);
    fs.writeFileSync(filePath, content);
    res.statusCode = 302;
    res.setHeader('Location', '/');
    res.end();
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    handleIndex(req, res);
    return;
  }

  if (req.method === 'GET' && req.url.startsWith('/docs/')) {
    const name = decodeURIComponent(req.url.substring('/docs/'.length));
    handleDoc(req, res, name);
    return;
  }

  if (req.method === 'GET' && req.url === '/upload') {
    handleUploadPage(req, res);
    return;
  }

  if (req.method === 'POST' && req.url === '/upload') {
    handleUpload(req, res);
    return;
  }

  send(res, 404, 'Not Found');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
