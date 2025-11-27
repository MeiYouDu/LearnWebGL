import { createContext } from "react";

export * from "./globalContextProvider.tsx";

/**
 * 全局上下文类型
 */
interface GlobalContextType {
	theme: "light" | "dark";
}

/**
 * 全局上下文
 */
const GlobalContext = createContext<GlobalContextType>(
	{} as GlobalContextType,
);

export { GlobalContext };
export type { GlobalContextType };
