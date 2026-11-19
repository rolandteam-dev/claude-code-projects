from pathlib import Path

import pytest

from scanner.config import ConfigError, load_config

REPO_CONFIG = Path(__file__).resolve().parents[1] / "config.yaml"


def write(tmp_path, text: str) -> Path:
    p = tmp_path / "config.yaml"
    p.write_text(text)
    return p


def test_shipped_config_loads_with_documented_defaults():
    cfg = load_config(REPO_CONFIG)
    f = cfg.filters
    assert (f.min_iv_rank, f.dte_min, f.dte_max) == (50, 30, 45)
    assert (f.delta_min, f.delta_max) == (0.15, 0.30)
    assert (f.min_open_interest, f.max_spread_pct, f.min_avg_volume) == (500, 10, 1_000_000)
    assert (f.min_annualized_return_pct, f.min_price) == (15, 20)
    assert cfg.exits.take_profit.pct_of_max_credit == 50
    assert cfg.exits.dte_close.dte == 21
    assert cfg.exits.stop_loss.multiple_of_credit == 2.0
    assert cfg.mode == "paper"
    assert cfg.total_account_size == 372_000


def test_empty_file_gives_defaults(tmp_path):
    cfg = load_config(write(tmp_path, ""))
    assert cfg.filters.min_iv_rank == 50
    assert cfg.provider.name == "yfinance"


def test_override_and_int_to_float_coercion(tmp_path):
    cfg = load_config(write(tmp_path, "filters:\n  min_iv_rank: 60\n  min_price: 25\n"))
    assert cfg.filters.min_iv_rank == 60.0 and isinstance(cfg.filters.min_iv_rank, float)
    assert cfg.filters.min_price == 25.0 and isinstance(cfg.filters.min_price, float)
    assert cfg.filters.dte_min == 30  # untouched keys keep defaults


def test_unknown_key_is_rejected(tmp_path):
    with pytest.raises(ConfigError, match="unknown key.*min_iv_rnak"):
        load_config(write(tmp_path, "filters:\n  min_iv_rnak: 60\n"))


def test_wrong_type_is_rejected(tmp_path):
    with pytest.raises(ConfigError, match="expected a number"):
        load_config(write(tmp_path, "filters:\n  min_iv_rank: high\n"))
    with pytest.raises(ConfigError, match="expected true/false"):
        load_config(write(tmp_path, "filters:\n  exclude_earnings: 'yes please'\n"))


def test_bool_not_accepted_as_number(tmp_path):
    with pytest.raises(ConfigError, match="expected a number"):
        load_config(write(tmp_path, "filters:\n  min_price: true\n"))


def test_all_range_errors_reported_together(tmp_path):
    text = "filters:\n  dte_min: 50\n  dte_max: 30\n  delta_min: 0.5\n  delta_max: 0.2\n"
    with pytest.raises(ConfigError) as exc:
        load_config(write(tmp_path, text))
    msg = str(exc.value)
    assert "dte_min <= dte_max" in msg and "delta_min <= delta_max" in msg


def test_live_trading_mode_is_refused(tmp_path):
    with pytest.raises(ConfigError, match="never places trades"):
        load_config(write(tmp_path, "mode: live\n"))


def test_accounts_replace_default_and_total(tmp_path):
    text = "accounts:\n  - {name: a, size: 100000}\n  - {name: b, size: 50000.5}\n"
    cfg = load_config(write(tmp_path, text))
    assert [a.name for a in cfg.accounts] == ["a", "b"]
    assert cfg.total_account_size == 150000.5


def test_duplicate_account_names_rejected(tmp_path):
    with pytest.raises(ConfigError, match="unique"):
        load_config(write(tmp_path, "accounts:\n  - {name: a, size: 1}\n  - {name: a, size: 2}\n"))


def test_optional_null_and_relative_paths(tmp_path):
    cfg = load_config(write(tmp_path, "universe:\n  max_tickers: null\nprovider:\n  cache_dir: c\n"))
    assert cfg.universe.max_tickers is None
    assert cfg.resolve(cfg.provider.cache_dir) == tmp_path.resolve() / "c"


def test_missing_file_and_bad_yaml(tmp_path):
    with pytest.raises(ConfigError, match="not found"):
        load_config(tmp_path / "nope.yaml")
    with pytest.raises(ConfigError, match="invalid YAML"):
        load_config(write(tmp_path, "filters: [unclosed\n"))
