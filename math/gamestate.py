"""
Vice Heist — Spin engine.
Handles reel spin, window generation, payline evaluation, scatter detection,
and free-spin triggering.
"""
import random
from symbols import (WILD, SCATTER, PAYLINE_PAYS, SCATTER_PAYS,
                     FREE_SPIN_AWARDS, FREE_SPIN_MULTIPLIER)


class SpinResult:
    def __init__(self):
        self.positions = []        # [reel0_stop, reel1_stop, …]
        self.window = []           # 3×5 grid: window[row][reel]
        self.payline_wins = []     # list of {line, symbol, count, payout}
        self.scatter_count = 0
        self.scatter_payout = 0.0
        self.free_spins_awarded = 0
        self.total_win = 0.0
        self.is_free_spin = False
        self.multiplier = 1

    def to_dict(self):
        return {
            "positions": self.positions,
            "window": self.window,
            "payline_wins": self.payline_wins,
            "scatter_count": self.scatter_count,
            "scatter_payout": self.scatter_payout,
            "free_spins_awarded": self.free_spins_awarded,
            "total_win": round(self.total_win, 4),
            "is_free_spin": self.is_free_spin,
            "multiplier": self.multiplier,
        }


class GameState:
    def __init__(self, config):
        self.config = config
        self.balance = 0.0
        self.total_bet = 0.0
        self.total_win = 0.0
        self.spin_count = 0
        self.free_spins_remaining = 0
        self.free_spins_total = 0

    # ------------------------------------------------------------------ #
    #  Core spin                                                           #
    # ------------------------------------------------------------------ #
    def spin(self, bet_per_line: float = 1.0, is_free_spin: bool = False) -> SpinResult:
        """Execute one spin and return a SpinResult.

        Args:
            bet_per_line: credits wagered per payline
            is_free_spin:  True when this spin consumes a free-spin credit
        """
        result = SpinResult()
        result.is_free_spin = is_free_spin
        result.multiplier = FREE_SPIN_MULTIPLIER if is_free_spin else 1

        total_bet = bet_per_line * self.config.num_paylines
        if not is_free_spin:
            self.balance -= total_bet
            self.total_bet += total_bet
        self.spin_count += 1

        # Roll reels
        strips = self.config.reel_strips
        result.positions = [random.randrange(len(strips[r])) for r in range(self.config.reels)]

        # Build 3×5 window
        rows, reels = self.config.rows, self.config.reels
        result.window = []
        for row in range(rows):
            result.window.append([
                strips[r][(result.positions[r] + row) % len(strips[r])]
                for r in range(reels)
            ])

        # Evaluate paylines
        payline_win = 0.0
        for line_idx, pattern in enumerate(self.config.paylines):
            symbols_on_line = [result.window[pattern[r]][r] for r in range(reels)]
            win, sym, count = self._evaluate_line(symbols_on_line, bet_per_line)
            if win > 0:
                win *= result.multiplier
                result.payline_wins.append({
                    "line": line_idx + 1,
                    "symbol": sym,
                    "count": count,
                    "payout": round(win, 4),
                })
                payline_win += win

        # Count scatters anywhere on grid
        scatter_count = sum(row.count(SCATTER) for row in result.window)
        result.scatter_count = scatter_count
        if scatter_count >= 3:
            scatter_mult = SCATTER_PAYS.get(scatter_count, 0)
            result.scatter_payout = round(scatter_mult * total_bet * result.multiplier, 4)
            result.free_spins_awarded = FREE_SPIN_AWARDS.get(scatter_count, 0)
            if result.free_spins_awarded:
                self.free_spins_remaining += result.free_spins_awarded
                self.free_spins_total += result.free_spins_awarded

        result.total_win = round(payline_win + result.scatter_payout, 4)
        self.balance += result.total_win
        self.total_win += result.total_win
        return result

    # ------------------------------------------------------------------ #
    #  Payline evaluator                                                   #
    # ------------------------------------------------------------------ #
    @staticmethod
    def _evaluate_line(symbols: list, bet_per_line: float):
        """
        Return (payout, winning_symbol, count) for a 5-symbol payline.
        WILD substitutes for any non-SCATTER symbol.
        """
        # Determine lead symbol (first non-WILD)
        lead = None
        for s in symbols:
            if s != WILD:
                if s == SCATTER:
                    return 0.0, None, 0   # scatter not paid on paylines
                lead = s
                break

        if lead is None:
            lead = WILD  # all wilds

        # Count consecutive matching symbols from left (WILD counts as lead)
        count = 0
        for s in symbols:
            if s == lead or s == WILD:
                count += 1
            else:
                break

        if count < 3:
            return 0.0, None, 0

        pay_table = PAYLINE_PAYS.get(lead, {})
        payout = pay_table.get(count, 0) * bet_per_line
        return payout, lead, count

    # ------------------------------------------------------------------ #
    #  State helpers                                                       #
    # ------------------------------------------------------------------ #
    def consume_free_spin(self) -> bool:
        if self.free_spins_remaining > 0:
            self.free_spins_remaining -= 1
            return True
        return False

    def reset(self):
        self.balance = 0.0
        self.total_bet = 0.0
        self.total_win = 0.0
        self.spin_count = 0
        self.free_spins_remaining = 0
        self.free_spins_total = 0

    def to_dict(self):
        rtp = (self.total_win / self.total_bet) if self.total_bet > 0 else 0
        return {
            "balance": round(self.balance, 4),
            "total_bet": round(self.total_bet, 4),
            "total_win": round(self.total_win, 4),
            "rtp": round(rtp, 6),
            "spin_count": self.spin_count,
            "free_spins_total": self.free_spins_total,
        }
