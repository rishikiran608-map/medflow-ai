import axios from "axios";

const API = "http://localhost:5000/api/auth";

export const login = async (email, password) => {
  const res = await axios.post(`${API}/login`, {
    email,
    password,
  });

  return res.data;
};