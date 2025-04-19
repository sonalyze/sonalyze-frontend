import axios from "axios";

// @TODO replace with backend url
export const axiosClient = axios.create({
	baseURL: "https://jsonplaceholder.typicode.com",
	headers: {
		"Content-Type": "application/json",
	},
});
