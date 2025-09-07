import React, { createContext, useState, useContext } from "react";

export type User = { name: string; email?: string };
const UserContext = createContext<User | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>({ name: "Usuario" });
  // Aquí podrías obtener el usuario desde una API y actualizar con setUser
  return (
    <UserContext.Provider value={user}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
