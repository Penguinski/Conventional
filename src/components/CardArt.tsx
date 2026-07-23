import type { GameCategory } from "../games/types";

export default function CardArt({ number, category }: { number: number; category: GameCategory }) {
  if (number === 1) {
    return <div className="art art-maze" aria-hidden="true"><i>A</i><b>×</b><span /><span /><span /><span /><span /></div>;
  }
  if (number === 2) {
    return <div className="art art-crowd" aria-hidden="true">{Array.from({ length: 18 }, (_, i) => <i className={i === 11 ? "odd" : ""} key={i} />)}</div>;
  }
  if (number === 3) {
    return <div className="art art-drawer" aria-hidden="true"><span /><span /><span /><i /></div>;
  }
  if (number === 4) {
    return <div className="art art-dots" aria-hidden="true">{[1, 5, 3, 2, 4, 7, 6].map((n) => <i key={n} data-n={n} />)}</div>;
  }
  if (number === 5) return <div className="art art-dust" aria-hidden="true"><span>RESTO</span></div>;
  if (number === 6) return <div className="art art-room" aria-hidden="true"><i /><b /><span /></div>;
  if (number === 7) return <div className="art art-plates" aria-hidden="true"><i /><i /><i /><b>?</b></div>;
  if (number === 8) return <div className="art art-letters" aria-hidden="true">S E G N O</div>;
  if (number === 9) return <div className="art art-crossword" aria-hidden="true">{Array.from({ length: 25 }, (_, i) => <i className={[1, 3, 5, 9, 15, 19, 21, 23].includes(i) ? "block" : ""} key={i} />)}</div>;
  if (number === 10) return <div className="art art-receipt" aria-hidden="true"><span>GESTI</span><i /><i /><i /><b>06</b></div>;
  if (number === 11) return <div className="art art-cup" aria-hidden="true"><i /><span /></div>;
  return <div className={`art art-foot ${category}`} aria-hidden="true"><i /><i /></div>;
}
