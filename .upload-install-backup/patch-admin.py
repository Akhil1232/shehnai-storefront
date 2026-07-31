"""Switches the admin image fields from URL-only to file upload."""
import io, os, subprocess

def edit(path, changes):
    if not os.path.exists(path):
        print("  skip   %s (not present)" % path); return
    s = io.open(path, encoding="utf-8").read()
    before = s
    for old, new in changes:
        if old in s:
            s = s.replace(old, new)
        elif new not in s:
            print("  WARN   %s: a snippet did not match, left as-is" % path)
    if s != before:
        io.open(path, "w", encoding="utf-8").write(s)
        print("  done   %s" % path)
    else:
        print("  done   %s (already up to date)" % path)

IMP_A_OLD = 'import { Card, Field, TextArea, Select, Checkbox, ImageField, SubmitButton } from "@/components/admin/ui";'
IMP_A_NEW = ('import { Card, Field, TextArea, Select, Checkbox, SubmitButton } from "@/components/admin/ui";\n'
             'import ImageUpload from "@/components/admin/ImageUpload";')
IMP_B_OLD = 'import { Card, Field, Select, Checkbox, ImageField, SubmitButton } from "@/components/admin/ui";'
IMP_B_NEW = ('import { Card, Field, Select, Checkbox, SubmitButton } from "@/components/admin/ui";\n'
             'import ImageUpload from "@/components/admin/ImageUpload";')

edit("src/app/admin/products/[id]/page.tsx", [
    (IMP_A_OLD, IMP_A_NEW),
    ('<ImageField label="Image URL" name="url" spec="2000 \u00d7 2000" />',
     '<ImageUpload label="Product image" name="url" spec="2000 \u00d7 2000" preset="product" />'),
])

edit("src/app/admin/sections/page.tsx", [
    (IMP_A_OLD, IMP_A_NEW),
    ('<ImageField label="Main image" name="mediaUrl" defaultValue={s.mediaUrl} spec="1200 \u00d7 1500 (4:5)" />',
     '<ImageUpload label="Main image" name="mediaUrl" defaultValue={s.mediaUrl} spec="1200 \u00d7 1380" preset="editorial" />'),
])

OLD_SPEC = (
'const SPEC: Record<string, { desktop: string; mobile: string; note: string }> = {\n'
'  HOME_HERO: { desktop: "2400 \u00d7 1000", mobile: "1080 \u00d7 1350", note: "Keep the subject right-of-centre; copy overlays on the left." },\n'
'  HOME_TRIPTYCH: { desktop: "900 \u00d7 1200", mobile: "900 \u00d7 1200", note: "Exactly 3 active. sortOrder 0 = left, 1 = CENTRE (largest), 2 = right." },\n'
'  CATEGORY_HEADER: { desktop: "1920 \u00d7 640", mobile: "1080 \u00d7 720", note: "Pick a vertical below, or it won\'t appear anywhere." },\n'
'  PROMO_STRIP: { desktop: "text only", mobile: "text only", note: "Uses the Title field only." },\n'
'};')

NEW_SPEC = (
'type Preset = "hero" | "triptych" | "category" | "free";\n'
'\n'
'// The hero frame is PORTRAIT - it sits in a tall arch beside the headline, so\n'
'// a landscape image gets badly cropped. The old 2400x1000 note was wrong.\n'
'const SPEC: Record<string, { desktop: string; mobile: string; note: string; preset: Preset }> = {\n'
'  HOME_HERO: { desktop: "1200 \u00d7 1400", mobile: "1080 \u00d7 1260", preset: "hero",\n'
'    note: "Portrait. The top ~25% curves away behind the arch - keep it empty." },\n'
'  HOME_TRIPTYCH: { desktop: "900 \u00d7 1200", mobile: "900 \u00d7 1200", preset: "triptych",\n'
'    note: "sortOrder 1 is the centre panel, the one currently shown. Top ~25% is arch-cropped." },\n'
'  CATEGORY_HEADER: { desktop: "1920 \u00d7 640", mobile: "1080 \u00d7 720", preset: "category",\n'
'    note: "Pick a vertical below, or it won\'t appear anywhere." },\n'
'  PROMO_STRIP: { desktop: "text only", mobile: "text only", preset: "free",\n'
'    note: "Uses the Title field only - no image needed." },\n'
'};')

edit("src/app/admin/banners/page.tsx", [
    (IMP_B_OLD, IMP_B_NEW),
    (OLD_SPEC, NEW_SPEC),
    ('<ImageField label="Desktop image" name="desktopUrl" defaultValue={b.desktopUrl} spec={spec.desktop} />',
     '<ImageUpload label="Desktop image" name="desktopUrl" defaultValue={b.desktopUrl} spec={spec.desktop} preset={spec.preset} />'),
    ('<ImageField label="Mobile image" name="mobileUrl" defaultValue={b.mobileUrl} spec={spec.mobile} />',
     '<ImageUpload label="Mobile image" name="mobileUrl" defaultValue={b.mobileUrl} spec={spec.mobile} preset={spec.preset} />'),
    ('<ImageField label="Desktop image" name="desktopUrl" spec="see placement above" />',
     '<ImageUpload label="Desktop image" name="desktopUrl" spec="see placement above" preset="free" />'),
    ('<ImageField label="Mobile image" name="mobileUrl" spec="see placement above" />',
     '<ImageUpload label="Mobile image" name="mobileUrl" spec="see placement above" preset="free" />'),
])

left = subprocess.run(["grep", "-rl", "ImageField", "src/app/admin"],
                      capture_output=True, text=True).stdout.strip()
if left:
    print("  WARN   ImageField still referenced in:")
    for f in left.split("\n"):
        print("         " + f)
