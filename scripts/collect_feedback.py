"""Read public MLLM feedback from official GitHub/Hugging Face APIs.

No tokens are read by this script: gh manages its own authentication; HF uses
public unauthenticated access. Raw records preserve text, not user profiles.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import gzip
import json
import re
import subprocess
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data/raw/feedback"
RAW_PURPOSE = "collection"


def now():
    return datetime.now(timezone.utc).isoformat()


def author_hash(name):
    return hashlib.sha256(str(name).encode()).hexdigest()[:20] if name else None


def redact_public_text(text):
    text = re.sub(r"\b(?:hf_|ghp_|github_pat_)[A-Za-z0-9_]{15,}\b", "[REDACTED_TOKEN]", text or "")
    return re.sub(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", "[REDACTED_EMAIL]", text)


def archive_payload(platform, url, payload, status=200):
    """Preserve exact response body locally, with retrieval-time provenance."""
    directory = RAW / "api_responses" / platform
    directory.mkdir(parents=True, exist_ok=True)
    key = hashlib.sha256(url.encode()).hexdigest()[:20] + "_" + str(time.time_ns())
    path = directory / (key + ".json.gz")
    with gzip.open(path, "wb") as f:
        f.write(payload)
    write_json(directory / (key + ".metadata.json"), {
        "url": url, "retrieved_at": now(), "http_status": status,
        "sha256_uncompressed_response": hashlib.sha256(payload).hexdigest(),
        "body_bytes": len(payload), "body_file": path.name,
        "purpose": RAW_PURPOSE,
        "note": "A backfill is a later API snapshot, not the original first-fetch response." if RAW_PURPOSE == "backfill_later_snapshot" else "Exact HTTP response body; local ignored archive.",
    })


def enable_hf_response_archive():
    from huggingface_hub.utils import get_session
    session = get_session()
    def capture(response):
        response.read()
        archive_payload("huggingface", str(response.request.url), response.content, response.status_code)
    session.event_hooks["response"].append(capture)


def api_json(url):
    for attempt in range(5):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "DSCI401-MLLM-Research/1.0"})
            with urllib.request.urlopen(request, timeout=60) as response:
                return json.load(response)
        except urllib.error.HTTPError as exc:
            if exc.code == 429 or exc.code >= 500:
                time.sleep(min(60, 5 * 2**attempt))
                continue
            raise
    raise RuntimeError("HTTP retries exhausted")


def gh_json(endpoint):
    for attempt in range(5):
        result = subprocess.run(["gh", "api", endpoint], capture_output=True, text=True)
        if result.returncode == 0:
            archive_payload("github", "https://api.github.com/" + endpoint, result.stdout.encode())
            return json.loads(result.stdout)
        # Never print authentication diagnostics or environment contents.
        if "rate limit" in result.stderr.lower() or "HTTP 5" in result.stderr:
            time.sleep(min(60, 5 * 2**attempt))
            continue
        raise RuntimeError(f"GitHub request failed: {endpoint}, exit={result.returncode}")
    raise RuntimeError(f"GitHub retries exhausted: {endpoint}")


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")
    temporary.replace(path)


def common(source, obj_id, thread_id, url, created, text, role, author, obj_type, title=""):
    return {"platform": source["platform"], "source_repo": source["repo"],
            "source_object_id": str(obj_id), "thread_id": str(thread_id),
            "source_url": url, "published_at": created, "collected_at": now(),
            "text": redact_public_text(text), "role": role, "author_hash": author_hash(author),
            "object_type": obj_type, "thread_title": title,
            "family_id": source["family_id"], "model_ids": source.get("model_ids", []),
            "scope": source.get("scope", "family"), "source_evidence_url": source["evidence_url"]}


def github(source, page_limit, hf_thread_limit):
    slug = source["repo"].replace("/", "__")
    cache = RAW / "github" / slug
    cache.mkdir(parents=True, exist_ok=True)
    issue_ids = {}
    records = []
    pages = {}
    for kind in ("issues", "issues/comments"):
        page = 1
        while not page_limit or page <= page_limit:
            target = cache / f"{kind.replace('/', '_')}_{page:04d}.json"
            if target.exists():
                items = json.loads(target.read_text())
            else:
                endpoint = f"repos/{source['repo']}/{kind}?per_page=100&page={page}&sort=created&direction=asc"
                if kind == "issues":
                    endpoint += "&state=all"
                payload = gh_json(endpoint)
                items = []
                for row in payload:
                    number = row.get("number") or row.get("issue_url", "").rsplit("/", 1)[-1]
                    association = row.get("author_association", "NONE")
                    role = "maintainer" if association in {"OWNER", "MEMBER", "COLLABORATOR"} else "community"
                    if row.get("user", {}).get("type") == "Bot":
                        role = "bot"
                    record = common(source, row["id"], number, row.get("html_url"), row.get("created_at"),
                                    row.get("body"), role, row.get("user", {}).get("login"),
                                    "issue_body" if kind == "issues" else "issue_comment", row.get("title", ""))
                    record.update(is_pull_request=bool(row.get("pull_request")), updated_at=row.get("updated_at"))
                    items.append(record)
                write_json(target, items)
                time.sleep(0.2)
            if kind == "issues":
                for item in items:
                    issue_ids[str(item["thread_id"])] = {"is_pull_request": item["is_pull_request"], "title": item["thread_title"]}
            records.extend(items)
            if len(items) < 100:
                break
            page += 1
        pages[kind] = page
    for record in records:
        thread = issue_ids.get(str(record["thread_id"]))
        if thread is not None:
            record["is_pull_request"] = thread["is_pull_request"]
            record["thread_title"] = thread["title"]
            record["thread_resolved"] = True
        else:
            record["thread_resolved"] = False
    return records, {"pages": pages, "threads": len(issue_ids)}


def huggingface(source, page_limit, hf_thread_limit):
    # SDK paginates the thread iterator; details expose typed comment events.
    from huggingface_hub import HfApi
    api = HfApi(token=False)
    slug = source["repo"].replace("/", "__")
    cache = RAW / "huggingface" / slug
    cache.mkdir(parents=True, exist_ok=True)
    records = []
    n_threads = 0
    for discussion in api.get_repo_discussions(source["repo"], discussion_type="discussion", discussion_status="all"):
        if hf_thread_limit and n_threads >= hf_thread_limit:
            break
        n_threads += 1
        path = cache / f"discussion_{discussion.num:05d}.json"
        if path.exists():
            items = json.loads(path.read_text())
        else:
            detail = api.get_discussion_details(source["repo"], discussion.num)
            items = []
            for event in detail.events:
                if event.type != "comment" or getattr(event, "hidden", False):
                    continue
                record = common(source, event.id, discussion.num,
                                f"https://huggingface.co/{source['repo']}/discussions/{discussion.num}#{event.id}",
                                event.created_at.isoformat(), event.content,
                                "unknown", event.author, "discussion_comment", discussion.title)
                record.update(is_pull_request=False, thread_resolved=True)
                items.append(record)
            write_json(path, items)
            time.sleep(0.1)
        records.extend(items)
    return records, {"threads": n_threads}


def collect(source, args):
    started = now()
    for attempt in range(6):
        try:
            records, stats = (github if source["platform"] == "github" else huggingface)(source, args.page_limit, args.hf_thread_limit)
            path = RAW / "normalized" / f"{source['platform']}__{source['repo'].replace('/', '__')}.jsonl"
            path.parent.mkdir(parents=True, exist_ok=True)
            temporary = path.with_suffix(".jsonl.tmp")
            temporary.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in records))
            temporary.replace(path)
            report = {**source, "status": "ok", "raw_records": len(records), "started_at": started,
                      "finished_at": now(), "limited_run": bool(args.page_limit or args.hf_thread_limit), **stats}
            break
        except Exception as exc:
            response = getattr(exc, "response", None)
            status = getattr(response, "status_code", None)
            if status == 429 and attempt < 5:
                headers = getattr(response, "headers", {})
                rate = headers.get("RateLimit", "")
                import re
                match = re.search(r"(?:^|;)\s*t=(\d+)", rate)
                delay = int(match.group(1)) + 2 if match else 60
                # Bounded sleep chunks retain interruption responsiveness.
                for _ in range(max(1, (delay + 59)//60)):
                    time.sleep(min(60, delay))
                    delay -= min(60, delay)
                continue
            report = {**source, "status": "error", "error_type": type(exc).__name__, "http_status": status,
                      "started_at": started, "finished_at": now()}
            break
    print(json.dumps({k: report[k] for k in ("repo", "status", "raw_records") if k in report}), flush=True)
    return report


def main():
    global RAW_PURPOSE
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--config", type=Path, default=ROOT / "config/feedback_sources.json")
    p.add_argument("--platform", choices=["github", "huggingface", "all"], default="all")
    p.add_argument("--source-limit", type=int, default=0)
    p.add_argument("--retry-errors-from", type=Path)
    p.add_argument("--backfill-raw-sample", action="store_true", help="Replay at most two representative API responses per source as a clearly dated later snapshot.")
    p.add_argument("--page-limit", type=int, default=0)
    p.add_argument("--hf-thread-limit", type=int, default=0)
    p.add_argument("--workers", type=int, default=3)
    p.add_argument("--report-name", default="feedback_collection")
    args = p.parse_args()
    if args.platform in {"huggingface", "all"}:
        enable_hf_response_archive()
    config = json.loads(args.config.read_text())
    sources = [s for s in config["sources"] if args.platform == "all" or s["platform"] == args.platform]
    if args.retry_errors_from:
        failed = {s["repo"] for s in json.loads(args.retry_errors_from.read_text())["sources"] if s["status"] == "error"}
        sources = [s for s in sources if s["repo"] in failed]
    if args.source_limit:
        sources = sources[:args.source_limit]
    if args.backfill_raw_sample:
        RAW_PURPOSE = "backfill_later_snapshot"
        reports = []
        from huggingface_hub import HfApi
        from huggingface_hub.utils import get_session, hf_raise_for_status
        for source in sources:
            try:
                if source["platform"] == "github":
                    for kind in ("issues", "issues/comments"):
                        suffix = "&state=all" if kind == "issues" else ""
                        gh_json(f"repos/{source['repo']}/{kind}?per_page=100&page=1&sort=created&direction=asc{suffix}")
                else:
                    url = f"https://huggingface.co/api/models/{source['repo']}/discussions?type=discussion&status=all&p=0"
                    response = get_session().get(url)
                    hf_raise_for_status(response)
                    paths = sorted((RAW / "huggingface" / source["repo"].replace("/", "__")).glob("discussion_*.json"))
                    if paths:
                        number = int(paths[0].stem.split("_")[-1])
                        HfApi(token=False).get_discussion_details(source["repo"], number)
                reports.append({"repo": source["repo"], "platform": source["platform"], "status": "ok", "purpose": RAW_PURPOSE})
            except Exception as exc:
                reports.append({"repo": source["repo"], "platform": source["platform"], "status": "error", "error_type": type(exc).__name__, "http_status": getattr(getattr(exc, "response", None), "status_code", None)})
            print(json.dumps(reports[-1]), flush=True)
            write_json(ROOT / "reports" / f"{args.report_name}.json", {"retrieved_at": now(), "scope": "At most two representative responses per source; not a complete first-fetch archive.", "sources": reports})
            time.sleep(0.3)
        return
    reports = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = [pool.submit(collect, source, args) for source in sources]
        for future in concurrent.futures.as_completed(futures):
            reports.append(future.result())
            write_json(ROOT / "reports" / f"{args.report_name}.json", {"collected_at": now(), "sources": reports})


if __name__ == "__main__":
    main()
