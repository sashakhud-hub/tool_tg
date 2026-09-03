// Кладёт прототипы в выдачу Vercel: собирает компонентную версию
// и копирует обе сборки в src/web/dist/prototypes.
import { execSync } from "node:child_process"
import { cpSync, mkdirSync, existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const out = join(root, "src/web/dist/prototypes")
const app = join(root, "prototypes/fluid-app")

execSync("npm install --no-audit --no-fund && npm run build", { cwd: app, stdio: "inherit" })

mkdirSync(join(out, "app"), { recursive: true })
mkdirSync(join(out, "chat"), { recursive: true })
cpSync(join(app, "dist"), join(out, "app"), { recursive: true })
cpSync(join(root, "prototypes/first-experience/index.html"), join(out, "chat/index.html"))
cpSync(join(root, "prototypes/index.html"), join(out, "index.html"))

if (!existsSync(join(out, "app/index.html"))) {
  throw new Error("Компонентная версия не собралась: нет app/index.html")
}
console.log("Прототипы собраны в", out)
