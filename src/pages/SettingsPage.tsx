import { useState } from "react";
import { User, Mail, Camera, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export function SettingsPage() {
  const { profile, user, updateProfile, signOut } = useAuth();
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!user || !profile) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <User className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
        <h2 className="text-xl font-semibold mb-2">Sign in to access settings</h2>
        <a href="/login" className="btn-primary inline-block mt-4">Sign In</a>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      setSaving(false);
      return;
    }

    const updates: any = { username: username.trim() };
    if (bio !== profile.bio) updates.bio = bio.trim() || null;
    if (avatarUrl !== profile.avatar_url) updates.avatar_url = avatarUrl.trim() || null;

    const { error: updateError } = await updateProfile(updates);
    setSaving(false);

    if (updateError) {
      setError(updateError);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be smaller than 2MB");
      return;
    }

    setSaving(true);
    setError(null);

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);

    if (uploadError) {
      // If bucket doesn't exist, just use a data URL as fallback
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarUrl(reader.result as string);
        setSaving(false);
      };
      reader.readAsDataURL(file);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    setAvatarUrl(urlData.publicUrl);
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Settings</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">Manage your account and preferences</p>

      <div className="glass-card p-6 space-y-6">
        {/* Avatar */}
        <div>
          <label className="text-sm font-medium mb-3 block">Avatar</label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                username.slice(0, 2).toUpperCase()
              )}
            </div>
            <label className="btn-outline cursor-pointer flex items-center gap-2 text-sm">
              <Camera className="w-4 h-4" />
              Upload Image
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium mb-2">
            <User className="w-4 h-4" /> Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-field"
            placeholder="Your username"
            maxLength={20}
          />
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium mb-2">
            <Mail className="w-4 h-4" /> Email
          </label>
          <input
            type="email"
            value={user.email || ""}
            disabled
            className="input-field opacity-60 cursor-not-allowed"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="text-sm font-medium mb-2 block">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="input-field resize-none"
            placeholder="Tell us about yourself..."
            maxLength={200}
            rows={3}
          />
          <div className="text-xs text-slate-400 mt-1 text-right">{bio.length}/200</div>
        </div>

        {/* Error / Success */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-rose-500 p-3 rounded-lg bg-rose-500/10">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-sm text-emerald-500 p-3 rounded-lg bg-emerald-500/10">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> Profile updated successfully!
          </div>
        )}

        {/* Save */}
        <button onClick={handleSave} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Keyboard shortcuts help */}
      <div className="glass-card p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4">Keyboard Shortcuts</h2>
        <div className="space-y-2 text-sm">
          {[
            { key: "Tab", desc: "Restart the current test" },
            { key: "Esc", desc: "Reset the test" },
            { key: "Ctrl + R", desc: "Restart test (alternative)" },
            { key: "Start typing", desc: "Automatically begins the countdown" },
          ].map((sc) => (
            <div key={sc.key} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
              <span className="text-slate-600 dark:text-slate-400">{sc.desc}</span>
              <kbd className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-xs">{sc.key}</kbd>
            </div>
          ))}
        </div>
      </div>

      {/* Sign out */}
      <div className="mt-6">
        <button onClick={signOut} className="btn-ghost text-rose-500 w-full">
          Sign Out
        </button>
      </div>
    </div>
  );
}
