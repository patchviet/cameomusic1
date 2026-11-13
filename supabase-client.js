import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://zozzjgtcjoakuntkjfon.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable__A4QrAMPocdHbEKPdWrmVQ_Kz7o25yk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

export const cache = {
  profile: null, wallet: null, sheets: [], categories: [], comments: [], reviews: [],
  favorites: [], saves: [], follows: [], orders: [], purchases: [], notifications: [],
  walletTransactions: [], topupRequests: [], withdrawalRequests: [], sellerEarnings: [],
  profiles: [], settings: {}, adminLogs: [], reports: [], walletAccounts: [],
};

export async function loadSettings() {
  const { data } = await supabase.from('settings').select('*').eq('id', 1).single();
  cache.settings = data || {}; return cache.settings;
}

export async function loadProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { cache.profile = null; return null; }

  let { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

  if (!data) {
    console.log('Tài khoản chưa có Profile, đang tự động tạo...');
    const meta = user.user_metadata || {};
    const username = meta.username || ('user_' + user.id.slice(0, 8));
    const display_name = meta.display_name || 'Thành viên mới';

    const { data: newProfile, error: insertErr } = await supabase.from('profiles').insert({
      id: user.id, username: username, display_name: display_name,
      email: user.email, role: 'user', status: 'active'
    }).select().single();

    if (insertErr) {
      console.error('Lỗi tạo Profile:', insertErr);
    } else {
      data = newProfile;
      await supabase.from('wallet_accounts').insert({ user_id: user.id });
    }
  }

  cache.profile = data;
  return data;
}

export async function loadWallet() {
  if (!cache.profile) { cache.wallet = null; return null; }
  const { data } = await supabase.from('wallet_accounts').select('*').eq('user_id', cache.profile.id).maybeSingle();
  cache.wallet = data; return data;
}
export async function loadCategories() {
  const { data } = await supabase.from('categories').select('*').order('name');
  cache.categories = data || []; return data;
}
export async function loadSheets() {
  const { data } = await supabase.from('sheets').select('*').order('created_at', { ascending: false });
  cache.sheets = data || []; return data;
}
export async function loadComments(sheetId) {
  const { data } = await supabase.from('comments').select('*').eq('sheet_id', sheetId).order('created_at', { ascending: false });
  cache.comments = data || []; return data;
}
export async function loadReviews(sheetId) {
  const { data } = await supabase.from('reviews').select('*').eq('sheet_id', sheetId).order('created_at', { ascending: false });
  cache.reviews = data || []; return data;
}
export async function loadFavorites() {
  if (!cache.profile) { cache.favorites = []; return; }
  const { data } = await supabase.from('favorites').select('*').eq('user_id', cache.profile.id);
  cache.favorites = data || [];
}
export async function loadSaves() {
  if (!cache.profile) { cache.saves = []; return; }
  const { data } = await supabase.from('saves').select('*').eq('user_id', cache.profile.id);
  cache.saves = data || [];
}
export async function loadFollows() {
  if (!cache.profile) { cache.follows = []; return; }
  const { data } = await supabase.from('follows').select('*').eq('follower_id', cache.profile.id);
  cache.follows = data || [];
}

export async function loadOrders() {
  if (!cache.profile) { cache.orders = []; return; }
  let query = supabase.from('orders').select('*, order_items(*)');
  if (cache.profile.role !== 'admin') {
    query = query.or(`buyer_id.eq.${cache.profile.id},seller_id.eq.${cache.profile.id}`);
  }
  const { data } = await query.order('created_at', { ascending: false });
  cache.orders = data || [];
}

export async function loadPurchases() {
  if (!cache.profile) { cache.purchases = []; return; }
  const { data } = await supabase.from('purchases').select('*').eq('user_id', cache.profile.id);
  cache.purchases = data || [];
}
export async function loadNotifications() {
  if (!cache.profile) { cache.notifications = []; return; }
  const { data } = await supabase.from('notifications').select('*').eq('user_id', cache.profile.id).order('created_at', { ascending: false });
  cache.notifications = data || [];
}

export async function loadWalletTransactions() {
  if (!cache.profile) { cache.walletTransactions = []; return; }
  let query = supabase.from('wallet_transactions').select('*');
  if (cache.profile.role !== 'admin') {
    query = query.eq('user_id', cache.profile.id);
  }
  const { data } = await query.order('created_at', { ascending: false });
  cache.walletTransactions = data || [];
}

export async function loadTopupRequests() {
  if (!cache.profile) { cache.topupRequests = []; return; }
  let query = supabase.from('topup_requests').select('*');
  if (cache.profile.role !== 'admin') {
    query = query.eq('user_id', cache.profile.id);
  }
  const { data } = await query.order('created_at', { ascending: false });
  cache.topupRequests = data || [];
}

export async function loadWithdrawalRequests() {
  if (!cache.profile) { cache.withdrawalRequests = []; return; }
  let query = supabase.from('withdrawal_requests').select('*');
  if (cache.profile.role !== 'admin') {
    query = query.eq('user_id', cache.profile.id);
  }
  const { data } = await query.order('requested_at', { ascending: false });
  cache.withdrawalRequests = data || [];
}

export async function loadSellerEarnings() {
  if (!cache.profile) { cache.sellerEarnings = []; return; }
  let query = supabase.from('seller_earnings').select('*');
  if (cache.profile.role !== 'admin') {
    query = query.eq('seller_id', cache.profile.id);
  }
  const { data } = await query.order('created_at', { ascending: false });
  cache.sellerEarnings = data || [];
}

export async function loadAllProfiles() {
  const { data } = await supabase.from('profiles').select('id, username, display_name, avatar_url, bio, role, status, created_at, email');
  cache.profiles = data || [];
}
export async function loadAdminLogs() {
  const { data } = await supabase.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(200);
  cache.adminLogs = data || [];
}
export async function loadReports() {
  const { data } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
  cache.reports = data || [];
}
export async function loadAllWalletAccounts() {
  const { data } = await supabase.from('wallet_accounts').select('*');
  cache.walletAccounts = data || [];
}
export async function loadAll() {
  await loadSettings();
  await loadProfile();
  await Promise.all([
    loadCategories(), loadSheets(), loadAllProfiles(),
    loadFavorites(), loadSaves(), loadFollows(), loadWallet(),
    loadNotifications(), loadOrders(), loadPurchases(),
    loadWalletTransactions(), loadTopupRequests(),
    loadWithdrawalRequests(), loadSellerEarnings(),
  ]);
}

// =========================================================
// ĐÃ SỬA DUY NHẤT HÀM NÀY ĐỂ TỰ ĐỘNG NHẬN COMMENT/REVIEW
// =========================================================
export function setupRealtime(onChange) {
  const channel = supabase.channel('db-changes');
  ['sheets','orders','wallet_accounts','wallet_transactions','notifications','topup_requests','withdrawal_requests','seller_earnings', 'comments', 'reviews']
    .forEach(table => channel.on('postgres_changes', { event: '*', schema: 'public', table }, async (payload) => {
      
      // Tự động tải lại comment/đánh giá nếu người dùng đang ở trong trang xem sheet
      if (table === 'comments' || table === 'reviews') {
        const match = window.location.hash.match(/#\/sheet\/([a-zA-Z0-9-]+)/);
        if (match && match[1]) {
          if (table === 'comments') await loadComments(match[1]);
          if (table === 'reviews') await loadReviews(match[1]);
        }
      }

      onChange(table, payload);
    }));
  channel.subscribe(s => console.log('Realtime:', s));
  return channel;
}
// =========================================================

export async function signUp(email, password, username, displayName) {
  const { data, error } = await supabase.auth.signUp({
    email, password, options: { data: { username, display_name: displayName } }
  });
  if (error) throw error; return data;
}
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error; return data;
}
export async function signOut() {
  await supabase.auth.signOut();
  cache.profile = null; cache.wallet = null;
}
export async function uploadSheetFile(file, sheetId) {
  const ext = file.name.split('.').pop().toLowerCase();
  const path = `${sheetId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('sheets').upload(path, file);
  if (error) throw error; return path;
}
export async function uploadCover(blob, sheetId) {
  const path = `${sheetId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage.from('covers').upload(path, blob, { contentType: 'image/jpeg' });
  if (error) throw error;
  const { data } = supabase.storage.from('covers').getPublicUrl(path);
  return data.publicUrl;
}
export async function uploadAvatar(blob, userId) {
  const path = `avatars/${userId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage.from('covers').upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
  if (error) throw error;
  const { data } = supabase.storage.from('covers').getPublicUrl(path);
  return data.publicUrl;
}