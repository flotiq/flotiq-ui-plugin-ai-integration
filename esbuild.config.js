import * as esbuild from "esbuild";
import { copy } from "esbuild-plugin-copy";
import inlineImportPlugin from "esbuild-plugin-inline-import";
import postcss from "postcss";
import url from "postcss-url";
import fs from "node:fs";
import http from "node:http";
import https from "node:https";

const watch = process.argv.includes("--watch");

const postCssTransformer = (code, path) =>
    postcss([url({ url: "inline" })])
        .process(code, { from: path })
        .then((result) => result.css);

const context = await esbuild.context({
    entryPoints: ["plugins/index.js"],
    bundle: true,
    minify: !watch,
    sourcemap: true,
    outfile: "dist/index.js",
    plugins: [
        copy({
            resolveFrom: "cwd",
            assets: {
                from: ["./plugin-manifest.json"],
                to: ["dist/plugin-manifest.json"],
            },
            watch: true,
        }),

        inlineImportPlugin({
            transform: (code, { path }) =>
                path.endsWith(".css") ? postCssTransformer(code, path) : code,
        }),
    ],
});

if (!watch) {
    await context.rebuild();
    context.dispose();
    console.log("Built dist/index.js");
} else {
    await context.watch();

    const { host, port } = await context.serve({ servedir: "dist", port: 3050 });

    const cors = {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "OPTIONS, POST, GET",
        "access-control-allow-headers": "*",
        "access-control-max-age": 2592000,
    };

    // Flotiq editor is served over https, so the plugin file must be too.
    https
        .createServer(
            {
                key: fs.readFileSync("./.dev/localhost.key"),
                cert: fs.readFileSync("./.dev/localhost.cert"),
            },
            (req, res) => {
                if (req.method === "OPTIONS") {
                    res.writeHead(204, cors);
                    res.end();
                    return;
                }
                const proxyReq = http.request(
                    {
                        hostname: host,
                        port,
                        path: req.url,
                        method: req.method,
                        headers: req.headers,
                    },
                    (proxyRes) => {
                        res.writeHead(proxyRes.statusCode, {
                            ...proxyRes.headers,
                            ...cors,
                        });
                        proxyRes.pipe(res, { end: true });
                    },
                );
                req.pipe(proxyReq, { end: true });
            },
        )
        .listen(3053);

    console.log("https://localhost:3053/index.js");
    console.log("https://localhost:3053/plugin-manifest.json");
}
