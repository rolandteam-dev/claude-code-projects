"""Provider-neutral data models. Providers convert their raw payloads into these."""

from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import date


@dataclass(frozen=True)
class Quote:
    symbol: str
    price: float
    as_of: str  # ISO timestamp of when the quote was fetched

    @classmethod
    def from_dict(cls, d: dict) -> "Quote":
        return cls(**d)


@dataclass(frozen=True)
class Bar:
    date: date
    open: float
    high: float
    low: float
    close: float
    volume: float

    def to_dict(self) -> dict:
        d = asdict(self)
        d["date"] = self.date.isoformat()
        return d

    @classmethod
    def from_dict(cls, d: dict) -> "Bar":
        return cls(**{**d, "date": date.fromisoformat(d["date"])})


@dataclass(frozen=True)
class OptionContract:
    underlying: str
    expiry: date
    strike: float
    right: str                      # "P" or "C"
    bid: float
    ask: float
    last: float | None = None
    volume: int = 0
    open_interest: int = 0
    iv: float | None = None         # decimal, e.g. 0.35 = 35%
    delta: float | None = None      # signed; None when the provider doesn't supply greeks
    symbol: str = ""

    @property
    def mid(self) -> float:
        return (self.bid + self.ask) / 2

    @property
    def spread_pct(self) -> float | None:
        """Bid/ask spread as a percent of mid; None when there is no usable quote."""
        if self.bid <= 0 or self.ask <= 0 or self.ask < self.bid:
            return None
        return (self.ask - self.bid) / self.mid * 100

    def to_dict(self) -> dict:
        d = asdict(self)
        d["expiry"] = self.expiry.isoformat()
        return d

    @classmethod
    def from_dict(cls, d: dict) -> "OptionContract":
        return cls(**{**d, "expiry": date.fromisoformat(d["expiry"])})
