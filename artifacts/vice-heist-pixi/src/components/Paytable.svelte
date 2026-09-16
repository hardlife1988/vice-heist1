<script lang="ts">
  import { PAYTABLE, FREESPIN_TRIGGERS, WINCAP, RTP, NUM_PAYLINES, BET_MODES, FREEGAME_WILD_MULTIPLIERS } from "../lib/gameConfig";
  import { SYMBOL_IDS, symbolSrc, SYMBOL_LABEL } from "../lib/assets";
  import type { SymbolId } from "../lib/gameConfig";

  interface Props {
    onClose: () => void;
  }
  let { onClose }: Props = $props();

  const counts = [5, 4, 3];
  const paySymbols = SYMBOL_IDS.filter((s) => s !== "SC" && s !== "BV");
  const wildMults = Object.keys(FREEGAME_WILD_MULTIPLIERS)
    .map(Number)
    .sort((a, b) => a - b);
</script>

<div class="scrim" role="dialog" aria-modal="true" aria-labelledby="rules-title">
  <div class="panel">
    <header>
      <h2 id="rules-title">Vice Heist — Rules & Paytable</h2>
      <button class="x" onclick={onClose} aria-label="Close">×</button>
    </header>
    <div class="body">
      <section>
        <h3>Game info</h3>
        <ul>
          <li>5 reels × 3 rows, {NUM_PAYLINES} paylines, left to right.</li>
          <li>RTP: <strong>{(RTP * 100).toFixed(2)}%</strong> (base and bonus buy).</li>
          <li>Maximum win: <strong>{WINCAP}x</strong> total bet per mode.</li>
          <li>Base mode cost: {BET_MODES.base.cost}x bet. Bonus buy cost: {BET_MODES.bonus.cost}x bet.</li>
          <li>Wild (W) substitutes for all symbols except Scatter.</li>
          <li>3 / 4 / 5 Scatters award {FREESPIN_TRIGGERS.base[3]} / {FREESPIN_TRIGGERS.base[4]} / {FREESPIN_TRIGGERS.base[5]} free spins.</li>
          <li>During free spins, Wilds carry a random multiplier ({wildMults.map((m) => `${m}x`).join(", ")}).</li>
          <li>3+ Scatters in free spins retrigger extra spins ({FREESPIN_TRIGGERS.free[3]}/{FREESPIN_TRIGGERS.free[4]}/{FREESPIN_TRIGGERS.free[5]}+).</li>
          <li>Each bet is independent. No jackpot, gamble, or persistence between rounds.</li>
        </ul>
      </section>
      <section>
        <h3>Symbol pays (x total bet)</h3>
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              {#each counts as n}<th>{n}</th>{/each}
            </tr>
          </thead>
          <tbody>
            {#each paySymbols as id}
              <tr>
                <td class="sym">
                  <img src={symbolSrc(id as SymbolId)} alt={SYMBOL_LABEL[id as SymbolId]} />
                  <span>{SYMBOL_LABEL[id as SymbolId]}</span>
                </td>
                {#each counts as n}
                  <td>{PAYTABLE[n][id as SymbolId] ?? "—"}</td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </section>
    </div>
  </div>
</div>

<style>
  .scrim {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.78);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 40;
    padding: 12px;
  }
  .panel {
    background: #120e0a;
    color: #f3e6c4;
    border: 1px solid #c9a227;
    border-radius: 12px;
    max-width: 560px;
    width: 100%;
    max-height: min(88dvh, 720px);
    overflow: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    border-bottom: 1px solid #3a2a10;
    position: sticky;
    top: 0;
    background: #120e0a;
  }
  h2 {
    margin: 0;
    font-size: 1.05rem;
    letter-spacing: 0.04em;
  }
  .x {
    background: transparent;
    color: #f3e6c4;
    border: 0;
    font-size: 1.6rem;
    cursor: pointer;
    line-height: 1;
  }
  .body {
    padding: 16px;
  }
  h3 {
    margin: 0 0 8px;
    color: #c9a227;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }
  ul {
    margin: 0 0 18px;
    padding-left: 18px;
    line-height: 1.45;
    font-size: 0.92rem;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.88rem;
  }
  th,
  td {
    padding: 6px 8px;
    border-bottom: 1px solid #2a2014;
    text-align: center;
  }
  th:first-child,
  td:first-child {
    text-align: left;
  }
  .sym {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .sym img {
    width: 36px;
    height: 36px;
    border-radius: 6px;
  }
</style>
