import "next-auth"

declare module "next-auth" {
  interface User {
    color?: string
  }
  interface Session {
    user: {
      id: string
      color: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string
    color?: string
  }
}
