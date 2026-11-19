"""The one interface every market-data source implements.

Scanner code depends only on DataProvider, so swapping yfinance for Schwab (or
anything else) means writing one adapter and changing one config line.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import date

from scanner.models import Bar, OptionContract, Quote


class ProviderError(RuntimeError):
    pass


class DataProvider(ABC):
    name: str = "base"
    # False for sources whose options data can't be trusted for real decisions.
    reliable: bool = True
    warning: str | None = None

    @abstractmethod
    def get_quote(self, symbol: str) -> Quote: ...

    @abstractmethod
    def get_price_history(self, symbol: str, days: int) -> list[Bar]:
        """Daily bars, oldest first, unadjusted for dividends, at least `days` calendar days."""

    @abstractmethod
    def get_expirations(self, symbol: str) -> list[date]:
        """Available option expiration dates, ascending."""

    @abstractmethod
    def get_chain(self, symbol: str, expiry: date) -> list[OptionContract]:
        """Puts and calls for one expiration."""
