import base64
import http.client
import importlib.util
import io
import json
from pathlib import Path
import sys
import tempfile
import threading
import unittest
import zipfile
from http.server import ThreadingHTTPServer

FUNCTION = Path(sys.argv.pop(1)) if len(sys.argv) > 1 else Path(__file__).resolve().parents[1] / 'functions/shorts/[[path]].js'

class HelperDomainTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        assets = json.loads(FUNCTION.read_text().split('const FILES=', 1)[1].strip().removesuffix(';'))
        cls.assets = assets
        cls.folder = tempfile.TemporaryDirectory()
        archive = zipfile.ZipFile(io.BytesIO(base64.b64decode(assets['TuanBong-Mac-Helper-v2.zip']['base64'])))
        for name in ['helper.py', 'external_storage.py']:
            Path(cls.folder.name, name).write_bytes(archive.read('TuanBong-Mac-Helper-v2/' + name))
        spec = importlib.util.spec_from_file_location('tb_helper_domain_test', Path(cls.folder.name, 'helper.py'))
        cls.helper = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cls.helper)
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), cls.helper.Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()
        cls.folder.cleanup()

    def request(self, origin, token=None, method='GET', host=None):
        connection = http.client.HTTPConnection('127.0.0.1', self.server.server_port)
        headers = {'Host': host or f'127.0.0.1:{self.helper.PORT}', 'Origin': origin}
        if token is not None:
            headers['X-TuanBong-Token'] = token
        connection.request(method, '/health', headers=headers)
        response = connection.getresponse()
        result = response.status, dict(response.getheaders()), response.read()
        connection.close()
        return result

    def test_old_and_new_sites_require_valid_token(self):
        for origin in ['https://tuanbong.pages.dev', 'https://english-ebook-website.pages.dev']:
            with self.subTest(origin=origin):
                status, headers, _ = self.request(origin, method='OPTIONS')
                self.assertEqual(status, 204)
                self.assertEqual(headers['Access-Control-Allow-Origin'], origin)
                self.assertEqual(self.request(origin, 'wrong')[0], 401)
                status, _, body = self.request(origin, self.helper.TOKEN)
                self.assertEqual(status, 200)
                self.assertEqual(json.loads(body)['version'], '3.0.1')

    def test_foreign_origin_and_spoofed_host_stay_blocked(self):
        for origin in ['https://evil.example', 'https://tuanbong.pages.dev.evil.example', 'http://tuanbong.pages.dev']:
            self.assertEqual(self.request(origin, self.helper.TOKEN)[0], 403)
        self.assertEqual(self.request('https://tuanbong.pages.dev', self.helper.TOKEN, host='evil.example')[0], 403)

    def test_all_update_archives_support_both_sites(self):
        for name, asset in self.assets.items():
            if not name.endswith('.zip'):
                continue
            archive = zipfile.ZipFile(io.BytesIO(base64.b64decode(asset['base64'])))
            for path in archive.namelist():
                if path.endswith('/helper.py'):
                    text = archive.read(path).decode()
                    self.assertIn("'https://tuanbong.pages.dev'", text)
                    self.assertIn("'https://english-ebook-website.pages.dev'", text)
                    self.assertIn("VERSION = '3.0.1'", text)

if __name__ == '__main__':
    unittest.main()
