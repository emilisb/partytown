import fetch from 'node-fetch';

export default function (request, response) {
  try {
    if (!request.query.p) {
      response.status(400).send(`Missing "p" querystring`);
    } else {
      const proxyUrl = request.query.p;
      fetch(proxyUrl).then((proxyRsp) => {
        const headers = [
          'age',
          'cache-control',
          'content-type',
          'date',
          'etag',
          'last-modified',
          'x-cache',
        ];
        headers.forEach((headerName) => {
          if (proxyRsp.headers.has(headerName)) {
            response.setHeader(headerName, proxyRsp.headers.get(headerName));
          }
        });
        response.writeHead(proxyRsp.status);

        proxyRsp.text().then((proxyText) => {
          response.end(proxyText);
        });
      });
    }
  } catch (e) {
    response.status(500).send(String(e));
  }
}
