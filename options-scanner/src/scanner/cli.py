"""Command line entry point. Stage 1 commands: check-config, fetch."""

from __future__ import annotations

import argparse
import sys
from datetime import date
from pathlib import Path

from rich.console import Console
from rich.table import Table

from scanner.config import ConfigError, load_config
from scanner.providers import ProviderError, build_provider

DEFAULT_CONFIG = Path(__file__).resolve().parents[2] / "config.yaml"
console = Console()


def cmd_check_config(args) -> int:
    cfg = load_config(args.config)
    f = cfg.filters
    console.print(f"[green]Config OK[/green]: {Path(args.config).resolve()}")
    console.print(f"  mode={cfg.mode}  provider={cfg.provider.name}  cache={cfg.resolve(cfg.provider.cache_dir)}")
    console.print(f"  accounts: " + ", ".join(f"{a.name} ${a.size:,.0f}" for a in cfg.accounts)
                  + f"  (total ${cfg.total_account_size:,.0f})")
    console.print(f"  filters: IV {f.iv_measure} >= {f.min_iv_rank:g}, DTE {f.dte_min}-{f.dte_max}, "
                  f"|delta| {f.delta_min}-{f.delta_max}, OI >= {f.min_open_interest}, "
                  f"spread <= {f.max_spread_pct:g}%, price >= ${f.min_price:g}")
    on = [n for n, v in (("take_profit", cfg.exits.take_profit.enabled),
                         ("dte_close", cfg.exits.dte_close.enabled),
                         ("stop_loss", cfg.exits.stop_loss.enabled),
                         ("support_break", cfg.exits.support_break.enabled),
                         ("earnings_added", cfg.exits.earnings_added.enabled)) if v]
    console.print(f"  exit rules on: {', '.join(on) or 'none'}")
    return 0


def cmd_fetch(args) -> int:
    cfg = load_config(args.config)
    provider = build_provider(cfg, use_cache=not args.no_cache)
    symbol = args.symbol.upper()

    quote = provider.get_quote(symbol)
    console.print(f"{symbol} last price: [bold]${quote.price:,.2f}[/bold]")

    expirations = provider.get_expirations(symbol)
    if not expirations:
        console.print(f"[red]No option expirations returned for {symbol}.[/red]")
        return 1
    today = date.today()
    if args.expiry:
        expiry = date.fromisoformat(args.expiry)
    else:
        in_window = [e for e in expirations
                     if cfg.filters.dte_min <= (e - today).days <= cfg.filters.dte_max]
        expiry = in_window[0] if in_window else expirations[0]
    dte = (expiry - today).days
    in_range = cfg.filters.dte_min <= dte <= cfg.filters.dte_max
    console.print(f"{len(expirations)} expirations; using {expiry} ({dte} DTE"
                  + ("" if in_range else f", [yellow]outside the {cfg.filters.dte_min}-{cfg.filters.dte_max} DTE window[/yellow]")
                  + ")")

    chain = provider.get_chain(symbol, expiry)
    puts = sorted((c for c in chain if c.right == "P"), key=lambda c: abs(c.strike - quote.price))[:8]
    puts.sort(key=lambda c: c.strike)
    table = Table(title=f"{symbol} puts {expiry}: 8 strikes nearest the money")
    for col in ("Strike", "Bid", "Ask", "Spread %", "Open int", "Volume", "IV"):
        table.add_column(col, justify="right")
    for c in puts:
        sp = c.spread_pct
        table.add_row(f"{c.strike:g}", f"{c.bid:.2f}", f"{c.ask:.2f}",
                      "n/a" if sp is None else f"{sp:.1f}",
                      f"{c.open_interest:,}", f"{c.volume:,}",
                      "n/a" if c.iv is None else f"{c.iv * 100:.1f}%")
    console.print(table)

    bars = provider.get_price_history(symbol, 400)
    console.print(f"{len(bars)} daily bars" + (f" ({bars[0].date} to {bars[-1].date})" if bars else ""))

    cache = getattr(provider, "cache", None)
    if cache is not None:
        console.print(f"cache: {cache.hits} hits, {cache.misses} misses (dir {cache.dir})")
    return 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="scanner", description="Options-selling scanner. Never places trades.")
    p.add_argument("--config", default=str(DEFAULT_CONFIG), help="path to config.yaml")
    sub = p.add_subparsers(dest="command", required=True)
    sub.add_parser("check-config", help="validate config.yaml and print a summary").set_defaults(fn=cmd_check_config)
    f = sub.add_parser("fetch", help="fetch one ticker's quote, chain and history through the cache")
    f.add_argument("symbol")
    f.add_argument("--expiry", help="YYYY-MM-DD (default: first expiry inside the DTE window)")
    f.add_argument("--no-cache", action="store_true", help="bypass the disk cache")
    f.set_defaults(fn=cmd_fetch)
    return p


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        return args.fn(args)
    except (ConfigError, ProviderError) as exc:
        console.print(f"[red]error:[/red] {exc}")
        return 2


if __name__ == "__main__":
    sys.exit(main())
