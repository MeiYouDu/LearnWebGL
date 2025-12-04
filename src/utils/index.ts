import { Color, MathUtils } from "three";

/**
 * 基于颜色计算 alpha
 */
export function alphaFromColor(color: Color): number {
	const hsl = color.getHSL({
		h: 0,
		s: 0,
		l: 0,
	});
	const l = MathUtils.smoothstep(hsl.l, 0, 0.5);
	const min = Math.min(color.r, color.g, color.b);
	const max = Math.max(color.r, color.g, color.b);
	const chroma = max - min;
	const raw = Math.min(1, chroma * 0.5 + l * 0.5); // 归一化
	const alpha = 0.01 + (1.0 - 0.01) * raw;
	return Math.max(0, Math.min(1, alpha));
}
