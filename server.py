#!/usr/bin/env python3
"""Kleiner lokaler Server fuer AppHub (nur Python-Standardbibliothek).

- liefert die App-Dateien aus
- speichert alle App-Daten in der Datei "appdata.json" in diesem Ordner
  (statt nur im Browser). Taegliche Sicherungskopien landen in "backups/".

Aufruf:  python server.py [--port 8080] [--idle-minutes 45]
"""
import argparse, glob, json, mimetypes, os, shutil, socket, sys, threading, time
from datetime import date
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote, urlparse, parse_qs

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, 'appdata.json')
BACKUPS = os.path.join(ROOT, 'backups')
LOCK = threading.Lock()
LAST = [time.time()]
MARK = os.path.join(ROOT, 'appdata.migrated')

mimetypes.add_type('text/javascript', '.js')
mimetypes.add_type('image/svg+xml', '.svg')


def save_data(body: bytes):
    with LOCK:
        if os.path.exists(DATA):
            os.makedirs(BACKUPS, exist_ok=True)
            bk = os.path.join(BACKUPS, 'appdata-%s.json' % date.today().isoformat())
            if not os.path.exists(bk):
                shutil.copyfile(DATA, bk)
                for old in sorted(glob.glob(os.path.join(BACKUPS, 'appdata-*.json')), reverse=True)[14:]:
                    try:
                        os.remove(old)
                    except OSError:
                        pass
        tmp = DATA + '.tmp'
        with open(tmp, 'wb') as f:
            f.write(body)
        os.replace(tmp, DATA)


class Handler(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'
    server_version = 'AppHub'

    def log_message(self, *a):
        pass

    def _send(self, status, body=b'', ctype='text/plain; charset=utf-8'):
        self.send_response(status)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('X-AppHub', '2')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Private-Network', 'true')
        self.send_header('Cache-Control', 'no-cache')
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(body)

    def do_OPTIONS(self):
        LAST[0] = time.time()
        self._send(204)

    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        LAST[0] = time.time()
        url = urlparse(self.path)
        path = unquote(url.path)
        if path == '/api/ping':
            return self._send(200, b'ok')
        if path == '/api/data':
            if os.path.exists(DATA):
                with LOCK, open(DATA, 'rb') as f:
                    return self._send(200, f.read(), 'application/json; charset=utf-8')
            return self._send(404, b'no data')
        if path == '/':
            path = '/AppHub.html'
        rel = path.lstrip('/').replace('\\', '/')
        parts = [p for p in rel.split('/') if p]
        if any(p.startswith('.') for p in parts) or (parts and (parts[0].startswith('appdata') or parts[0] == 'backups')):
            return self._send(403, b'forbidden')
        full = os.path.normpath(os.path.join(ROOT, *parts))
        if not full.startswith(ROOT) or not os.path.isfile(full):
            return self._send(404, b'not found')
        ctype = mimetypes.guess_type(full)[0] or 'application/octet-stream'
        if ctype.startswith('text/') or ctype in ('application/json',):
            ctype += '; charset=utf-8'
        with open(full, 'rb') as f:
            self._send(200, f.read(), ctype)

    def do_PUT(self):
        LAST[0] = time.time()
        url = urlparse(self.path)
        if url.path != '/api/data':
            return self._send(404, b'not found')
        n = int(self.headers.get('Content-Length') or 0)
        body = self.rfile.read(n)
        q = parse_qs(url.query)
        if q.get('ifmissing') == ['1'] and os.path.exists(DATA):
            return self._send(409, b'exists')
        if not body.lstrip().startswith(b'{'):
            return self._send(400, b'bad body')
        if q.get('migrate') == ['1']:
            # einmalige Uebernahme der alten Browser-Daten: neue Werte gewinnen, vorhandene Zusatzschluessel bleiben
            if os.path.exists(MARK):
                return self._send(409, b'already migrated')
            try:
                inc = json.loads(body.decode('utf-8'))
                data = {}
                if os.path.exists(DATA):
                    with open(DATA, 'rb') as f:
                        data = json.loads(f.read().decode('utf-8')).get('data', {}) or {}
                data.update(inc.get('data', {}) or {})
                body = json.dumps({'v': 1, 't': int(time.time() * 1000), 'data': data}, ensure_ascii=False).encode('utf-8')
            except ValueError:
                return self._send(400, b'bad json')
            save_data(body)
            with open(MARK, 'w') as f:
                f.write('ok')
            return self._send(200, b'migrated')
        save_data(body)
        self._send(200, b'saved')

    do_POST = do_PUT


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--port', type=int, default=8080)
    ap.add_argument('--idle-minutes', type=int, default=0)
    a = ap.parse_args()
    try:
        srv = ThreadingHTTPServer(('127.0.0.1', a.port), Handler)
    except OSError as e:
        print('Port %d konnte nicht geoeffnet werden: %s' % (a.port, e))
        sys.exit(1)
    srv.daemon_threads = True
    if socket.has_ipv6:
        class Srv6(ThreadingHTTPServer):
            address_family = socket.AF_INET6
        try:
            srv6 = Srv6(('::1', a.port), Handler)
            srv6.daemon_threads = True
            threading.Thread(target=srv6.serve_forever, daemon=True).start()
        except OSError:
            pass
    print('AppHub laeuft auf http://localhost:%d/  (Daten: %s)' % (a.port, DATA))
    if a.idle_minutes > 0:
        def watchdog():
            while True:
                time.sleep(30)
                if time.time() - LAST[0] > a.idle_minutes * 60:
                    os._exit(0)
        threading.Thread(target=watchdog, daemon=True).start()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
