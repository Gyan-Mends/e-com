import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import bcrypt from "bcryptjs";
import User, { type IUser } from "../models/User";

// Helper function to create JSON responses
const jsonResponse = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
};

// GET /api/users - Get all users
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const search = url.searchParams.get("search") || "";
    const role = url.searchParams.get("role") || "";
    
    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }
    if (role) {
      query.role = role;
    }

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Get users with pagination
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return jsonResponse({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return jsonResponse(
      { success: false, error: "Failed to fetch users" },
      500
    );
  }
}

// POST /api/users - Create or Update user
export async function action({ request }: ActionFunctionArgs) {
  try {
    const method = request.method;
    
    let data: any;
    const contentType = request.headers.get("content-type");
    
    if (contentType?.includes("application/json")) {
      data = await request.json();
    } else {
      const formData = await request.formData();
      data = Object.fromEntries(formData);
    }

    switch (method) {
      case "POST":
        return await createUser(data);
      case "PUT":
        return await updateUser(data);
      case "DELETE":
        return await deleteUser(data);
      default:
        return jsonResponse(
          { success: false, error: "Method not allowed" },
          405
        );
    }
  } catch (error) {
    console.error("Error in user action:", error);
    return jsonResponse(
      { success: false, error: "Server error" },
      500
    );
  }
}

// Create new user
async function createUser(data: any) {
  try {
    const { name, email, password, role, phone, address, avatar } = data;
    
    if (!name || !email || !password) {
      return jsonResponse(
        { success: false, error: "Name, email, and password are required" },
        400
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return jsonResponse(
        { success: false, error: "User with this email already exists" },
        400
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || "seller",
      phone: phone || undefined,
      address: address || undefined,
      avatar: avatar || undefined
    });

    await user.save();

    return jsonResponse({
      success: true,
      message: "User created successfully",
      data: user.toJSON()
    });
  } catch (error: any) {
    console.error("Error creating user:", error);
    
    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return jsonResponse(
        { success: false, error: errors.join(", ") },
        400
      );
    }

    return jsonResponse(
      { success: false, error: "Failed to create user" },
      500
    );
  }
}

// Update user
async function updateUser(data: any) {
  try {
    const { id, name, email, role, phone, address, isActive, password, avatar } = data;

    if (!id) {
      return jsonResponse(
        { success: false, error: "User ID is required" },
        400
      );
    }

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return jsonResponse(
        { success: false, error: "User not found" },
        404
      );
    }

    // Update user fields
    if (name) user.name = name;
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: id }
      });
      if (existingUser) {
        return jsonResponse(
          { success: false, error: "Email is already taken" },
          400
        );
      }
      user.email = email.toLowerCase();
    }
    if (role) user.role = role;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (avatar !== undefined) user.avatar = avatar;
    if (isActive !== undefined) user.isActive = isActive === "true" || isActive === true;

    // Update password if provided
    if (password) {
      user.password = await bcrypt.hash(password, 12);
    }

    await user.save();

    return jsonResponse({
      success: true,
      message: "User updated successfully",
      data: user.toJSON()
    });
  } catch (error: any) {
    console.error("Error updating user:", error);
    
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return jsonResponse(
        { success: false, error: errors.join(", ") },
        400
      );
    }

    return jsonResponse(
      { success: false, error: "Failed to update user" },
      500
    );
  }
}

// Delete user
async function deleteUser(data: any) {
  try {
    const { id } = data;

    if (!id) {
      return jsonResponse(
        { success: false, error: "User ID is required" },
        400
      );
    }

    const user = await User.findById(id);
    if (!user) {
      return jsonResponse(
        { success: false, error: "User not found" },
        404
      );
    }

    await User.findByIdAndDelete(id);

    return jsonResponse({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return jsonResponse(
      { success: false, error: "Failed to delete user" },
      500
    );
  }
} 