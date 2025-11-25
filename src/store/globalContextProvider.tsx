import {
	GlobalContext,
	GlobalContextType,
} from "@/store/index.ts";
import { useState } from "react";

function GlobalContextProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [num, setNum] = useState<number>(0);
	const [list, setList] = useState<
		GlobalContextType["list"]
	>([]);

	function doSome() {
		setTimeout(() => {
			setNum(10);
			setList([
				{
					name: "张三",
					sex: 1,
					age: 18,
				},
			]);
		}, 2000);
	}

	return (
		<GlobalContext.Provider
			value={{
				size: num,
				setSize: setNum,
				doSome,
				list,
			}}>
			{children}
		</GlobalContext.Provider>
	);
}

export { GlobalContextProvider };
