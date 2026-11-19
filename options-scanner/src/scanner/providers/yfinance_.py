"""yfinance adapter. PROTOTYPING ONLY.

Yahoo's options data is scraped, can be stale or incomplete (zero bids, missing
IV, odd after-hours values), has no greeks, and has no guarantees. Results from
this provider must not drive real trades.
"""

from __future__ import annotations

import math
import sys
from datetime import date, datetime, timedelta, timezone

from scanner.models import Bar, OptionContract, Quote
from scanner.providers.base import DataProvider, ProviderError

WARNING = (
    "WARNING: using yfinance. Its options data is unreliable (stale or zero quotes, "
    "missing/odd IV, no greeks, no uptime guarantee). Use it to prototype only. "
    "Do not trade off these results."
)


def _num(value, default=0.0) -> float:
    """pandas NaN/None -> default."""
    try:
        f = float(value)
    except (TypeError, ValueError):
        return default
    return default if math.isnan(f) else f


class YFinanceProvider(DataProvider):
    name = "yfinance"
    reliable = False
    warning = WARNING

    def __init__(self, *, announce: bool = True):
        try:
            import yfinance
        except ImportError as exc:  # pragma: no cover
            raise ProviderError("yfinance is not installed: pip install yfinance") from exc
        self._yf = yfinance
        if announce:
            print(WARNING, file=sys.stderr)

    def _ticker(self, symbol: str):
        return self._yf.Ticker(symbol.upper())

    def get_quote(self, symbol: str) -> Quote:
        try:
            price = _num(self._ticker(symbol).fast_info["last_price"], default=0.0)
        except Exception as exc:
            raise ProviderError(f"yfinance quote failed for {symbol}: {exc}") from exc
        if price <= 0:
            raise ProviderError(f"yfinance returned no price for {symbol}")
        return Quote(symbol.upper(), price, datetime.now(timezone.utc).isoformat())

    def get_price_history(self, symbol: str, days: int) -> list[Bar]:
        start = date.today() - timedelta(days=days)
        try:
            df = self._ticker(symbol).history(start=start.isoformat(), auto_adjust=False)
        except Exception as exc:
            raise ProviderError(f"yfinance history failed for {symbol}: {exc}") from exc
        bars = []
        for ts, row in df.iterrows():
            close = _num(row.get("Close"), default=0.0)
            if close <= 0:
                continue
            bars.append(Bar(ts.date(), _num(row["Open"]), _num(row["High"]),
                            _num(row["Low"]), close, _num(row["Volume"])))
        return bars

    def get_expirations(self, symbol: str) -> list[date]:
        try:
            raw = self._ticker(symbol).options
        except Exception as exc:
            raise ProviderError(f"yfinance expirations failed for {symbol}: {exc}") from exc
        return sorted(date.fromisoformat(d) for d in raw)

    def get_chain(self, symbol: str, expiry: date) -> list[OptionContract]:
        try:
            chain = self._ticker(symbol).option_chain(expiry.isoformat())
        except Exception as exc:
            raise ProviderError(f"yfinance chain failed for {symbol} {expiry}: {exc}") from exc
        out: list[OptionContract] = []
        for right, frame in (("P", chain.puts), ("C", chain.calls)):
            for _, row in frame.iterrows():
                iv = _num(row.get("impliedVolatility"), default=0.0)
                out.append(OptionContract(
                    underlying=symbol.upper(),
                    expiry=expiry,
                    strike=_num(row["strike"]),
                    right=right,
                    bid=_num(row.get("bid")),
                    ask=_num(row.get("ask")),
                    last=_num(row.get("lastPrice"), default=0.0) or None,
                    volume=int(_num(row.get("volume"))),
                    open_interest=int(_num(row.get("openInterest"))),
                    iv=iv if iv > 0 else None,
                    delta=None,  # yfinance has no greeks; Stage 2 computes delta from IV
                    symbol=str(row.get("contractSymbol", "")),
                ))
        return out
