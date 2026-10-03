import { NextRequest } from "next/server";

export interface AuthenticatedUser {
  uid: string;
  email: string | null;
}

/**
 * Verifies the Firebase ID token sent in the Authorization header.
 * Uses Google Identity Toolkit REST API for lightweight, secret-free server-side verification.
 * Guarantees that userId is strictly authenticated and cannot be spoofed.
 */
export async function verifyAuthToken(req: NextRequest | Request): Promise<AuthenticatedUser> {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }

  const idToken = authHeader.split(" ")[1]?.trim();
  if (!idToken) {
    throw new Error("Empty Bearer token provided");
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error("Server configuration error: NEXT_PUBLIC_FIREBASE_API_KEY is not defined");
  }

  const verifyUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;
  const response = await fetch(verifyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const message = errData?.error?.message || "Invalid or expired Firebase ID token";
    throw new Error(`Authentication failed: ${message}`);
  }

  const data = await response.json();
  const user = data.users?.[0];

  if (!user || !user.localId) {
    throw new Error("No user found matching this token");
  }

  return {
    uid: user.localId,
    email: user.email || null,
  };
}
