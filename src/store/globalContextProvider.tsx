import { GlobalContext } from "@/store/index.ts";
import { useTheme } from "ahooks";
import { ReactNode, useEffect } from "react";

function GlobalContextProvider({ children }: { children: ReactNode }) {
	const { theme, setThemeMode } = useTheme();
	useEffect(() => {
		setThemeMode("system");
	}, [setThemeMode]);
	return (
		<GlobalContext.Provider
			value={{
				theme,
			}}>
			{children}
		</GlobalContext.Provider>
	);
}

export { GlobalContextProvider };
