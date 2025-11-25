import { createContext } from "react";

export * from "./globalContextProvider.tsx";

/**
 * 全局上下文类型
 */
interface GlobalContextType {
	size: number;
	setSize(size: number): void;
	doSome(): void;
	list: Array<{
		name: string;
		sex: number;
		age: number;
	}>;
}

/**
 * 全局上下文
 */
const GlobalContext = createContext<GlobalContextType>(
	{} as GlobalContextType,
);

export { GlobalContext };
export type { GlobalContextType };
