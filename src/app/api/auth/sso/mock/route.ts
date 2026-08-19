import { NextResponse } from 'next/server';
import { accountRepository } from '@/src/data/account/repository/account_repository_impl';
import { ROLES_LIST } from '@/src/core/constants/roles';

export async function GET(request: Request) {
  // Fetch existing SSO accounts to display in the chooser
  const allAccounts = await accountRepository.getAll();
  const ssoAccounts = allAccounts.filter(acc => acc.username.includes('@'));

  const rolesOptions = ROLES_LIST.map(role => `<option value="${role}">${role}</option>`).join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in - Google Accounts (Simulation)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      background-color: #020617;
      color: #f8fafc;
      font-family: system-ui, -apple-system, sans-serif;
    }
  </style>
</head>
<body class="min-h-screen flex items-center justify-center p-6 select-none">
  <div class="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
    
    <!-- Google Logo Header -->
    <div class="text-center space-y-2">
      <div class="inline-flex items-center justify-center gap-1.5 font-bold text-lg tracking-tight text-white mb-2">
        <svg class="w-6 h-6" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
        <span>Google Workspace</span>
      </div>
      <h1 class="text-xl font-semibold text-white">Choose an account</h1>
      <p class="text-xs text-slate-400">to continue to <span class="font-semibold text-purple-400">Mock API Studio</span></p>
    </div>

    <!-- Error Alert -->
    <div id="error-box" class="hidden p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl items-center gap-2">
      <span id="error-message"></span>
    </div>

    <!-- Step 1: Chooser Screen -->
    <div id="step-chooser" class="space-y-4">
      <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
        ${ssoAccounts.map(acc => `
          <div onclick="selectAccount('${acc.username}')" class="flex items-center justify-between p-3 bg-slate-950 border border-slate-850 hover:border-purple-500/50 rounded-xl cursor-pointer transition-all">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-slate-850 flex items-center justify-center text-xs font-bold text-slate-300 font-mono">
                ${acc.name.charAt(0).toUpperCase()}
              </div>
              <div class="min-w-0">
                <p class="text-xs font-semibold text-white truncate">${acc.name}</p>
                <p class="text-[10px] text-slate-500 truncate font-mono">${acc.username}</p>
              </div>
            </div>
            <span class="text-[10px] bg-slate-850 text-slate-400 px-2 py-0.5 rounded-md font-medium">${acc.role}</span>
          </div>
        `).join('')}
      </div>

      <div onclick="showManualEmailForm()" class="flex items-center gap-3 p-3 bg-slate-950/30 border border-slate-850 border-dashed hover:border-purple-500/50 rounded-xl cursor-pointer transition-all">
        <div class="w-8 h-8 rounded-full border border-dashed border-slate-700 flex items-center justify-center text-slate-500">
          +
        </div>
        <span class="text-xs font-medium text-slate-300">Use another account</span>
      </div>
    </div>

    <!-- Step 2: Manual Email Input -->
    <form id="step-email" onsubmit="submitEmail(event)" class="hidden space-y-4">
      <div class="space-y-1.5">
        <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Work Email Address</label>
        <input id="email-input" type="email" required placeholder="name@finansia.com" class="w-full text-xs px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/15 font-mono" />
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <button type="button" onclick="showChooser()" class="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-850 hover:bg-slate-800 rounded-xl">Back</button>
        <button type="submit" class="px-4 py-2 text-xs font-semibold bg-white text-slate-950 hover:bg-slate-100 rounded-xl">Next</button>
      </div>
    </form>

    <!-- Step 3: Registration Profile (for unregistered users) -->
    <form id="step-register" onsubmit="submitRegistration(event)" class="hidden space-y-4">
      <p class="text-[11px] text-slate-400 leading-relaxed">
        Your email domain is whitelisted! Please complete your profile to activate your new account.
      </p>

      <div class="space-y-1.5">
        <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Display Name *</label>
        <input id="name-input" type="text" required placeholder="e.g. John Doe" class="w-full text-xs px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/15" />
      </div>

      <div class="space-y-1.5">
        <label class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Select Role *</label>
        <select id="role-select" class="w-full text-xs px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/15">
          ${rolesOptions}
        </select>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <button type="button" onclick="showManualEmailForm()" class="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-850 hover:bg-slate-800 rounded-xl">Back</button>
        <button type="submit" class="px-4 py-2 text-xs font-semibold bg-white text-slate-950 hover:bg-slate-100 rounded-xl">Complete & Sign In</button>
      </div>
    </form>

  </div>

  <script>
    let selectedEmail = '';

    function showChooser() {
      document.getElementById('step-chooser').classList.remove('hidden');
      document.getElementById('step-email').classList.add('hidden');
      document.getElementById('step-register').classList.add('hidden');
      hideError();
    }

    function showManualEmailForm() {
      document.getElementById('step-chooser').classList.add('hidden');
      document.getElementById('step-email').classList.remove('hidden');
      document.getElementById('step-register').classList.add('hidden');
      hideError();
    }

    function showRegisterForm(email) {
      selectedEmail = email;
      document.getElementById('step-chooser').classList.add('hidden');
      document.getElementById('step-email').classList.add('hidden');
      document.getElementById('step-register').classList.remove('hidden');

      // Autofill name from email prefix
      const prefix = email.split('@')[0] || '';
      const beautifiedName = prefix
        .split('.')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
      document.getElementById('name-input').value = beautifiedName;
      hideError();
    }

    function showError(msg) {
      const box = document.getElementById('error-box');
      document.getElementById('error-message').textContent = msg;
      box.classList.remove('hidden');
      box.classList.add('flex');
    }

    function hideError() {
      const box = document.getElementById('error-box');
      box.classList.add('hidden');
      box.classList.remove('flex');
    }

    async function selectAccount(email) {
      await processSsoLogin(email);
    }

    async function submitEmail(e) {
      e.preventDefault();
      hideError();
      const email = document.getElementById('email-input').value.trim();
      await processSsoLogin(email);
    }

    async function submitRegistration(e) {
      e.preventDefault();
      hideError();
      const name = document.getElementById('name-input').value.trim();
      const role = document.getElementById('role-select').value;
      await processSsoLogin(selectedEmail, { name, role });
    }

    async function processSsoLogin(email, registerExtra = null) {
      try {
        const payload = { username: email, password: '', rememberMe: false };
        if (registerExtra) {
          payload.registerExtra = registerExtra;
        }

        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok || data.success === false) {
          showError(data.error || 'Authentication failed');
          return;
        }

        if (data.requiresRegistration) {
          showRegisterForm(email);
          return;
        }

        // Redirect popup back to callback callback to trigger refresh/close script
        window.location.href = '/api/auth/sso/callback?success=true';
      } catch (err) {
        showError('Network error occurred.');
      }
    }
  </script>
</body>
</html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
