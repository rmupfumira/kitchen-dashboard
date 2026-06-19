#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# kiosk-setup.sh — turn a Raspberry Pi OS Desktop install into a
# Wall-panel kiosk that boots straight into the dashboard.
#
# Usage:
#   bash deploy/kiosk-setup.sh <dashboard-url>
#
# Example:
#   bash deploy/kiosk-setup.sh http://192.168.1.140:8080
#
# What it does:
#   1. Installs chromium-browser + unclutter (cursor hider)
#   2. Disables OS-level screen blanking (raspi-config)
#   3. Disables compositor-level screen blanking (Wayfire on Bookworm + xset on X11)
#   4. Creates a per-user autostart entry that launches Chromium in kiosk mode
#   5. Prints reboot instructions
#
# Reverse it with:
#   rm ~/.config/autostart/dashboard-kiosk.desktop && sudo reboot
#
# Tested on:
#   - Raspberry Pi OS Bookworm 64-bit (Wayfire / labwc / Wayland) — Pi 4/5
#   - Raspberry Pi OS Bullseye         (LXDE / X11)               — Pi 3/Zero
# ──────────────────────────────────────────────────────────────
set -euo pipefail

URL="${1:-}"
if [[ -z "$URL" ]]; then
  echo "Usage: $0 <dashboard-url>" >&2
  echo "Example: $0 http://192.168.1.140:8080" >&2
  exit 2
fi

echo "▸ Installing chromium-browser + unclutter…"
sudo apt-get update -qq
sudo apt-get install -y chromium-browser unclutter xdotool

echo "▸ Disabling OS-level screen blanking via raspi-config…"
sudo raspi-config nonint do_blanking 1 || true

echo "▸ Detecting display server…"
SESSION_TYPE="${XDG_SESSION_TYPE:-}"
if [[ -z "$SESSION_TYPE" ]]; then
  SESSION_TYPE=$([[ -n "${WAYLAND_DISPLAY:-}" ]] && echo wayland || echo x11)
fi
echo "  → $SESSION_TYPE"

# ── Wayland (Bookworm — Wayfire on Pi 4, labwc on Pi 5) ─────────
if [[ "$SESSION_TYPE" == "wayland" ]]; then
  WAYFIRE="$HOME/.config/wayfire.ini"
  if [[ -f "$WAYFIRE" ]] && ! grep -q '^\[idle\]' "$WAYFIRE"; then
    cat >> "$WAYFIRE" << 'EOF'

[idle]
dpms_timeout = 0
screensaver_timeout = 0
EOF
    echo "  ↪ appended [idle] section to ~/.config/wayfire.ini"
  fi
fi

# ── Autostart entry (universal — works for LXDE, Wayfire, labwc) ─
mkdir -p "$HOME/.config/autostart"
AUTOSTART="$HOME/.config/autostart/dashboard-kiosk.desktop"

cat > "$AUTOSTART" << EOF
[Desktop Entry]
Type=Application
Name=Dashboard Kiosk
Comment=Launch the dashboard fullscreen on boot
# Pipeline:
#   - xset    : kill screen blanker + DPMS (no-op on Wayland, harmless)
#   - unclutter : hide the mouse cursor when idle for 0s
#   - chromium-browser --kiosk : true fullscreen, no chrome / address bar
Exec=/bin/sh -c "sleep 5; xset s off || true; xset -dpms || true; xset s noblank || true; unclutter -idle 0 -root & exec chromium-browser --kiosk --noerrdialogs --disable-infobars --disable-translate --no-first-run --start-fullscreen --start-maximized --autoplay-policy=no-user-gesture-required --check-for-update-interval=31536000 --disable-pinch --overscroll-history-navigation=0 --touch-events=enabled --disable-features=TranslateUI --user-data-dir=\$HOME/.config/dashboard-chromium '$URL'"
X-GNOME-Autostart-enabled=true
NotShowIn=GNOME;KDE;
EOF

chmod +x "$AUTOSTART"
echo "✔ Autostart entry written to $AUTOSTART"
echo
echo "──────────────────────────────────────────────"
echo "All set. Reboot to launch the kiosk:"
echo
echo "    sudo reboot"
echo
echo "Notes:"
echo "  · Chromium will open '$URL' in fullscreen on every boot."
echo "  · Exit kiosk with Alt+F4 (will respawn on next boot unless you remove the autostart file)."
echo "  · Disable: rm $AUTOSTART && sudo reboot"
echo "  · Logs: ~/.config/dashboard-chromium/  (separate Chromium profile)"
echo "──────────────────────────────────────────────"
