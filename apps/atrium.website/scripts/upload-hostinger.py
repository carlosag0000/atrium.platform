"""Upload the built site (out/) to atriumad.com's public_html on Hostinger, file by file.

File-by-file on purpose: Hostinger's archive deploy wipes public_html first, and
public_html/cdn holds every image served from cdn.atriumad.com.

Credentials come from the Hostinger "Generate upload URL" API (hosting_files_generate-upload-url
for username u105453487, domain atriumad.com) and are passed as environment variables, never committed:
  HOSTINGER_UPLOAD_URL, HOSTINGER_AUTH_KEY, HOSTINGER_REST_AUTH_KEY

Usage: python3 scripts/upload-hostinger.py [out]
"""
import concurrent.futures as cf
import os
import sys
import urllib.parse
import urllib.request

root = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..", "out")
url = os.environ["HOSTINGER_UPLOAD_URL"]
headers = {
    "X-Auth": os.environ["HOSTINGER_AUTH_KEY"],
    "X-Auth-Rest": os.environ["HOSTINGER_REST_AUTH_KEY"],
    "Tus-Resumable": "1.0.0",
}
files = [os.path.relpath(os.path.join(d, f), root) for d, _, fs in os.walk(root) for f in fs]


def upload(rel):
    with open(os.path.join(root, rel), "rb") as fh:
        data = fh.read()
    target = f"{url}/{urllib.parse.quote(rel)}?override=true"
    err = None
    for _ in range(3):
        try:
            create = {**headers, "Upload-Length": str(len(data)), "Upload-Offset": "0"}
            urllib.request.urlopen(urllib.request.Request(target, method="POST", headers=create), timeout=60)
            if data:
                send = {**headers, "Content-Type": "application/offset+octet-stream", "Upload-Offset": "0"}
                r = urllib.request.urlopen(urllib.request.Request(target, data=data, method="PATCH", headers=send), timeout=180)
                if int(r.headers.get("Upload-Offset", -1)) != len(data):
                    raise RuntimeError("upload incomplete")
            return None
        except Exception as e:  # retry, then report
            err = f"{rel}: {e}"
    return err


with cf.ThreadPoolExecutor(8) as pool:
    errors = [e for e in pool.map(upload, files) if e]
print(f"uploaded {len(files) - len(errors)}/{len(files)}")
for e in errors:
    print(e)
sys.exit(1 if errors else 0)
