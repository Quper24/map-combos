#!/usr/bin/python3
"""Receive one site archive over a forced SSH command; no shell or sudo access."""
import fcntl
import hashlib
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import sys
import tarfile
import tempfile
import uuid

BASE = Path('/var/www/qupersimulator/site')
MAX_ARCHIVE = 256 * 1024 * 1024
MAX_CONTENT = 512 * 1024 * 1024


def publish():
    match = re.fullmatch(r'publish ([0-9a-f]{40})', os.environ.get('SSH_ORIGINAL_COMMAND', ''))
    if not match or os.geteuid() == 0:
        raise ValueError('Only publish <commit-sha> as the site deployment user is allowed')
    with (BASE / '.deploy.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        receive(match.group(1))


def receive(commit):
    release = None
    activated = False
    link = BASE / ('.current-' + uuid.uuid4().hex)
    with tempfile.TemporaryDirectory(prefix='.incoming-', dir=BASE) as incoming:
        archive = Path(incoming) / 'site.tar.gz'
        size = 0
        with archive.open('wb') as output:
            while chunk := sys.stdin.buffer.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_ARCHIVE:
                    raise ValueError('Archive exceeds 256 MiB')
                output.write(chunk)
        try:
            with tarfile.open(archive, 'r:gz') as bundle:
                members = bundle.getmembers()
                if len(members) > 5000 or sum(m.size for m in members) > MAX_CONTENT:
                    raise ValueError('Archive content exceeds site limits')
                for member in members:
                    path = PurePosixPath(member.name)
                    if path.is_absolute() or '..' in path.parts or not (member.isfile() or member.isdir()):
                        raise ValueError('Archive contains an unsafe entry')
                release = Path(tempfile.mkdtemp(prefix=commit + '-', dir=BASE / 'releases'))
                bundle.extractall(release, filter='data')
            index = release / 'index.html'
            assets = release / 'assets'
            if not index.is_file() or not assets.is_dir():
                raise ValueError('Missing index.html or assets directory')
            for asset in re.findall(r'(?:src|href)=[\"\'](/assets/[^\"\']+)[\"\']', index.read_text()):
                target = (release / asset.lstrip('/')).resolve()
                if not target.is_relative_to(release) or not target.is_file():
                    raise ValueError('Index references a missing asset')
            os.chmod(release, 0o755)
            for path in release.rglob('*'):
                os.chmod(path, 0o755 if path.is_dir() else 0o644)
            # Keep old hashed files available to tabs opened before a deployment.
            for source in assets.rglob('*'):
                if not source.is_file():
                    continue
                target = BASE / 'assets' / source.relative_to(assets)
                target.parent.mkdir(parents=True, exist_ok=True, mode=0o755)
                try:
                    os.link(source, target)
                except FileExistsError:
                    with source.open('rb') as left, target.open('rb') as right:
                        if hashlib.file_digest(left, 'sha256').digest() != hashlib.file_digest(right, 'sha256').digest():
                            raise ValueError('Immutable asset collision')
            os.symlink(release, link)
            os.replace(link, BASE / 'current')
            activated = True
            print('Published commit ' + commit, flush=True)
        finally:
            if link.is_symlink():
                link.unlink()
            if release is not None and not activated:
                shutil.rmtree(release)


if __name__ == '__main__':
    try:
        publish()
    except Exception as error:
        print('Deployment failed: ' + str(error), file=sys.stderr)
        sys.exit(1)
