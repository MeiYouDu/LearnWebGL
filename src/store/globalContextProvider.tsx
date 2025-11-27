import { GlobalContext } from "@/store/index.ts";
import { ReactNode, useEffect } from "react";
import { useTheme } from "ahooks";

function GlobalContextProvider({
	children,
}: {
	children: ReactNode;
}) {
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
