// Stable local identity for guests who join without signing in.
// Lets us match a guest's join request across page reloads (same browser).

const KEY = "auctionpro_guest_id";

export function getGuestId() {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = "guest_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    localStorage.setItem(KEY, id);
  }
  return id;
}