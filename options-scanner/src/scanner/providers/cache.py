"""Local disk cache so repeated scans don't hit provider rate limits."""

from __future__ import annotations

import hashlib
import json
import time
from datetime import date
from pathlib import Path

from scanner.models import Bar, OptionContract, Quote
from scanner.providers.base import DataProvider


class DiskCache:
    def __init__(self, directory: Path, now=time.time):
        self.dir = Path(directory)
        self._now = now
        self.hits = 0
        self.misses = 0

    def _path(self, key: str) -> Path:
        digest = hashlib.sha256(key.encode()).hexdigest()[:32]
        return self.dir / f"{digest}.json"

    def get(self, key: str, ttl_seconds: float):
        p = self._path(key)
        try:
            entry = json.loads(p.read_text())
        except (FileNotFoundError, json.JSONDecodeError):
            self.misses += 1
            return None
        if self._now() - entry["ts"] > ttl_seconds:
            self.misses += 1
            return None
        self.hits += 1
        return entry["payload"]

    def set(self, key: str, payload) -> None:
        self.dir.mkdir(parents=True, exist_ok=True)
        p = self._path(key)
        tmp = p.with_suffix(".tmp")
        tmp.write_text(json.dumps({"key": key, "ts": self._now(), "payload": payload}))
        tmp.replace(p)  # atomic, so a crash never leaves a half-written entry


class CachingProvider(DataProvider):
    """Wraps any DataProvider with a TTL disk cache.

    Empty results are never cached: an empty chain is usually a rate limit or a
    transient failure, and caching it would hide real data for the whole TTL.
    """

    def __init__(self, inner: DataProvider, cache: DiskCache, *, quote_ttl_min: float = 15,
                 chain_ttl_min: float = 60, history_ttl_min: float = 720):
        self.inner = inner
        self.cache = cache
        self._ttl = {"quote": quote_ttl_min * 60, "chain": chain_ttl_min * 60,
                     "history": history_ttl_min * 60}
        self.name = inner.name
        self.reliable = inner.reliable
        self.warning = inner.warning

    def get_quote(self, symbol: str) -> Quote:
        key = f"{self.name}|quote|{symbol}"
        hit = self.cache.get(key, self._ttl["quote"])
        if hit is not None:
            return Quote.from_dict(hit)
        quote = self.inner.get_quote(symbol)
        self.cache.set(key, quote.__dict__)
        return quote

    def get_price_history(self, symbol: str, days: int) -> list[Bar]:
        key = f"{self.name}|history|{symbol}|{days}"
        hit = self.cache.get(key, self._ttl["history"])
        if hit is not None:
            return [Bar.from_dict(b) for b in hit]
        bars = self.inner.get_price_history(symbol, days)
        if bars:
            self.cache.set(key, [b.to_dict() for b in bars])
        return bars

    def get_expirations(self, symbol: str) -> list[date]:
        key = f"{self.name}|expirations|{symbol}"
        hit = self.cache.get(key, self._ttl["chain"])
        if hit is not None:
            return [date.fromisoformat(d) for d in hit]
        exps = self.inner.get_expirations(symbol)
        if exps:
            self.cache.set(key, [d.isoformat() for d in exps])
        return exps

    def get_chain(self, symbol: str, expiry: date) -> list[OptionContract]:
        key = f"{self.name}|chain|{symbol}|{expiry.isoformat()}"
        hit = self.cache.get(key, self._ttl["chain"])
        if hit is not None:
            return [OptionContract.from_dict(c) for c in hit]
        chain = self.inner.get_chain(symbol, expiry)
        if chain:
            self.cache.set(key, [c.to_dict() for c in chain])
        return chain
