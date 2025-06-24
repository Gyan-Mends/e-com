import type { ActionFunctionArgs } from "react-router";
import { getSession, destroySession } from "../session";

// Helper function to create JSON responses
const jsonResponse = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
};

// POST /api/auth/logout - Destroy user session
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return jsonResponse(
      { success: false, error: "Method not allowed" },
      405
    );
  }

  try {
    // Get current session
    const session = await getSession(request.headers.get("Cookie"));
    
    // Destroy session
    const destroyedSessionCookie = await destroySession(session);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Logout successful"
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": destroyedSessionCookie
        }
      }
    );

  } catch (error) {
    console.error("Logout error:", error);
    return jsonResponse(
      { success: false, error: "Internal server error" },
      500
    );
  }
} 