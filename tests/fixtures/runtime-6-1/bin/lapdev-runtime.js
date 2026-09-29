#!/usr/bin/env node

import { createServer } from 'node:http';

const port = Number(process.env.PORT || 3333);
const server = createServer((request, response) => {
  if (request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ status: 'ok' }));
    return;
  }
  response.writeHead(404);
  response.end();
});

server.listen(port, '127.0.0.1');
