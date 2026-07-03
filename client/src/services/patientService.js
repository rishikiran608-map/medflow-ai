import api from "../api/api";

export const getPatients = async () => {
  const res = await api.get("/patients");
  return res.data;
};