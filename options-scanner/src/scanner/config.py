"""Typed configuration loaded from YAML.

Defaults live in the dataclasses; config.yaml overrides them. Unknown keys and
out-of-range values raise ConfigError (all problems reported at once).
"""

from __future__ import annotations

import dataclasses
import types
import typing
from dataclasses import dataclass, field
from pathlib import Path

import yaml


class ConfigError(ValueError):
    pass


@dataclass
class ProviderConfig:
    name: str = "yfinance"
    cache_dir: str = ".cache"
    quote_ttl_minutes: int = 15
    chain_ttl_minutes: int = 60
    history_ttl_minutes: int = 720


@dataclass
class UniverseConfig:
    include_sp500: bool = True
    watchlist_file: str = "watchlist.txt"
    exclude: list[str] = field(default_factory=list)
    max_tickers: int | None = None


@dataclass
class FiltersConfig:
    iv_measure: str = "rank"
    min_iv_rank: float = 50.0
    dte_min: int = 30
    dte_max: int = 45
    delta_min: float = 0.15
    delta_max: float = 0.30
    min_open_interest: int = 500
    max_spread_pct: float = 10.0
    min_avg_volume: int = 1_000_000
    exclude_earnings: bool = True
    exclude_ex_dividend: bool = True
    trend_ma_days: int = 50
    covered_call_stretch_pct: float = 10.0
    min_annualized_return_pct: float = 15.0
    min_price: float = 20.0


@dataclass
class TakeProfitConfig:
    enabled: bool = True
    pct_of_max_credit: float = 50.0


@dataclass
class DteCloseConfig:
    enabled: bool = True
    dte: int = 21
    action: str = "close"


@dataclass
class StopLossConfig:
    enabled: bool = True
    multiple_of_credit: float = 2.0


@dataclass
class ToggleConfig:
    enabled: bool = True


@dataclass
class RollConfig:
    require_net_credit: bool = True
    flag_delaying_loss: bool = True


@dataclass
class ExitsConfig:
    take_profit: TakeProfitConfig = field(default_factory=TakeProfitConfig)
    dte_close: DteCloseConfig = field(default_factory=DteCloseConfig)
    stop_loss: StopLossConfig = field(default_factory=StopLossConfig)
    support_break: ToggleConfig = field(default_factory=ToggleConfig)
    earnings_added: ToggleConfig = field(default_factory=ToggleConfig)
    roll: RollConfig = field(default_factory=RollConfig)


@dataclass
class AccountConfig:
    name: str = "combined"
    size: float = 372_000.0


@dataclass
class RiskConfig:
    max_position_pct: float = 5.0
    max_ticker_pct: float = 25.0
    max_sector_pct: float = 30.0


@dataclass
class Config:
    mode: str = "paper"
    provider: ProviderConfig = field(default_factory=ProviderConfig)
    universe: UniverseConfig = field(default_factory=UniverseConfig)
    filters: FiltersConfig = field(default_factory=FiltersConfig)
    exits: ExitsConfig = field(default_factory=ExitsConfig)
    accounts: list[AccountConfig] = field(default_factory=lambda: [AccountConfig()])
    risk: RiskConfig = field(default_factory=RiskConfig)
    # Directory the config file lives in. Not a YAML key; used to resolve relative paths.
    base_dir: Path = field(default_factory=Path.cwd, metadata={"yaml": False})

    @property
    def total_account_size(self) -> float:
        return sum(a.size for a in self.accounts)

    def resolve(self, relative: str) -> Path:
        p = Path(relative)
        return p if p.is_absolute() else self.base_dir / p


# --------------------------------------------------------------------------- loading


def _is_yaml_field(f: dataclasses.Field) -> bool:
    return f.metadata.get("yaml", True)


def _build(cls: type, data: object, path: str):
    if data is None:
        data = {}
    if not isinstance(data, dict):
        raise ConfigError(f"{path}: expected a mapping, got {type(data).__name__}")
    flds = [f for f in dataclasses.fields(cls) if _is_yaml_field(f)]
    unknown = set(data) - {f.name for f in flds}
    if unknown:
        raise ConfigError(f"{path}: unknown key(s): {', '.join(sorted(map(str, unknown)))}")
    hints = typing.get_type_hints(cls)
    kwargs = {f.name: _convert(hints[f.name], data[f.name], f"{path}.{f.name}")
              for f in flds if f.name in data}
    return cls(**kwargs)


def _convert(tp, value, path: str):
    origin = typing.get_origin(tp)
    if origin in (typing.Union, types.UnionType):
        args = [a for a in typing.get_args(tp) if a is not type(None)]
        if value is None:
            return None
        return _convert(args[0], value, path)
    if dataclasses.is_dataclass(tp):
        return _build(tp, value, path)
    if origin is list:
        (inner,) = typing.get_args(tp)
        if not isinstance(value, list):
            raise ConfigError(f"{path}: expected a list, got {type(value).__name__}")
        return [_convert(inner, v, f"{path}[{i}]") for i, v in enumerate(value)]
    if tp is bool:
        if not isinstance(value, bool):
            raise ConfigError(f"{path}: expected true/false, got {value!r}")
        return value
    if tp in (int, float):
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ConfigError(f"{path}: expected a number, got {value!r}")
        if tp is int and isinstance(value, float) and not value.is_integer():
            raise ConfigError(f"{path}: expected a whole number, got {value!r}")
        return tp(value)
    if tp is str:
        if not isinstance(value, str):
            raise ConfigError(f"{path}: expected text, got {value!r}")
        return value
    return value


def validate(cfg: Config) -> None:
    errs: list[str] = []
    f, e, r = cfg.filters, cfg.exits, cfg.risk

    def check(ok: bool, msg: str) -> None:
        if not ok:
            errs.append(msg)

    check(cfg.mode == "paper", "mode: only 'paper' is supported (this tool never places trades)")
    check(cfg.provider.name in ("yfinance", "schwab"), "provider.name: must be yfinance or schwab")
    check(f.iv_measure in ("rank", "percentile"), "filters.iv_measure: must be rank or percentile")
    check(0 <= f.min_iv_rank <= 100, "filters.min_iv_rank: must be 0-100")
    check(0 < f.dte_min <= f.dte_max, "filters: need 0 < dte_min <= dte_max")
    check(0 < f.delta_min <= f.delta_max < 1, "filters: need 0 < delta_min <= delta_max < 1")
    check(f.min_open_interest >= 0, "filters.min_open_interest: must be >= 0")
    check(0 < f.max_spread_pct <= 100, "filters.max_spread_pct: must be in (0, 100]")
    check(f.min_avg_volume >= 0, "filters.min_avg_volume: must be >= 0")
    check(f.trend_ma_days >= 2, "filters.trend_ma_days: must be >= 2")
    check(f.min_price >= 0, "filters.min_price: must be >= 0")
    check(0 < e.take_profit.pct_of_max_credit < 100, "exits.take_profit.pct_of_max_credit: must be in (0, 100)")
    check(e.stop_loss.multiple_of_credit > 0, "exits.stop_loss.multiple_of_credit: must be > 0")
    check(e.dte_close.dte >= 0, "exits.dte_close.dte: must be >= 0")
    check(e.dte_close.action in ("close", "roll"), "exits.dte_close.action: must be close or roll")
    check(len(cfg.accounts) > 0, "accounts: define at least one account")
    check(all(a.size > 0 for a in cfg.accounts), "accounts: every size must be > 0")
    names = [a.name for a in cfg.accounts]
    check(len(names) == len(set(names)), "accounts: names must be unique")
    for name, v in (("max_position_pct", r.max_position_pct),
                    ("max_ticker_pct", r.max_ticker_pct),
                    ("max_sector_pct", r.max_sector_pct)):
        check(0 < v <= 100, f"risk.{name}: must be in (0, 100]")
    if errs:
        raise ConfigError("invalid config:\n  - " + "\n  - ".join(errs))


def load_config(path: str | Path) -> Config:
    p = Path(path)
    if not p.is_file():
        raise ConfigError(f"config file not found: {p}")
    try:
        raw = yaml.safe_load(p.read_text())
    except yaml.YAMLError as exc:
        raise ConfigError(f"{p}: invalid YAML: {exc}") from exc
    cfg = _build(Config, raw, "config")
    cfg.base_dir = p.resolve().parent
    validate(cfg)
    return cfg
