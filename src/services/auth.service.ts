import { createHash, randomBytes } from "node:crypto";
import { canSignInToPortal, redirectAfterLogin, resetPathForRole } from "@/lib/authz";
import { connectDB } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { hashPassword, verifyPassword } from "@/lib/password";
import { rateLimit } from "@/lib/rate-limit";
import { signSessionToken } from "@/lib/session-token";
import {
  BranchModel,
  BusinessModel,
  FavoriteModel,
  OfferModel,
  OfferTemplateModel,
  PasswordResetModel,
  RedemptionModel,
  ReportModel,
  UserModel,
} from "@/models";
import { logActivity } from "@/services/activity.service";
import type { DeleteAccountInput, LoginInput, ProfileInput, RegisterInput, ResetInput } from "@/validators";

let dummyHashPromise: Promise<string> | null = null;

function dummyHash() {
  dummyHashPromise ??= hashPassword("not-a-real-password");
  return dummyHashPromise;
}

function publicUser(user: { _id: unknown; name: string; email: string; role: LoginInput["portal"]; phone?: string }) {
  return { id: String(user._id), name: user.name, email: user.email, role: user.role, phone: user.phone || undefined };
}

export async function registerAccount(input: RegisterInput, ip: string) {
  await rateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
  await connectDB();
  const email = input.email.toLowerCase();
  const existing = await UserModel.findOne({ email }).select("_id");
  if (existing) throw new AppError(409, "email_taken", "An account with this email already exists.");
  const user = await UserModel.create({
    name: input.name.trim(),
    email,
    phone: input.phone?.trim() || undefined,
    passwordHash: await hashPassword(input.password),
    role: input.accountType,
    isActive: true,
    sessionVersion: 0,
  });
  await logActivity({
    actorId: String(user._id),
    action: "user.register",
    resourceType: "user",
    resourceId: String(user._id),
    metadata: { role: user.role },
  });
  const token = await signSessionToken({
    id: String(user._id),
    role: user.role,
    email: user.email,
    name: user.name,
    sessionVersion: 0,
  });
  return { token, user: publicUser(user), redirectTo: redirectAfterLogin(user.role) };
}

export async function loginAccount(input: LoginInput, ip: string) {
  await rateLimit(`login:${ip}:${input.email.toLowerCase()}`, 5, 15 * 60 * 1000);
  await connectDB();
  const user = await UserModel.findOne({ email: input.email.toLowerCase() }).select("+passwordHash");
  const passwordHash = user?.passwordHash || (await dummyHash());
  const matches = await verifyPassword(input.password, passwordHash);
  if (!user || !user.passwordHash || !matches) {
    throw new AppError(401, "invalid_credentials", "The email or password is incorrect.");
  }
  if (!user.isActive) throw new AppError(403, "account_disabled", "This account is disabled.");
  if (!canSignInToPortal(user.role, input.portal)) {
    throw new AppError(403, "wrong_portal", "This account cannot sign in here.");
  }
  const token = await signSessionToken({
    id: String(user._id),
    role: user.role,
    email: user.email,
    name: user.name,
    sessionVersion: user.sessionVersion ?? 0,
  });
  return { token, user: publicUser(user), redirectTo: redirectAfterLogin(user.role, input.next) };
}

export async function requestPasswordReset(input: { email: string }, ip: string) {
  await rateLimit(`forgot:${ip}`, 5, 60 * 60 * 1000);
  await connectDB();
  const user = await UserModel.findOne({ email: input.email.toLowerCase() });
  if (user?.isActive) {
    const { token, tokenHash } = createResetToken();
    await PasswordResetModel.deleteMany({ userId: user._id });
    await PasswordResetModel.create({
      userId: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });
    const resetUrl = `${getAppUrl()}${resetPathForRole(user.role)}?token=${token}`;
    await sendPasswordResetEmail(user.email, resetUrl);
  }
  return { message: "If an account exists for that email, a reset link has been sent." };
}

export async function resetPassword(input: ResetInput) {
  await connectDB();
  const tokenHash = createHash("sha256").update(input.token).digest("hex");
  const reset = await PasswordResetModel.findOne({ tokenHash, usedAt: { $exists: false }, expiresAt: { $gt: new Date() } });
  if (!reset) throw new AppError(400, "invalid_token", "This reset link is invalid or has expired.");
  const user = await UserModel.findById(reset.userId);
  if (!user || !user.isActive) throw new AppError(400, "invalid_token", "This reset link is invalid or has expired.");
  user.passwordHash = await hashPassword(input.password);
  user.sessionVersion = (user.sessionVersion ?? 0) + 1;
  await user.save();
  reset.usedAt = new Date();
  await reset.save();
  await logActivity({
    actorId: String(user._id),
    action: "user.password_reset",
    resourceType: "user",
    resourceId: String(user._id),
  });
  return { message: "Your password has been updated. Sign in with the new password." };
}

export async function updateProfile(userId: string, input: ProfileInput) {
  await connectDB();
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError(401, "unauthorized", "Sign in to continue.");
  user.name = input.name.trim();
  user.phone = input.phone?.trim() || undefined;
  await user.save();
  await logActivity({ actorId: userId, action: "user.profile_update", resourceType: "user", resourceId: userId });
  return publicUser(user);
}

export async function changePassword(userId: string, input: { currentPassword: string; newPassword: string }) {
  await connectDB();
  const user = await UserModel.findById(userId).select("+passwordHash");
  if (!user?.passwordHash) throw new AppError(401, "unauthorized", "Sign in to continue.");
  const matches = await verifyPassword(input.currentPassword, user.passwordHash);
  if (!matches) throw new AppError(400, "invalid_password", "The current password is incorrect.");
  user.passwordHash = await hashPassword(input.newPassword);
  user.sessionVersion = (user.sessionVersion ?? 0) + 1;
  await user.save();
  const token = await signSessionToken({
    id: String(user._id),
    role: user.role,
    email: user.email,
    name: user.name,
    sessionVersion: user.sessionVersion,
  });
  await logActivity({ actorId: userId, action: "user.password_change", resourceType: "user", resourceId: userId });
  return { token, message: "Password updated." };
}

export async function deleteAccount(userId: string, input: DeleteAccountInput) {
  await connectDB();
  const user = await UserModel.findById(userId).select("+passwordHash");
  if (!user?.passwordHash) throw new AppError(401, "unauthorized", "Sign in to continue.");
  const matches = await verifyPassword(input.password, user.passwordHash);
  if (!matches) throw new AppError(400, "invalid_password", "The password is incorrect.");

  if (user.role === "super_admin") {
    const remaining = await UserModel.countDocuments({ role: "super_admin", isActive: true, _id: { $ne: user._id } });
    if (remaining === 0) {
      throw new AppError(400, "last_admin", "Keep at least one active super admin. Create another admin before deleting this account.");
    }
  }

  if (user.role === "owner") {
    const businesses = await BusinessModel.find({ ownerId: user._id }).select("_id").lean();
    const businessIds = businesses.map((doc) => doc._id);
    if (businessIds.length) {
      const offers = await OfferModel.find({ businessId: { $in: businessIds } }).select("_id").lean();
      const offerIds = offers.map((doc) => doc._id);
      if (offerIds.length) {
        await Promise.all([
          FavoriteModel.deleteMany({ offerId: { $in: offerIds } }),
          RedemptionModel.deleteMany({ offerId: { $in: offerIds } }),
          ReportModel.deleteMany({ offerId: { $in: offerIds } }),
        ]);
        await OfferModel.deleteMany({ _id: { $in: offerIds } });
      }
      await BranchModel.deleteMany({ businessId: { $in: businessIds } });
      await BusinessModel.deleteMany({ _id: { $in: businessIds } });
    }
    await OfferTemplateModel.updateMany({ createdBy: user._id }, { $unset: { createdBy: 1 } });
  }

  await Promise.all([
    FavoriteModel.deleteMany({ userId: user._id }),
    RedemptionModel.deleteMany({ userId: user._id }),
    ReportModel.deleteMany({ userId: user._id }),
    PasswordResetModel.deleteMany({ userId: user._id }),
  ]);

  await logActivity({
    actorId: userId,
    action: "user.delete_account",
    resourceType: "user",
    resourceId: userId,
    metadata: { role: user.role, email: user.email },
  });

  await UserModel.deleteOne({ _id: user._id });
  return { message: "Your account has been deleted." };
}

function createResetToken() {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}
