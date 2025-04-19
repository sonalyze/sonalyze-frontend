import { useQuery } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { getTodos } from "../api/testRequest";
import { Text, View } from "react-native";

const MainPage = () => {
	const todos = useQuery({
		queryKey: ["todos"],
		queryFn: getTodos,
	});
	return (
		<View className="flex-1 items-center justify-center bg-gray-100">
			<Text className="bg-blue-500 text-white p-4 rounded-lg">
				Willkommen im Aal
			</Text>
			{todos.isLoading && <Text>Loading...</Text>}
			{todos.isError && <Text>Error: {todos.error.message}</Text>}
			{todos.isSuccess && (
				<Text className="text-lg">{JSON.stringify(todos.data)}</Text>
			)}

			<StatusBar style="auto" />
		</View>
	);
};

export default MainPage;
