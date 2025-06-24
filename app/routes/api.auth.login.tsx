import type { ActionFunctionArgs } from "react-router";
import bcrypt from "bcryptjs";
import User from "../models/User";
import { getSession, setSession } from "../session";

// Helper function to create JSON responses
const jsonResponse = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
};

// POST /api/auth/login - Authenticate user
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return jsonResponse(
      { success: false, error: "Method not allowed" },
      405
    );
  }

  try {
    const data = await request.json();
    const { email, password, rememberMe } = data;

    // Validation
    if (!email || !password) {
      return jsonResponse(
        { success: false, error: "Email and password are required" },
        400
      );
    }

    // Find user by email
    const user = await User.findOne({ 
      email: email.toLowerCase() 
    }).select('+password'); // Include password field

    if (!user) {
      return jsonResponse(
        { success: false, error: "Invalid email or password" },
        401
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return jsonResponse(
        { success: false, error: "Account is deactivated. Please contact administrator." },
        401
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return jsonResponse(
        { success: false, error: "Invalid email or password" },
        401
      );
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create session
    const session = await getSession(request.headers.get("Cookie"));
    const sessionCookie = await setSession(session, user.email, rememberMe || false);

    // Return success response with user data (excluding password)
    const userData = user.toJSON();
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Login successful",
        user: userData
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": sessionCookie
        }
      }
    );

  } catch (error) {
    console.error("Login error:", error);
    return jsonResponse(
      { success: false, error: "Internal server error" },
      500
    );
  }
} 