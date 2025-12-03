import { Color } from "three";

/**
 * 基于颜色计算 alpha
 */
export function alphaFromColor(color: Color): number {
	const hsl = color.getHSL({
		h: 0,
		s: 0,
		l: 0,
	});
	const s = hsl.s;
	const l = Math.max(
		0,
		Math.sin(Math.PI * (0.5 - Math.abs(hsl.l - 0.5))),
	);
	const sTerm = Math.pow(s, 1.0);
	const mTerm = Math.pow(l, 1.0);
	const raw = Math.min(1, sTerm * mTerm); // 归一化
	const alpha = 0.01 + (1.0 - 0.01) * raw;
	return Math.max(0, Math.min(1, alpha));
}
