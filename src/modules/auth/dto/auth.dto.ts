import {z} from "zod"
export const registerSchema=z.object({
  email: z.string(),
  password: z.string().min(8),
  username: z.string().min(3),
})

export const loginSchema=z.object({
  email: z.string(),
  password: z.string().min(8),
})


export type LoginDTO = z.infer<typeof loginSchema>;
export type RegisterDTO=z.infer<typeof registerSchema>;



