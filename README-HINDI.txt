ARUN HACKER STOR — SETUP GUIDE (Hindi)

PROJECT FILES
- index.html, style.css, app.js: website
- config.js: Supabase project URL + anon/public key
- supabase.sql: database/storage setup

IMPORTANT SECURITY
1. config.js me sirf Supabase anon/public key use karein.
2. service_role key ya secret key kabhi website/GitHub me na daalein.
3. Supabase Authentication me public sign-ups DISABLE karein.
4. Sirf apna admin user Supabase Dashboard > Authentication > Users se banayein.
5. APK/ZIP sirf wahi upload karein jise share karne ka aapko adhikar hai. Download karne walon ko install se pehle file scan karne ko kahen.

STEP 1 — SUPABASE
1. supabase.com par login karke New project banayein.
2. Project ka database password safe jagah likh lein.
3. Project open > SQL Editor > New query.
4. Is project ke supabase.sql ka poora code paste karke RUN karein.
5. Authentication > Providers > Email me Email provider enabled rakhein.
6. Authentication > Settings / Sign In settings me Allow new users to sign up OFF karein.
7. Authentication > Users > Add user se apna email/password admin banayein. Email confirm ka option aaye to confirm user create karein.
8. Project Settings > API (ya Data API / API Keys) me Project URL aur anon/public key copy karein. Publishable key bhi supported ho sakti hai; service_role/secret key NAHI.
9. config.js kholein aur dono placeholder ko apne URL aur anon/public key se replace karein. Save karein.

STEP 2 — GITHUB
1. GitHub me New repository banayein: arun-hacker-app-store
2. ZIP ko phone/computer me extract karein.
3. Repository > Add file > Upload files.
4. Extract ki hui folder ke ANDAR ki files upload karein (index.html, style.css, app.js, config.js, supabase.sql, README-HINDI.txt). Folder ko ek aur folder ke andar upload na karein.
5. Commit changes karein.

STEP 3 — VERCEL
1. vercel.com par GitHub se login karein.
2. Add New > Project > apni repository Import karein.
3. Framework Preset: Other. Build Command aur Output Directory blank/default rakhein.
4. Deploy dabayein. index.html root me hona chahiye.
5. Deployment URL open karein. Store list load honi chahiye.

STEP 4 — TEST
1. Website par ADMIN LOGIN dabayein.
2. Supabase me banaya admin email/password use karein.
3. Title, version, category, description aur APK/ZIP choose karke Upload karein.
4. Logout ya incognito tab me public store check karein; file card aur download button dikhna chahiye.

LIMITS / NOTES
- Is starter project me upload limit 100 MB set hai. Supabase plan limits, storage quota, bandwidth aur file-size limits apply karte hain. Free plan me large files/bahut downloads ki guarantee nahi.
- Storage bucket public hai: file links share kiye ja sakte hain. Store listing public hai.
- Admin-only access tabhi sahi rahega jab public sign-ups disabled hon aur sirf aapka trusted admin user ho. Agar baad me aur staff accounts banayein, current authenticated policies unhe bhi admin-level upload access denge; tab admin-user-specific RLS policies lagani hongi.
- Download counter best-effort hai; browser download prompt/device behavior par depend karta hai.
- APK/ZIP security: unknown files ko upload na karein; malware scan karein; copyright/permission ka dhyan rakhein.
