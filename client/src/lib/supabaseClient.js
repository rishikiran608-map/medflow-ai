import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://yrwwupsttsxzukrupabq.supabase.co";
const supabaseAnonKey = "sb_publishable_SkyogpWljjBLEzTS6cwJCA_iA-ML1ju";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
