from datetime import date

import pytest

from scanner.models import OptionContract


def opt(bid, ask):
    return OptionContract("XYZ", date(2026, 12, 18), 100.0, "P", bid, ask)


def test_mid_and_spread_pct():
    c = opt(0.90, 1.10)
    assert c.mid == pytest.approx(1.0)
    assert c.spread_pct == pytest.approx(20.0)


@pytest.mark.parametrize("bid,ask", [(0, 0.05), (0.5, 0), (1.2, 1.0)])
def test_unusable_quotes_have_no_spread(bid, ask):
    assert opt(bid, ask).spread_pct is None


def test_dict_round_trip():
    c = OptionContract("XYZ", date(2026, 12, 18), 95.0, "P", 1.0, 1.1, last=1.05,
                       volume=10, open_interest=600, iv=0.33, delta=-0.2, symbol="XYZ261218P00095000")
    assert OptionContract.from_dict(c.to_dict()) == c
