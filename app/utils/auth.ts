import { redirect } from "react-router";
import { getSession } from "../session";
import User, { type IUser } from "../models/User";

// Check if user is authenticated
export async function requireAuth(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  const email = session.get("email");

  if (!email) {
    throw redirect("/login");
  }

  return email;
}

// Get current user from session
export async function getCurrentUser(request: Request): Promise<IUser | null> {
  try {
    const session = await getSession(request.headers.get("Cookie"));
    const email = session.get("email");

    if (!email) {
      return null;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

// Check if user is authenticated and return user data
export async function requireAuthWithUser(request: Request): Promise<IUser> {
  const session = await getSession(request.headers.get("Cookie"));
  const email = session.get("email");

  if (!email) {
    throw redirect("/login");
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  
  if (!user) {
    // Session exists but user doesn't exist in DB, clear session
    throw redirect("/login");
  }

  if (!user.isActive) {
    throw redirect("/login?error=account_deactivated");
  }

  return user;
}

// Check if user has specific permission
export function hasPermission(user: IUser, permission: string): boolean {
  return user.permissions.includes(permission);
}

// Check if user has any of the specified permissions
export function hasAnyPermission(user: IUser, permissions: string[]): boolean {
  return permissions.some(permission => user.permissions.includes(permission));
}

// Check if user is admin
export function isAdmin(user: IUser): boolean {
  return user.role === 'admin';
} 