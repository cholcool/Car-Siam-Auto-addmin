export type SessionUser = {
  id?: string | number
  username?: string
  name?: string
  email?: string
  phone?: string
  roles?: string[] // snake_case roles array (e.g., ['admin'])
  // allow arbitrary additional properties from the session
  [key: string]: any
}
