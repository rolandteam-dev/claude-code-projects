from datetime import date

from scanner.models import Bar, OptionContract, Quote
from scanner.providers.base import DataProvider
from scanner.providers.cache import CachingProvider, DiskCache


class FakeProvider(DataProvider):
    name = "fake"

    def __init__(self, chain=None):
        self.calls = {"quote": 0, "history": 0, "exp": 0, "chain": 0}
        self._chain = chain if chain is not None else [
            OptionContract("XYZ", date(2026, 12, 18), 100.0, "P", 1.0, 1.2, open_interest=900, iv=0.4)
        ]

    def get_quote(self, symbol):
        self.calls["quote"] += 1
        return Quote(symbol, 101.5, "2026-11-19T00:00:00+00:00")

    def get_price_history(self, symbol, days):
        self.calls["history"] += 1
        return [Bar(date(2026, 11, 18), 100, 102, 99, 101, 1_000_000)]

    def get_expirations(self, symbol):
        self.calls["exp"] += 1
        return [date(2026, 12, 18)]

    def get_chain(self, symbol, expiry):
        self.calls["chain"] += 1
        return self._chain


class Clock:
    def __init__(self):
        self.t = 1_000_000.0

    def __call__(self):
        return self.t


def make(tmp_path, chain=None, clock=None):
    clock = clock or Clock()
    fake = FakeProvider(chain)
    cp = CachingProvider(fake, DiskCache(tmp_path, now=clock), chain_ttl_min=60, quote_ttl_min=15)
    return fake, cp, clock


def test_second_call_is_served_from_cache(tmp_path):
    fake, cp, _ = make(tmp_path)
    first = cp.get_chain("XYZ", date(2026, 12, 18))
    second = cp.get_chain("XYZ", date(2026, 12, 18))
    assert fake.calls["chain"] == 1
    assert first == second
    assert cp.cache.hits == 1 and cp.cache.misses == 1


def test_round_trip_preserves_types(tmp_path):
    fake, cp, _ = make(tmp_path)
    cp.get_price_history("XYZ", 400)
    bars = cp.get_price_history("XYZ", 400)
    assert bars[0].date == date(2026, 11, 18) and isinstance(bars[0].date, date)
    cp.get_expirations("XYZ")
    assert cp.get_expirations("XYZ") == [date(2026, 12, 18)]
    cp.get_quote("XYZ")
    assert cp.get_quote("XYZ").price == 101.5
    assert fake.calls == {"quote": 1, "history": 1, "exp": 1, "chain": 0}


def test_entry_expires_after_ttl(tmp_path):
    fake, cp, clock = make(tmp_path)
    cp.get_quote("XYZ")
    clock.t += 14 * 60
    cp.get_quote("XYZ")
    assert fake.calls["quote"] == 1          # still fresh at 14 min
    clock.t += 2 * 60
    cp.get_quote("XYZ")
    assert fake.calls["quote"] == 2          # stale at 16 min


def test_empty_results_are_not_cached(tmp_path):
    fake, cp, _ = make(tmp_path, chain=[])
    cp.get_chain("XYZ", date(2026, 12, 18))
    cp.get_chain("XYZ", date(2026, 12, 18))
    assert fake.calls["chain"] == 2


def test_cache_persists_across_instances(tmp_path):
    fake, cp, clock = make(tmp_path)
    cp.get_chain("XYZ", date(2026, 12, 18))
    fake2, cp2, _ = make(tmp_path, clock=clock)
    cp2.get_chain("XYZ", date(2026, 12, 18))
    assert fake2.calls["chain"] == 0


def test_corrupt_cache_file_is_a_miss(tmp_path):
    fake, cp, _ = make(tmp_path)
    cp.get_chain("XYZ", date(2026, 12, 18))
    for f in tmp_path.glob("*.json"):
        f.write_text("{not json")
    cp.get_chain("XYZ", date(2026, 12, 18))
    assert fake.calls["chain"] == 2


def test_provider_metadata_is_passed_through(tmp_path):
    _, cp, _ = make(tmp_path)
    assert cp.name == "fake" and cp.reliable is True
