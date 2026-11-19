"""Provider factory: the single place that maps a config name to an adapter."""

from __future__ import annotations

from scanner.config import Config
from scanner.providers.base import DataProvider, ProviderError
from scanner.providers.cache import CachingProvider, DiskCache


def build_provider(cfg: Config, *, use_cache: bool = True, announce: bool = True) -> DataProvider:
    name = cfg.provider.name
    if name == "yfinance":
        from scanner.providers.yfinance_ import YFinanceProvider
        inner: DataProvider = YFinanceProvider(announce=announce)
    elif name == "schwab":
        raise ProviderError("The Schwab adapter is built in Stage 6. Use provider.name: yfinance for now.")
    else:
        raise ProviderError(f"unknown provider: {name}")
    if not use_cache:
        return inner
    p = cfg.provider
    return CachingProvider(
        inner,
        DiskCache(cfg.resolve(p.cache_dir)),
        quote_ttl_min=p.quote_ttl_minutes,
        chain_ttl_min=p.chain_ttl_minutes,
        history_ttl_min=p.history_ttl_minutes,
    )


__all__ = ["DataProvider", "ProviderError", "CachingProvider", "DiskCache", "build_provider"]
