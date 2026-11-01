import { COURT, type Vec } from '../../../packages/shared/src/index';

// Geometria visual comum: simples, sem corredores de duplas.
const w = COURT.halfWidth, b = COURT.baseline, s = COURT.service;
export const COURT_LINES: {from: Vec; to: Vec}[] = [
  {from:{x:-w,y:-b},to:{x:w,y:-b}},
  {from:{x:w,y:-b},to:{x:w,y:b}},
  {from:{x:w,y:b},to:{x:-w,y:b}},
  {from:{x:-w,y:b},to:{x:-w,y:-b}},
  {from:{x:-w,y:-s},to:{x:w,y:-s}},
  {from:{x:-w,y:s},to:{x:w,y:s}},
  {from:{x:0,y:-s},to:{x:0,y:s}},
  {from:{x:0,y:-b},to:{x:0,y:-b+.15}},
  {from:{x:0,y:b},to:{x:0,y:b-.15}},
];
export function courtLinePath(project: (p: Vec) => Vec) {
  return COURT_LINES.map(({from,to}) => {
    const a = project(from), z = project(to);
    return `M${a.x.toFixed(2)} ${a.y.toFixed(2)}L${z.x.toFixed(2)} ${z.y.toFixed(2)}`;
  }).join(' ');
}
