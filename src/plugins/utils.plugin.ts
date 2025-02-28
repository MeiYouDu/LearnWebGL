import { throttle } from "lodash";

class UtilsPlugin {
	install() {
		const _ResizeObserver = window.ResizeObserver;
		window.ResizeObserver = class ResizeObserver extends (
			_ResizeObserver
		) {
			constructor(cb: ResizeObserverCallback) {
				cb = throttle(cb, 16);
				super(cb);
			}
		};
	}
}

export default UtilsPlugin;
