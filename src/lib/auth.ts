import bcrypt from "bcryptjs";
import crypto from "crypto";
import { supabaseAdmin } from "./supabase-admin";

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_EXPIRY_HOURS = 24;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a secure random token for password reset
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Get user by email from profiles table
 */
export async function getUserByEmail(email: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("email", email.toLowerCase())
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Get user by reset token
 */
export async function getUserByResetToken(token: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("password_reset_token", token)
    .single();

  if (error || !data) {
    return null;
  }

  // Check if token has expired
  if (data.password_reset_expires) {
    const expires = new Date(data.password_reset_expires);
    if (expires < new Date()) {
      return null; // Token expired
    }
  }

  return data;
}

/**
 * Create a new user with email and password
 */
export async function createUser(email: string, password: string, name?: string) {
  const passwordHash = await hashPassword(password);

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .insert({
      email: email.toLowerCase(),
      name: name || null,
      password_hash: passwordHash,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("An account with this email already exists");
    }
    throw new Error("Failed to create account");
  }

  return data;
}

/**
 * Update user's password
 */
export async function updatePassword(email: string, password: string) {
  const passwordHash = await hashPassword(password);

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      password_hash: passwordHash,
      password_reset_token: null,
      password_reset_expires: null,
    })
    .eq("email", email.toLowerCase());

  if (error) {
    throw new Error("Failed to update password");
  }
}

/**
 * Set password reset token for user
 */
export async function setResetToken(email: string): Promise<string | null> {
  const user = await getUserByEmail(email);
  
  // Don't reveal if user exists or not for security
  if (!user) {
    return null;
  }

  const token = generateResetToken();
  const expires = new Date();
  expires.setHours(expires.getHours() + RESET_TOKEN_EXPIRY_HOURS);

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      password_reset_token: token,
      password_reset_expires: expires.toISOString(),
    })
    .eq("email", email.toLowerCase());

  if (error) {
    console.error("Failed to set reset token:", error);
    return null;
  }

  return token;
}

/**
 * Send password reset/set email
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  isNewUser: boolean = false
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";
  const baseUrl = process.env.NEXTAUTH_URL || "";

  if (!apiKey) {
    console.error("[Auth] RESEND_API_KEY not configured");
    return false;
  }

  const resetUrl = `${baseUrl}/set-password/${token}`;
  const subject = isNewUser 
    ? "Set Your Password - Stash" 
    : "Reset Your Password - Stash";
  const heading = isNewUser 
    ? "Set Your Password" 
    : "Reset Your Password";
  const message = isNewUser
    ? "Click the button below to set your password and access your Stash account."
    : "You requested a password reset. Click the button below to set a new password.";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
      <div style="max-width: 500px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 600; color: #171717; margin: 0;">stash</h1>
        </div>
        
        <div style="background: #fafafa; border-radius: 12px; padding: 32px; text-align: center;">
          <h2 style="font-size: 20px; font-weight: 600; color: #171717; margin: 0 0 16px 0;">
            ${heading}
          </h2>
          
          <p style="color: #525252; font-size: 14px; margin: 0 0 24px 0;">
            ${message}
          </p>
          
          <a href="${resetUrl}" 
             style="display: inline-block; background: #171717; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 9999px; font-size: 14px; font-weight: 500;">
            ${heading}
          </a>
          
          <p style="color: #a3a3a3; font-size: 12px; margin: 24px 0 0 0;">
            This link expires in 24 hours.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 32px;">
          <p style="color: #a3a3a3; font-size: 12px; margin: 0;">
            If you didn't request this email, you can safely ignore it.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  console.log("[Auth] Sending password reset email to:", email);
  console.log("[Auth] Reset URL:", resetUrl);
  console.log("[Auth] From email:", fromEmail);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject,
        html,
      }),
    });

    const responseText = await response.text();
    console.log("[Auth] Resend API response status:", response.status);
    console.log("[Auth] Resend API response:", responseText);

    if (!response.ok) {
      console.error("[Auth] Failed to send email:", responseText);
      return false;
    }

    console.log("[Auth] Password reset email sent successfully to:", email);
    return true;
  } catch (error) {
    console.error("[Auth] Email send error:", error);
    return false;
  }
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters" };
  }
  
  // Check for at least one number
  if (!/\d/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  
  // Check for at least one letter
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one letter" };
  }

  return { valid: true };
}
