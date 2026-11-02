import importlib.util
import io
import os
from pathlib import Path
import tarfile
import tempfile
import types
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('publisher', Path(__file__).with_name('publish-site.py'))
publisher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(publisher)


def archive(entries):
    stream = io.BytesIO()
    with tarfile.open(fileobj=stream, mode='w:gz') as bundle:
        for name, data in entries.items():
            entry = tarfile.TarInfo(name)
            entry.size = len(data)
            bundle.addfile(entry, io.BytesIO(data))
    stream.seek(0)
    return types.SimpleNamespace(buffer=stream)


class DeploymentTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.base = Path(self.directory.name)
        (self.base / 'releases').mkdir()
        (self.base / 'assets').mkdir()
        self.base_patch = patch.object(publisher, 'BASE', self.base)
        self.base_patch.start()

    def tearDown(self):
        self.base_patch.stop()
        self.directory.cleanup()

    def send(self, entries, commit='a' * 40):
        with patch.object(publisher.sys, 'stdin', archive(entries)):
            publisher.receive(commit)

    def test_publish_preserves_previous_release_and_hashed_assets(self):
        self.send({'index.html': b'<script src="/assets/one.js"></script>', 'assets/one.js': b'one'})
        previous = (self.base / 'current').resolve()
        self.send({'index.html': b'<script src="/assets/two.js"></script>', 'assets/two.js': b'two'}, 'b' * 40)
        self.assertTrue(previous.is_dir())
        self.assertNotEqual((self.base / 'current').resolve(), previous)
        self.assertEqual((self.base / 'assets/one.js').read_bytes(), b'one')
        self.assertEqual((self.base / 'assets/two.js').read_bytes(), b'two')

    def test_traversal_cannot_write_outside_release(self):
        with self.assertRaises(ValueError):
            self.send({'../outside': b'bad'})
        self.assertFalse((self.base / 'outside').exists())
        self.assertFalse((self.base / 'current').exists())

    def test_missing_asset_keeps_current_release(self):
        self.send({'index.html': b'ok', 'assets/main.js': b'ok'})
        previous = (self.base / 'current').resolve()
        with self.assertRaises(ValueError):
            self.send({'index.html': b'<script src="/assets/missing.js"></script>', 'assets/other.js': b'ok'})
        self.assertEqual((self.base / 'current').resolve(), previous)

    def test_immutable_collision_keeps_current_release(self):
        self.send({'index.html': b'ok', 'assets/main.js': b'original'})
        previous = (self.base / 'current').resolve()
        with self.assertRaises(ValueError):
            self.send({'index.html': b'changed', 'assets/main.js': b'different'})
        self.assertEqual((self.base / 'current').resolve(), previous)
        self.assertEqual((self.base / 'assets/main.js').read_bytes(), b'original')

    def test_other_ssh_commands_are_rejected(self):
        for command in ['', 'bash', 'publish ../oops', 'publish ' + 'a' * 40 + '; id']:
            with patch.dict(os.environ, {'SSH_ORIGINAL_COMMAND': command}), patch.object(publisher.os, 'geteuid', return_value=1001):
                with self.assertRaises(ValueError):
                    publisher.publish()


if __name__ == '__main__':
    unittest.main()
