import api from "../api/api";

export const getQueue = async () => {
  const response = await api.get("/queue");
  return response.data;
};