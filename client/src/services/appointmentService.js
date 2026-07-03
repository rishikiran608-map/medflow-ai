import api from "../api/api";

export const bookAppointment = async (appointmentData) => {
  const res = await api.post("/appointments", appointmentData);
  return res.data;
};