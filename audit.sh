#!/usr/bin/env bash
# =============================================================================
# Code audit.
#
#   cd ~/shehnai-storefront
#   bash audit.sh                     # needs MANIFEST.txt in the same folder
#
# Answers three questions:
#   1. Does my checkout match the released source? (extra / missing / modified)
#   2. Is there dead code — unreachable files, unused exports, unused deps?
#   3. Is anything obviously wrong before I trust this as my baseline?
#
# Read-only. Prints a suggested cleanup at the end; runs nothing itself.
# =============================================================================
set -uo pipefail

G=$'\033[1;32m'; R=$'\033[1;31m'; Y=$'\033[1;33m'; B=$'\033[1;35m'; N=$'\033[0m'
sec() { printf "\n${B}%s${N}\n" "$1"; }
ok()  { printf "  ${G}✓${N} %s\n" "$1"; }
no()  { printf "  ${R}✗${N} %s\n" "$1"; }
hm()  { printf "  ${Y}!${N} %s\n" "$1"; }

[[ -f package.json ]] || { echo "Run from the project root."; exit 1; }
MANIFEST="${MANIFEST:-MANIFEST.txt}"
CLEAN=$(mktemp); trap 'rm -f "$CLEAN" /tmp/aud.*' EXIT

# ---------------------------------------------------------------------------
sec "1. Checkout vs released source"

if [[ ! -f "$MANIFEST" ]]; then
  hm "MANIFEST.txt not found — skipping. Put it in this folder to enable."
else
  # Same exclusions the manifest was built with.
  find . -type f \
    -not -path './node_modules/*' -not -path './.next/*' -not -path './.git/*' \
    -not -path './prisma/migrations/*' \
    -not -name '.env' -not -name '*.tsbuildinfo' -not -name 'package-lock.json' \
    -not -name 'next-env.d.ts' -not -name 'reference-design.html' -not -name '*.log' \
    -not -name 'MANIFEST.txt' -not -name 'audit.sh' -not -name 'status.sh' \
    | sed 's|^\./||' | sort > /tmp/aud.actual

  awk '{print $2}' "$MANIFEST" | sort > /tmp/aud.expected

  EXTRA=$(comm -23 /tmp/aud.actual /tmp/aud.expected)
  MISSING=$(comm -13 /tmp/aud.actual /tmp/aud.expected)

  if [[ -z "$EXTRA" ]]; then ok "no unexpected files"
  else
    no "files present that are NOT part of the release — likely dead code:"
    while read -r f; do [[ -n "$f" ]] && printf "        %s\n" "$f"; done <<<"$EXTRA"
  fi

  if [[ -z "$MISSING" ]]; then ok "no missing files"
  else
    no "files from the release that are MISSING here:"
    while read -r f; do [[ -n "$f" ]] && printf "        %s\n" "$f"; done <<<"$MISSING"
  fi

  # Content drift, ignoring files you are expected to edit locally.
  DRIFT=0
  while read -r sum f; do
    [[ -f "$f" ]] || continue
    case "$f" in
      deploy/*|*.md|package.json) continue ;;   # locally tuned, expected to differ
    esac
    got=$(sha256sum "$f" | cut -c1-16)
    if [[ "$got" != "$sum" ]]; then
      [[ "$DRIFT" -eq 0 ]] && no "modified compared to the release:"
      printf "        %s\n" "$f"; DRIFT=1
    fi
  done < "$MANIFEST"
  [[ "$DRIFT" -eq 0 ]] && ok "all source files match the release"
fi

# ---------------------------------------------------------------------------
sec "2. Unreachable modules"
if [[ -f scripts/check-orphans.mjs ]]; then
  node scripts/check-orphans.mjs 2>&1 | sed 's/^/  /'
else
  hm "scripts/check-orphans.mjs not present"
fi

# ---------------------------------------------------------------------------
sec "3. Exported symbols nothing imports"
node - <<'JS' 2>/dev/null | sed 's/^/  /'
const fs=require('fs'), path=require('path');
const files=[];
(function w(d){for(const e of fs.readdirSync(d)){const p=path.join(d,e);
  fs.statSync(p).isDirectory()?w(p):/\.tsx?$/.test(p)&&files.push(p);}})('src');
const all=files.map(f=>({f,src:fs.readFileSync(f,'utf8')}));
const ENTRY=/^(page|layout|route|middleware|not-found|error|template|loading)\.(ts|tsx)$/;
let dead=0;
for(const {f,src} of all){
  if(ENTRY.test(path.basename(f))) continue;
  const names=new Set();
  for(const m of src.matchAll(/export\s+(?:async\s+)?(?:function|const|class)\s+(\w+)/g)) names.add(m[1]);
  for(const m of src.matchAll(/export\s+(?:type|interface)\s+(\w+)/g)) names.add(m[1]);
  for(const n of names){
    const used=all.some(o=>o.f!==f && new RegExp('\\b'+n+'\\b').test(o.src));
    if(!used){ console.log(`unused export: ${n}  (${path.relative('.',f)})`); dead++; }
  }
}
console.log(dead? `${dead} unused export(s) — safe to delete, or intentional API surface`
                : 'every export is imported somewhere');
JS

# ---------------------------------------------------------------------------
sec "4. Dependencies declared but never imported"
node - <<'JS' 2>/dev/null | sed 's/^/  /'
const fs=require('fs'), path=require('path');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
let src='';
(function w(d){for(const e of fs.readdirSync(d)){const p=path.join(d,e);
  if(fs.statSync(p).isDirectory()) w(p);
  else if(/\.(ts|tsx|mjs|js)$/.test(p)) src+=fs.readFileSync(p,'utf8');}})('src');
for(const extra of ['prisma','scripts','next.config.ts','tailwind.config.ts','postcss.config.mjs'])
  try{ const st=fs.statSync(extra);
    if(st.isDirectory()){ (function w(d){for(const e of fs.readdirSync(d)){const p=path.join(d,e);
      fs.statSync(p).isDirectory()?w(p):/\.(ts|tsx|mjs|js)$/.test(p)&&(src+=fs.readFileSync(p,'utf8'));}})(extra); }
    else src+=fs.readFileSync(extra,'utf8');
  }catch{}
// Packages used by tooling rather than by an import statement.
const IMPLICIT=new Set(['next','react','react-dom','typescript','tailwindcss','postcss',
  'autoprefixer','eslint','eslint-config-next','prisma','tsx','sharp',
  '@types/node','@types/react','@types/react-dom','@types/bcryptjs']);
let n=0;
for(const dep of Object.keys({...pkg.dependencies,...pkg.devDependencies})){
  if(IMPLICIT.has(dep)) continue;
  if(!new RegExp(`["'](${dep.replace(/[/\\^$*+?.()|[\]{}]/g,'\\$&')})(/|["'])`).test(src)){
    console.log(`never imported: ${dep}`); n++;
  }
}
console.log(n? `${n} package(s) you could remove` : 'every dependency is used');
JS

# ---------------------------------------------------------------------------
sec "5. Loose ends in the code"
T=$(grep -rInE '\b(TODO|FIXME|HACK|XXX)\b' src prisma scripts 2>/dev/null | head -12)
[[ -z "$T" ]] && ok "no TODO/FIXME markers" || { hm "markers found:"; sed 's/^/        /' <<<"$T"; }

D=$(grep -rIn 'console\.log' src 2>/dev/null | grep -v '/admin/' | head -8)
[[ -z "$D" ]] && ok "no stray console.log in the storefront" || { hm "console.log left in:"; sed 's/^/        /' <<<"$D"; }

S=$(grep -rIn -E '(rzp_live_|sk_live_|password\s*=\s*["'"'"'][^"'"'"']{6,})' src prisma 2>/dev/null | head -5)
[[ -z "$S" ]] && ok "no hardcoded secrets in source" || { no "possible secret in source:"; sed 's/^/        /' <<<"$S"; }

# ---------------------------------------------------------------------------
sec "6. Git state"
if [[ -d .git ]]; then
  ok "git repo present  (branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null))"
  ok "last commit: $(git log -1 --format='%h %s' 2>/dev/null | cut -c1-60)"
  U=$(git status --porcelain 2>/dev/null | head -12)
  [[ -z "$U" ]] && ok "working tree clean" || { hm "uncommitted changes:"; sed 's/^/        /' <<<"$U"; }
  git check-ignore -q .env 2>/dev/null && ok ".env is gitignored" || no ".env is NOT gitignored — it holds your DB password"
  git ls-files --error-unmatch .env >/dev/null 2>&1 && no ".env is COMMITTED — rotate those secrets" || true
else
  hm "not a git repo — no history to compare against"
fi

# ---------------------------------------------------------------------------
sec "7. Build integrity"
if [[ -d .next ]]; then
  OWN=$(stat -c '%U' .next)
  SVC=$(stat -c '%U' package.json)
  [[ "$OWN" == "$SVC" ]] && ok ".next owned by $OWN (matches project)" \
    || no ".next owned by $OWN but project by $SVC — run: sudo chown -R $SVC:$SVC .next"
  NEW=$(find src prisma -newer .next -type f 2>/dev/null | head -3)
  [[ -z "$NEW" ]] && ok "build is newer than all source" || { hm "source changed since the last build — rebuild:"; sed 's/^/        /' <<<"$NEW"; }
else
  hm ".next missing — not built yet"
fi

# ---------------------------------------------------------------------------
sec "8. Route inventory"
printf "  %-42s %s\n" "ROUTE" "FILE"
find src/app -name 'page.tsx' 2>/dev/null | sort | while read -r f; do
  r=$(sed -e 's|^src/app||' -e 's|/page.tsx$||' <<<"$f"); r="${r:-/}"
  printf "  %-42s %s\n" "$r" "$f"
done
echo
find src/app/api -name 'route.ts' 2>/dev/null | sort | while read -r f; do
  r=$(sed -e 's|^src/app||' -e 's|/route.ts$||' <<<"$f")
  printf "  %-42s %s\n" "$r" "$f"
done

# ---------------------------------------------------------------------------
sec "Summary"
cat <<'EOF'
  If section 1 listed unexpected files, those are leftovers from an older
  release. Delete them, then re-run:

      npm run verify && npm run build:app

  Note: use build:app on a VPS, not build — `build` runs prisma migrate deploy,
  which fails on a db:push database with no migration files (error P3005).

  To make this checkout your clean baseline:

      git init                       # if not already a repo
      git add -A && git commit -m "Baseline: verified deployment"
EOF
echo
