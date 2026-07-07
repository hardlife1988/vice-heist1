"""
Vice Heist — RTP Simulator.
Runs N spins (including free spins) and produces a full math report.
"""
import time
from collections import defaultdict
from gamestate import GameState


class Simulator:
    def __init__(self, config, num_spins: int = 1_000_000, bet_per_line: float = 1.0):
        self.config = config
        self.num_spins = num_spins
        self.bet_per_line = bet_per_line

        # Accumulators
        self.total_paid_spins = 0
        self.total_free_spins = 0
        self.total_bet = 0.0
        self.total_win = 0.0
        self.total_payline_win = 0.0
        self.total_scatter_win = 0.0

        self.win_counts = defaultdict(int)   # win_amount_bucket -> count
        self.symbol_wins = defaultdict(lambda: defaultdict(int))  # symbol -> count -> times
        self.zero_win_spins = 0
        self.trigger_count = 0              # scatter triggers

    # ------------------------------------------------------------------ #

    def run(self, verbose: bool = True):
        gs = GameState(self.config)
        gs.balance = 1e12   # unlimited credits for simulation

        start = time.time()
        base_spins_done = 0

        while base_spins_done < self.num_spins:
            # Paid spin
            result = gs.spin(bet_per_line=self.bet_per_line, is_free_spin=False)
            self._record(result, is_free=False)
            base_spins_done += 1

            # Drain any free spins immediately
            if result.free_spins_awarded:
                self.trigger_count += 1

            while gs.free_spins_remaining > 0:
                gs.consume_free_spin()
                fs_result = gs.spin(bet_per_line=self.bet_per_line, is_free_spin=True)
                self._record(fs_result, is_free=True)

        elapsed = time.time() - start
        self.total_spins_all = self.total_paid_spins + self.total_free_spins

        rtp = self.total_win / self.total_bet if self.total_bet > 0 else 0
        hit_rate = (self.total_paid_spins - self.zero_win_spins) / self.total_paid_spins

        if verbose:
            print(f"\n{'='*55}")
            print(f"  Vice Heist — RTP Simulation Results")
            print(f"{'='*55}")
            print(f"  Paid spins       : {self.total_paid_spins:>12,}")
            print(f"  Free spins       : {self.total_free_spins:>12,}")
            print(f"  Total spins      : {self.total_spins_all:>12,}")
            print(f"  Trigger count    : {self.trigger_count:>12,}")
            print(f"  Total bet        : {self.total_bet:>12,.2f}")
            print(f"  Total win        : {self.total_win:>12,.2f}")
            print(f"    Payline win    : {self.total_payline_win:>12,.2f}")
            print(f"    Scatter win    : {self.total_scatter_win:>12,.2f}")
            print(f"  RTP              : {rtp*100:>11.4f}%")
            print(f"  Hit rate (base)  : {hit_rate*100:>11.4f}%")
            print(f"  Elapsed          : {elapsed:>11.2f}s")
            print(f"{'='*55}\n")

        return self._build_report(rtp, hit_rate, elapsed)

    # ------------------------------------------------------------------ #

    def _record(self, result, is_free: bool):
        if is_free:
            self.total_free_spins += 1
        else:
            self.total_paid_spins += 1
            self.total_bet += self.bet_per_line * self.config.num_paylines
            if result.total_win == 0:
                self.zero_win_spins += 1

        self.total_win += result.total_win
        self.total_payline_win += sum(w["payout"] for w in result.payline_wins)
        self.total_scatter_win += result.scatter_payout

        # Win bucketing (in units of bet_per_line)
        bucket = int(result.total_win / self.bet_per_line)
        self.win_counts[bucket] += 1

        # Symbol win frequency
        for w in result.payline_wins:
            self.symbol_wins[w["symbol"]][w["count"]] += 1

    def _build_report(self, rtp: float, hit_rate: float, elapsed: float) -> dict:
        total_bet_per_spin = self.bet_per_line * self.config.num_paylines
        return {
            "game": self.config.name,
            "version": self.config.version,
            "simulation": {
                "paid_spins": self.total_paid_spins,
                "free_spins": self.total_free_spins,
                "total_spins": self.total_spins_all,
                "bet_per_line": self.bet_per_line,
                "total_bet_per_spin": total_bet_per_spin,
                "num_paylines": self.config.num_paylines,
            },
            "results": {
                "total_bet": round(self.total_bet, 2),
                "total_win": round(self.total_win, 2),
                "payline_win": round(self.total_payline_win, 2),
                "scatter_win": round(self.total_scatter_win, 2),
                "rtp": round(rtp, 6),
                "rtp_percent": round(rtp * 100, 4),
                "hit_rate": round(hit_rate, 6),
                "hit_rate_percent": round(hit_rate * 100, 4),
                "free_spin_triggers": self.trigger_count,
                "free_spins_per_trigger": (
                    round(self.total_free_spins / self.trigger_count, 2)
                    if self.trigger_count else 0
                ),
            },
            "symbol_win_frequency": {
                sym: {str(cnt): freq for cnt, freq in counts.items()}
                for sym, counts in self.symbol_wins.items()
            },
            "elapsed_seconds": round(elapsed, 2),
        }
