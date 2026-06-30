const BASE = "http://localhost:8000";

export async function login(userId) {
  const res = await fetch(`${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Login failed.");
  }
  return res.json();
}

export async function adminLogin(adminId, password) {
  const res = await fetch(`${BASE}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ admin_id: adminId, password: password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Admin login failed.");
  }
  return res.json();
}

export async function submitProfile(profileData, teacherPassword = null) {
  const res = await fetch(`${BASE}/submit-profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      profile: profileData,
      teacher_password: teacherPassword,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to submit profile.");
  }
  return res.json();
}

export async function getProfile(userId) {
  const res = await fetch(`${BASE}/profile/${userId}`);
  if (!res.ok) throw new Error("Profile not found.");
  return res.json();
}

export async function getPeers(currentUserId) {
  const res = await fetch(`${BASE}/peers?current_user_id=${encodeURIComponent(currentUserId)}`);
  if (!res.ok) throw new Error("Could not load peers.");
  return res.json();
}

export async function compareProfiles(user1Id, user2Id) {
  const res = await fetch(`${BASE}/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user1_id: user1Id, user2_id: user2Id }),
  });
  if (!res.ok) throw new Error("Comparison failed.");
  return res.json();
}

export async function getAdminProfiles(requestingUserId) {
  const res = await fetch(
    `${BASE}/admin/profiles?requesting_user_id=${encodeURIComponent(requestingUserId)}`
  );
  if (!res.ok) throw new Error("Access denied or request failed.");
  return res.json();
}