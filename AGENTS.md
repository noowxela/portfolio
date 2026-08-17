<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

Keep `turbopack.root` as `path.resolve(process.cwd())` so Next does not treat `/Users/alexwoon/Documents/github` as the app. A parent lockfile or a wrong `__dirname` in compiled `next.config.ts` makes `next-themes` resolve from the wrong `node_modules`.
