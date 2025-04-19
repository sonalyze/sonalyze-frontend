import axios from "axios";
import { axiosClient } from "../tools/helpers";

// @TODO only for testing purposes
async function getTodos(): Promise<TestTodo> {
	const data = await axiosClient.get<TestTodo>("/todos/1");
	return data.data;
}

export { getTodos };
