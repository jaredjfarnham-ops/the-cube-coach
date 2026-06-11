/* ================================================================
   Cloud sync — Supabase email accounts + cross-device solve history.
   Loads AFTER app.js. Degrades to local/guest-only if the SDK or
   network is unavailable (e.g. opened via file://). A signed-in
   account is mirrored by a local profile (so all existing read/write
   code keeps working) that ALSO syncs each change to Supabase.
   ================================================================ */
(function () {
  const SUPABASE_URL = 'https://kzervfsdkmpyjasjqrqd.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_BAZg9zliMOksHrQZurx4zw_LlB5Tjqw';   // publishable key — safe in client code
  if (typeof supabase === 'undefined' || !supabase.createClient) return;   // offline / file:// → guest-only, no auth UI
  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } });

  let uid = null, email = null, accountPid = null, prevGuestPid = null;
  const signedIn = () => !!uid;
  const acctMap = () => JSON.parse(localStorage.getItem('coach-acct-map') || '{}');
  const setAcctMap = m => localStorage.setItem('coach-acct-map', JSON.stringify(m));
  const penToText  = p => p === 'dnf' ? 'dnf' : (p === 2 ? '2' : '0');
  const penFromTxt = s => s === 'dnf' ? 'dnf' : (s === '2' ? 2 : 0);

  /* reconcile ONE set's local times → cloud: upsert all current rows, delete any cloud rows no longer present.
     Fire-and-forget; only runs while the account profile is active. */
  async function cloudSyncSet(setId) {
    if (!signedIn() || Profiles.currentId() !== accountPid) return;
    const local = getSolves(setId);
    try {
      await dbOp(async () => {
        if (local.length) {
          const rows = local.map(s => ({ user_id: uid, set_id: setId, ms: Math.round(s.ms), penalty: penToText(s.p), t: s.t }));   // ms column is integer; raw times are float
          const up = await sb.from('solves').upsert(rows, { onConflict: 'user_id,set_id,t' });
          if (up.error) throw up.error;
        }
        let del = sb.from('solves').delete().eq('set_id', setId);
        const ts = local.map(s => s.t);
        if (ts.length) del = del.not('t', 'in', '(' + ts.join(',') + ')');
        const dr = await del; if (dr.error) throw dr.error;
      });
      setSyncStatus('✓ Synced', false);
    } catch (e) { console.warn('[cloud] sync failed for', setId, e.message || e); setSyncStatus(e && e._reauth ? 'Session expired — sign in again' : 'Sync error: ' + (e.message || e), true); }
  }
  window.cloudSyncSet = cloudSyncSet;
  function setSyncStatus(t, err) { const el = document.getElementById('authSync'); if (el) { el.textContent = t; el.classList.toggle('err', !!err); } }
  // expired-token recovery: the access token (JWT) lives ~1h; if a request hits an expired one
  // (e.g. the tab/computer was idle past the auto-refresh), refresh the session once and retry.
  const isAuthErr = e => /jwt|token|expired|401|not authenticated|invalid claim/i.test((e && (e.message || e.error_description)) || String(e));
  async function dbOp(run) {
    try { return await run(); }                                  // run() must throw on a Postgrest .error
    catch (e) {
      if (!isAuthErr(e)) throw e;
      const { data, error } = await sb.auth.refreshSession();
      if (error || !(data && data.session)) { const x = new Error('Session expired — sign in again'); x._reauth = true; throw x; }
      return await run();                                        // retry once with the fresh token
    }
  }

  /* mirror the account's custom algorithms + preferred-alg choices to the `user_algs` table.
     Replace-all (the data is tiny). Degrades to local-only if the table is missing / offline. */
  function algRows() {
    const d = Profiles.data(), rows = [];
    const cu = d.custom || {};
    for (const k of Object.keys(cu)) { const i = k.indexOf('/'), set_id = k.slice(0, i), case_name = k.slice(i + 1);
      (cu[k] || []).forEach(alg => rows.push({ user_id: uid, set_id, case_name, alg, role: 'custom' })); }
    const pf = d.algpref || {};
    for (const k of Object.keys(pf)) { const i = k.indexOf('/'); rows.push({ user_id: uid, set_id: k.slice(0, i), case_name: k.slice(i + 1), alg: pf[k], role: 'pref' }); }
    return rows;
  }
  async function cloudSaveAlgs() {
    if (!signedIn() || Profiles.currentId() !== accountPid) return;
    try {
      await dbOp(async () => {
        const del = await sb.from('user_algs').delete().eq('user_id', uid); if (del.error) throw del.error;
        const rows = algRows();
        if (rows.length) { const up = await sb.from('user_algs').insert(rows); if (up.error) throw up.error; }
      });
      setSyncStatus('✓ Synced', false);
    } catch (e) { console.warn('[cloud] custom-alg sync failed (kept locally):', e.message || e); if (e && e._reauth) setSyncStatus('Session expired — sign in again', true); }
  }
  window.cloudSaveAlgs = cloudSaveAlgs;
  async function cloudPullAlgs() {
    try {
      const r = await dbOp(async () => { const r = await sb.from('user_algs').select('set_id,case_name,alg,role'); if (r.error) throw r.error; return r; });
      const d = Profiles.data(); d.custom = d.custom || {}; d.algpref = d.algpref || {};
      r.data.forEach(row => { const k = row.set_id + '/' + row.case_name;
        if (row.role === 'pref') d.algpref[k] = row.alg;
        else { (d.custom[k] = d.custom[k] || []); if (!d.custom[k].includes(row.alg)) d.custom[k].push(row.alg); } });
      Profiles.save();
    } catch (e) { console.warn('[cloud] custom-alg pull skipped (table missing?):', e.message || e); }
    await cloudSaveAlgs();   // push any local-only additions back up
  }

  /* pull every cloud solve into the account profile, merge (cloud wins on identical timestamp; local-only kept),
     then push anything local-only back up so both sides converge to the union. */
  async function cloudPullMerge() {
    let rows;
    try { const r = await dbOp(async () => { const r = await sb.from('solves').select('set_id,ms,penalty,t'); if (r.error) throw r.error; return r; }); rows = r.data; }
    catch (e) { console.warn('[cloud] pull failed', e.message || e); setSyncStatus(e && e._reauth ? 'Session expired — sign in again' : 'Sync error: ' + (e.message || e), true); return; }
    const cloud = {};
    rows.forEach(r => { (cloud[r.set_id] = cloud[r.set_id] || []).push({ ms: r.ms, p: penFromTxt(r.penalty), t: Number(r.t) }); });
    const d = Profiles.data(); d.times = d.times || {};
    new Set([...Object.keys(d.times), ...Object.keys(cloud)]).forEach(setId => {
      const byT = new Map();
      (cloud[setId] || []).forEach(s => byT.set(s.t, s));                       // cloud first…
      (d.times[setId] || []).forEach(s => { if (!byT.has(s.t)) byT.set(s.t, s); }); // …keep local-only
      d.times[setId] = [...byT.values()].sort((a, b) => a.t - b.t);
    });
    Profiles.save();
    for (const setId of Object.keys(d.times)) await cloudSyncSet(setId);
    await cloudPullAlgs();
  }

  /* find or create the local profile that mirrors this account, and switch to it */
  function activateAccountProfile() {
    const map = acctMap(); let pid = map[uid];
    if (!pid || !Profiles.list().some(u => u.id === pid)) {
      pid = Profiles.add(email || 'Account');     // Profiles.add creates AND switches
      map[uid] = pid; setAcctMap(map);
    } else { Profiles.switchTo(pid); }
    Profiles.rename(pid, email || 'Account');
    accountPid = pid;
  }

  async function onSignIn(session) {
    if (uid === session.user.id) return;                 // already handled
    if (!signedIn()) prevGuestPid = Profiles.currentId(); // remember where to return on sign-out
    uid = session.user.id; email = session.user.email;
    activateAccountProfile();
    renderAuthUI();
    if (typeof refreshUserUI === 'function') refreshUserUI();
    if (typeof render === 'function') render();
    await cloudPullMerge();
    if (typeof reloadTimes === 'function') reloadTimes();
    if (typeof render === 'function') render();
  }
  function onSignOut() {
    uid = email = accountPid = null;
    if (prevGuestPid && Profiles.list().some(u => u.id === prevGuestPid)) Profiles.switchTo(prevGuestPid);
    else if (Profiles.list()[0]) Profiles.switchTo(Profiles.list()[0].id);
    renderAuthUI();
    if (typeof refreshUserUI === 'function') refreshUserUI();
    if (typeof render === 'function') render();
  }

  /* ---- auth UI injected at the top of the existing user menu ---- */
  const panel = document.getElementById('userPanel');
  const box = document.createElement('div'); box.className = 'auth-box';
  if (panel) panel.insertBefore(box, panel.firstChild);
  function renderAuthUI() {
    if (!panel) return;
    if (signedIn()) {
      box.innerHTML = `<div class="auth-on"><span class="cloud-dot">☁</span> Synced as <b></b></div>
        <div class="auth-sync" id="authSync">✓ Synced</div>
        <button class="ctl" id="authSignOut">Sign out</button>`;
      box.querySelector('b').textContent = email;
      box.querySelector('#authSignOut').onclick = () => sb.auth.signOut();
    } else {
      box.innerHTML = `<div class="auth-title">Sync across devices</div>
        <input class="auth-in" id="authEmail" type="email" placeholder="Email" autocomplete="email">
        <input class="auth-in" id="authPass" type="password" placeholder="Password" autocomplete="current-password">
        <div class="auth-btns"><button class="ctl" id="authLogin">Log in</button><button class="ctl" id="authSignup">Sign up</button></div>
        <div class="auth-msg" id="authMsg"></div>`;
      const em = box.querySelector('#authEmail'), pw = box.querySelector('#authPass'), msg = box.querySelector('#authMsg');
      const setMsg = (t, err) => { msg.textContent = t || ''; msg.classList.toggle('err', !!err); };
      const valid = () => em.value.trim() && pw.value.length >= 6 || (setMsg('Enter an email and a 6+ char password.', true), false);
      box.querySelector('#authLogin').onclick = async () => {
        if (!em.value.trim() || !pw.value) return setMsg('Enter your email and password.', true);
        setMsg('Signing in…');
        const { error } = await sb.auth.signInWithPassword({ email: em.value.trim(), password: pw.value });
        if (error) setMsg(error.message, true);
      };
      box.querySelector('#authSignup').onclick = async () => {
        if (!valid()) return;
        setMsg('Creating account…');
        const { data, error } = await sb.auth.signUp({ email: em.value.trim(), password: pw.value });
        if (error) setMsg(error.message, true);
        else if (data.user && !data.session) setMsg('Account created — check your email to confirm, then log in.');
        else setMsg('Account created!');
      };
    }
  }

  sb.auth.onAuthStateChange((_event, session) => {
    if (session && session.user) onSignIn(session);
    else if (signedIn()) onSignOut();
    else renderAuthUI();
  });
  renderAuthUI();   // initial paint (signed-out form); corrected by the auth-state callback if a session exists
})();
