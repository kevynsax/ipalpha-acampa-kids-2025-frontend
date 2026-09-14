# Camping Frontend 🏕️

React frontend for the children's camping management app of
**Igreja Presbiteriana em Alphaville**.

> ## ⭐ Design Rule #1 — Children's Layout
>
> **Everywhere it's possible, prefer to use a children's layout.**
>
> This is a children's camping app, so the UI should feel playful, warm and
> fun — even for the adults (parents, staff, admins) who use it.
>
> When building any new screen or component, keep it:
>
> - 🎨 **Colorful** — bright, cheerful colors (sky blues, sunny yellows, forest greens)
> - 🟠 **Rounded** — big rounded corners, pill buttons, soft shadows (bouncy!)
> - 🔤 **Fun typography** — `Baloo 2` for titles/numbers, `Nunito` for text
> - 🖐️ **Big touch targets** — children and busy parents use phones; buttons ≥ 48px
> - 😀 **Friendly voice** — emojis, encouraging messages ("Entrar na aventura! 🚀")
> - 🏕️ **Camping theme** — tents, trees, campfires, stars, forest animals
> - 🎈 **Delightful motion** — gentle bounce/pop animations (respect `prefers-reduced-motion`)
>
> Professional/admin-only screens (dashboards, reports) can be calmer, but
> should still keep the rounded, friendly identity. Never make it look
> corporate/boring if a playful option exists.

## Stack

- **React 18** + **TypeScript** + **Vite**
- Hand-crafted playful CSS (no UI framework yet — keep it light and fun)
- Talks to the [backend](../backend) REST API (Bun + Hono + MongoDB)

## Getting started

```bash
bun install   # or npm install
bun run dev   # or npm run dev
```

Runs at `http://localhost:5173`. Configure the API base URL in `.env`:

```
VITE_API_URL=http://localhost:3000
```

## Offline-first + PWA (the camp site has no internet) 📡

The app is built to keep working with **zero connectivity** once it has been
opened online one time:

- **All data lives on the device.** Every collection (campers, staff,
  bedrooms, categories, roles, events) is kept in `localStorage`
  (`src/store/index.ts`). Pages read from the store, never from the network.
- **The server pushes, the app never polls.** One WebSocket per session
  (`src/store/realtime.ts` ↔ backend `GET /api/realtime?token=…`) delivers a
  full **snapshot** on connect and an **update** after every write made by
  anyone. It reconnects with backoff, on `online` and when the app comes to
  the foreground.
- **Detail pages are joined locally** (`src/store/derive.ts` mirrors the
  backend `/detail` endpoints), so "camper → room → caretaker" navigation is
  instant and offline.
- **Writes still need the server** (REST). When it is unreachable the form
  shows *"Sem conexão com o servidor…"*; on success the result is applied
  optimistically and confirmed by the push.
- **PWA**: `vite-plugin-pwa` precaches the whole build (JS, CSS, all the
  paper-cut art) in a service worker; `manifest.webmanifest` uses the green
  "Acampa Kids" badge from the login page as the home-screen icon (`public/icons/`).
- **Install nag**: on a phone that is *not* running the installed app, a loud
  banner (`components/InstallBanner`) explains why and offers one-tap install
  (Android) or step-by-step instructions (iOS Safari). "Depois" snoozes it
  for 6 h only. It disappears once the app runs standalone.
- **Header dot** (`components/SyncStatus`): 🟢 ao vivo · 🟠 conectando · 🔴
  offline (using saved data). Tap to force a fresh snapshot.

> ⚠️ For installation the site must be served over **HTTPS** (or
> `localhost`). Browsers refuse to register a service worker on plain `http://`
> from another host. The WebSocket then needs `wss://` — the client derives it
> from `VITE_API_URL` automatically. **Geolocation** (self check-in) has the
> same HTTPS requirement.

## Self check-in (departure day) 📍

From **one hour before the first event** of the programme (departure day), a
team member's **Início** page opens a *"Cheguei na igreja!"* popup
(`components/SelfCheckinCard`). It can be dismissed (✕ / "Depois" / Esc /
tapping outside — remembered for the browser session); the same card then
stays inline on the page, in its usual place. One tap reads the phone's GPS
(`src/geo.ts`) and posts it to `POST /api/staff/me/checkin`; the server
accepts only inside the same window and when the device is within the
configured radius of the church. The card also shows the distance to the
meeting point and turns green once checked in (by the person or by the admin
roll call — both arrive through the realtime feed).

The meeting point is set by the admin under ⚙️ **Configurações → Check-in**
(`pages/admin/CheckinSettingsPage`, route `#/checkin-settings`): latitude /
longitude (pasting `"-23.48, -46.83"` from Google Maps fills both fields),
the accepted radius in metres, a "use my current location" shortcut and a
map preview. Default: Igreja Presbiteriana em Alphaville
(`-23.48053637134259, -46.83077891444747`, 300 m). The ⚙️ button now opens a
small sub-navigation: **Categorias** (`#/categories`), **Preparação**
(`#/preparation`), **Instruções** (`#/instructions-admin`), **Check-in**
(`#/checkin-settings`), **Organizadores** (`#/organizers`), **Equipe médica** (`#/medical`), **Important contacts** (`#/contacts`) and
**Notificações** (`#/notifications`) - a sidebar on wide screens, a pill strip
on phones.

## Preparação (before the camp) 🎒

`pages/PreparationPage` (`#/prep`) is what a team member reads while still
packing: a countdown to the first event, the **preparation of each role they
are scaled in** (e.g. "Inspeção: roupa verde estilo exército com boné" —
written on the role, `ScheduleRole.preparation`, joined locally by
`store/derive.ts#useMyPrepRoles`) and the **general sections** the admin
wrote (collection `preparation`, edited under ⚙️ **Preparação**, route
`#/preparation`, `pages/admin/PreparationAdminPage`). Each general section is
**posted to** one or more groups (`audiences`: pais / líderes / auxiliares,
`components/AudiencePicker#PrepAudiencePicker`); the server only sends each
person the sections posted to them. **Parents** get their own read-only
**Preparação** tab (`pages/parent/ParentPreparationPage`, same `#/prep`) with
the sections posted to "Pais"; the admin can text them about new / edited ones
(⚙️ Notificações → "Preparação nova / alterada para os pais").

**Which tab is the landing page depends on the camp phase** (`src/campPhase.ts`,
from the first event date in the programme): more than **3 days** before the
first event the team's tabs are *Preparação · Início · Programação · Instruções*
(prep first); from 3 days before, during and after the camp they are *Início ·
Preparação · Programação · Instruções* (room first). The default is re-evaluated
when the programme arrives from the server.

## Instruções (how to do each função) 📝

`pages/InstructionsPage` (`#/instructions?role=<id>`) is the team member's
how-to: **one tab per função** they are scaled in (explicit assignment or a
"for everyone" default — same join as Preparação, `useMyPrepRoles`); the
selected tab shows the role's **instructions in full** (`ScheduleRole.instructions`,
e.g. the PG study for the Líder) and the moments they do it. Tabs follow the
programme: the função happening now / next comes first and is the default;
funções whose every event already happened sink to the end, greyed out
(still readable). Roles without instructions are left out; the escala itself
stays in Programação and what to bring in Preparação.

### Images in the rich text editor 🖼️

`components/RichTextEditor` (TipTap) takes a `token`; with it the 🖼️ button,
paste and drag-and-drop upload pictures to `POST /api/files` (after shrinking
them on the device to ≤ 1280 px, `api/files.ts#shrinkImage`) and insert
them. HTML is stored with **relative** urls (`/api/files/<id>`);
`components/RichHtml` resolves them against `VITE_API_URL` when rendering.
The service worker caches those images (`CacheFirst`) so they show offline.

## Instructions (general documents) 📖

⚙️ **Configurações → 📖 Instruções** (`pages/admin/InstructionsAdminPage`,
`#/instructions-admin`): a list of big documents for the whole camp. The list shows
only titles (with ↑ ↓ reorder and ✏️); opening one (`#/instructions/:id`)
shows the whole document; ✏️ (`#/instructions/:id/edit`) opens a wide page
with the `RichTextEditor` in `tall` mode (60 vh editing area, sticky toolbar,
pictures via 🖼️ / paste / drag). The team gets a read-only **📖 Instruções**
tab (`pages/InstructionsPage`, `#/instructions`): same list → document, from
the local store, so it works offline.

## Check-in helpers & organizers (admin settings) 🙋🚌📋

⚙️ **Configurações → ✅ Check-in** (`pages/admin/CheckinSettingsPage`,
`#/checkin-settings`) gathers everything about departure day on one page,
each section saving on its own: the **time window** shared by the church and
bus helpers, the **church helpers**, the **bus helpers**
(`pages/admin/BusHelpersEditor`: who stands at each vehicle's door — only
vehicles with someone are listed; the section's top-right “add” asks the
vehicle first, then the person, and each listed vehicle has its own “add” that
goes straight to the person. One door per person, independent from the
transport they ride in) and the **meeting point + radius** for the team's own
self check-in. `pages/admin/StaffListEditor` (title + “add” button top-right
on the same line, chips, `StaffPicker`) is the shared list widget — the
organizers and medical team pages use it too, so every “add person” button
sits in the same spot.

While the window is open the listed people get the matching tab — **⛪
Check-in Igreja** (same `CheckinPage` as the admin, minus the per-vehicle
report, which lists the team) or **🚌 Check-in Ônibus** (`BusCheckinPage`
locked to the vehicle the admin linked them to, no picker). Church helpers
receive every camper with health data; bus helpers only the kids of their
linked vehicle, names only (`Camper.redacted`). `hooks/useCheckinHelper` reads the settings when the
socket comes online, sets a timer for the next window edge and, when it
fires, re-evaluates the tabs and asks the server for a fresh snapshot — so
tabs and kids appear / disappear on their own; when the window closes it also
purges the extra campers / bedrooms from localStorage right away (in case the
phone is offline at that moment). The server enforces the rules on every
request and push; the hook only drives the UI.

⚙️ **Configurações → Organizadores** (`pages/admin/OrganizersPage`,
`#/organizers`, worker-with-checklist icon `ICONS.organizer`): team members who
run the programme. They get the admin **Programação** tab (full
`SchedulePage`: events, roles, assignments) and a read-only **Equipe** tab
(`StaffPage readOnly`: search / filter / open people with full data, but no
"+ Novo", no ✏️, no 🗑️ and no ⬇️ Excel).

⚙️ **Configurações → Equipe médica** (`pages/admin/MedicalStaffPage`,
`#/medical`, health-staff icon): team members who look after the kids'
health. **No time window** — they get, the whole time, read-only
**Acampantes** (`CampersPage readOnly`: every kid with full health data,
search / filters / detail, no create / edit / Excel / print), **Quartos**
(`BedroomsPage readOnly`: every room and who sleeps there) and **Ônibus**
(`BusCheckinPage readOnly`: every vehicle, who is on board, nothing to tap).
The server scopes the data the same way (`medical: true`), and
`useCheckinHelper` never purges their campers / bedrooms at a window edge.

🚩 **Configurações → Times** (`pages/admin/TeamsPage`, `#/teams`): the camp
teams — name, **colour picker** (presets + native picker) and the team's
**coringa** (a staff member — not notified, it is not an access role). Teams replaced the old `equipe` category;
`useLabelOf()` resolves team ids too, and `TeamSelect` (components/
CategoryFields) is the form field. Deleting a team unlinks its people and
drops its score lines.

🏆 **Configurações → Placar** (`pages/admin/GameOrganizersPage`,
`#/game-organizers`): the GAME organizers. They are organizers too (same
rights: schedule, roles, whole team) and additionally write the scoreboard.
The list is shown read-only on **Organizadores** with a link here.

🏆 **Placar** tab (`pages/ScoreboardPage`, `#/scoreboard`): shown only while the
camp is on (first → last event day, `useCampTiming().during`). Every role sees the
ranking (colour bars, medals) and the ledger; the admin and game organizers get
➕ / ➖ (amount + optional note of why), 🔄 zero a team (writes a cancelling
line — history kept) and 🗑️ on a wrong line.

🦺 **Configurações → Coletes** (`pages/admin/VestHelpersPage`, `#/vests-settings`):
team members who hand out the team vests and take them back — the admin
does not do it. **No time window.** They get a **Coletes** tab
(`pages/VestPage`, `#/vests`) listing the whole team as **name + phone only**
(the server sends `redacted` records with `vest`), with "Entregar" /
"Devolver" buttons and an undo for each stamp, a status filter and a
WhatsApp shortcut. The admin has the same screen under Check-in → Coletes
(`#/checkin/vests`). Joining the list texts the person (Notificações →
Boas-vindas e novas responsabilidades).

## Contacts shared with parents 📞

⚙️ **Configurações → Important contacts** (`pages/admin/ParentContactsPage`,
`#/contacts`) stores an ordered list of purpose-specific contacts. Each item
has a title and one active staff member selected through the shared searchable
`StaffPicker`. Parents see them on their **Início** while the parents' window
is open (below); the page shows that window (check-in start → last event) so
the admin knows when the list is visible.

## Parents' area 👨‍👩‍👧

A parent logs in with the phone registered as the kid's guardian
(`Camper.guardianPhone`). Same header; two tabs:

- **Início** (`pages/parent/ParentHomePage`, `store/derive.ts#useParentHome`):
  the **important contacts** (title, name, phone, WhatsApp) on top, then one
  section per kid — name, birth date, team, room, bed, transport, the
  **caretaker** and the **team of the room** (name + phone + WhatsApp only;
  the server sends nothing else), **⚠️ Pontos de atenção** (weight, insurance
  + card, allergies, drug allergies, conditions, medication, food, medical
  notes, observations — editable by the parent through
  `pages/parent/AttentionEditDialog`, `PUT /api/campers/:id/parent`) and the
  kid's **QR code** (`components/CamperQr`, same link as the printed badge).
- **Programação** (`pages/parent/ParentSchedulePage`): the programme from the
  check-in onwards, no roles.
- Clicking their name opens `pages/parent/ParentProfile`: their data plus the
  emergency block of each kid (guardian, emergency contact, insurance,
  documents).

**Access window.** ⚙️ Geral has a second card (`pages/admin/AccessWindowCard`,
shared with the team's) — the **parents' access window**: when they may log
in at all. Each card says whether the welcome SMS will go out when the window
opens (green) or not because its toggle is off (yellow warning). Parents are
never texted about rooms or any other change.

**The parents' window** (`hooks/useParentWindow`, `settings.parentWindow`
from the server): from the start of the kids' check-in window to the end of
the last event. Outside it the contacts sections disappear, the caretaker is
hidden and the `staff` collection is **purged from localStorage** at the edge
(the server stops sending it too). **While the check-in window is open** the
kids' QR codes pop up in a dialog (`pages/parent/CheckinQrDialog`) every time
the app is opened or the tab comes back to the foreground — dismissible, but
sticky on purpose so the check-in goes fast; kids already checked in are left
out.

The admin sees every parent edit on the kid's page (🕓 button →
`pages/admin/CamperHistoryDialog`, `GET /api/campers/:id/changes`).

## SMS notifications (admin toggles) 📲

`pages/admin/NotificationsPage` has one switch per kind, saved instantly.
The two **welcome** switches (team / parents) ask for confirmation before
turning on, previewing how many people (and who) get the SMS immediately
(`GET /api/settings/welcome-preview`). The **bus check-in** and **parent
welcome** entries show the exact text parents receive.

- **Mudança de criança no quarto** — caretakers of a room are texted when a kid
  enters / leaves it.
- **Mudança de função na programação** — a person is texted when their role in
  an event changes (assigned, swapped, removed, event moved / cancelled,
  instructions edited).
- **Confirmação de check-in** — the person is texted when their church
  check-in is recorded (self check-in or admin roll call): *"seu check-in foi
  feito com sucesso. Lembre-se de conferir as crianças do seu quarto no app."*

The change SMS only says "houve uma mudança… abra o app"; the details are in
**Início** / **Programação**. A warning shows when the server has no SMS
provider configured.

## Login flow (implemented)

1. **Role selection** — church logo + 4 colorful cards:
   👨‍👩‍👧‍👦 Parents · 🎒 Staff · ⛑️ Health Staff · 🛠️ Admin
   (the same person can have several roles — they choose which one to enter as,
   and the choice is sent to the backend, which validates it against the
   person's roles)
2. **Phone number** — Brazilian mobile only (🇧🇷 +55 fixed, mask `(11) 98123-4567`)
3. **OTP code** — 6 digits sent by SMS (via Comtele), valid for **5 minutes**,
   **3 attempts** before the account is **frozen**; resend available after expiry
4. **Logged in** — session token kept in the browser for **24 hours**, then auto-logout

## Structure

```
src/
├── api/client.ts        # fetch wrapper with typed errors (writes only)
├── store/               # 📦 offline-first data: localStorage + WebSocket feed + local joins
├── pwa/install.ts       # standalone / beforeinstallprompt detection
├── auth/store.ts        # 24h session persistence (localStorage)
├── components/          # Logo, PhoneInput (BR mask), OtpInput (6 boxes)
├── pages/
│   ├── RoleSelect.tsx   # screen 1: 4 roles + church logo
│   ├── PhoneStep.tsx    # screen 2: cell phone
│   ├── OtpStep.tsx      # screen 3: code + countdown + attempts
│   └── SuccessPage.tsx  # screen 4: logged in
├── roles.ts             # shared role metadata (labels, colors, emojis)
├── phone.ts             # BR phone mask/validation helpers
└── styles.css           # 🎨 children's camping theme
```

## Coming next

- Parent area: enroll kids, medical forms, packing list, photos
- Staff area: schedules, activity groups, check-in/out
- Health area: incident log, medications, allergies
- Admin area: registrations, staff management, reports
