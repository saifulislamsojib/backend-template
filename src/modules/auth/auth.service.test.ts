import { status } from "http-status";
import { Types } from "mongoose";
import repository from "@/modules/user/user.repository";
import authService from "./auth.service";
import { compareHashedText, createJWT, hashText } from "./auth.utils";

vi.mock("@/modules/user/user.repository");
vi.mock("./auth.utils");

describe("auth service persistence contract", () => {
  const user = {
    _id: new Types.ObjectId("507f1f77bcf86cd799439011"),
    name: "Jane",
    email: "jane@example.com",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const payload = { currentPassword: "old-password", newPassword: "new-password" };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(repository.findCredentialsById).mockResolvedValue({ user, passwordHash: "old-hash" });
    vi.mocked(compareHashedText).mockResolvedValue(true);
    vi.mocked(hashText).mockResolvedValue("new-hash");
  });

  it("maps a lost password compare-and-swap to the existing failure and issues no token", async () => {
    vi.mocked(repository.updatePasswordIfCurrent).mockResolvedValue(null);
    await expect(authService.changePassword(user._id, payload)).rejects.toMatchObject({
      statusCode: status.BAD_REQUEST,
      message: "Password change failed",
    });
    expect(repository.updatePasswordIfCurrent).toHaveBeenCalledWith(
      user._id,
      "old-hash",
      "new-hash",
    );
    expect(createJWT).not.toHaveBeenCalled();
  });

  it("issues a token from the updated row rather than stale credentials", async () => {
    const updated = { ...user, email: "changed@example.com", role: "admin" as const };
    vi.mocked(repository.updatePasswordIfCurrent).mockResolvedValue(updated);
    vi.mocked(createJWT).mockReturnValue("token");
    await expect(authService.changePassword(user._id, payload)).resolves.toStrictEqual({
      user: updated,
      token: "token",
    });
    expect(createJWT).toHaveBeenCalledWith({
      _id: user._id,
      email: updated.email,
      role: updated.role,
    });
  });

  it("still compares a dummy hash when login credentials are missing", async () => {
    vi.mocked(repository.findCredentialsByEmail).mockResolvedValue(null);
    await expect(
      authService.loginUser({ email: user.email, password: "password" }),
    ).rejects.toMatchObject({
      statusCode: status.UNAUTHORIZED,
      message: "Invalid email or password",
    });
    expect(compareHashedText).toHaveBeenCalledWith("password", expect.stringMatching(/^\$2b\$/));
    expect(createJWT).not.toHaveBeenCalled();
  });
});
