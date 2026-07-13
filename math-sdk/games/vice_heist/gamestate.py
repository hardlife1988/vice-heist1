from game_override import GameStateOverride


class GameState(GameStateOverride):
    """Vice Heist — top-level game loop for base-game and free-spin rounds."""

    # Safety ceiling on total free spins per round. Retriggers accumulate
    # (tot_fs += freespin_triggers[...]) uncapped; a rare but real scatter
    # cascade on some reel/multiplier combos can retrigger faster than spins
    # deplete, which never terminates. No real payout ever needs anywhere
    # near this many spins, so capping here is a pure safety net, not a
    # math/RTP change.
    MAX_FREE_SPINS = 500

    def run_spin(self, sim, simulation_seed=None):
        self.reset_seed(sim)
        self.repeat = True
        while self.repeat:
            self.reset_book()
            self.draw_board()

            self.evaluate_lines_board()

            self.win_manager.update_gametype_wins(self.gametype)
            if self.check_fs_condition():
                self.run_freespin_from_base()

            self.evaluate_finalwin()
            self.check_repeat()
        self.imprint_wins()

    def run_freespin(self):
        self.reset_fs_spin()
        while self.fs < self.tot_fs and not self.wincap_triggered:
            self.update_freespin()
            self.draw_board()

            self.evaluate_lines_board()

            if self.check_fs_condition() and not self.wincap_triggered:
                self.update_fs_retrigger_amt()
                if self.tot_fs > self.MAX_FREE_SPINS:
                    self.tot_fs = self.MAX_FREE_SPINS

            self.win_manager.update_gametype_wins(self.gametype)

        self.end_freespin()
